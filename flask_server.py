from functools import wraps
import json
import os
import traceback
from dotenv import load_dotenv
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import pandas as pd
from werkzeug.utils import secure_filename
import pickle
from llama_index import GPTSimpleVectorIndex
from google.oauth2 import service_account
from utils import SERVICE_CONTEXT, insert_into_index, answer_question


stored_docs = {}

app = Flask(__name__)
CORS(app)
API_PASSWORD = os.getenv("API_PASSWORD")
INDEX_NAME = os.getenv("INDEX_NAME")
PKL_NAME = os.getenv("PKL_NAME")
CREDENTIALS = service_account.Credentials.from_service_account_file("creds.json")


def authenticate(func):
    @wraps(func)
    def decorated(*args, **kwargs):
        # Perform authentication logic here
        # For example, check if the request contains a valid access token
        access_token = request.headers.get("Authorization")
        if not access_token:
            return jsonify({"error": "Unauthorized access."}), 401
        if access_token != API_PASSWORD:
            return jsonify({"error": "Invalid access token."}), 401
        # Here, you can validate the access token against your authentication system

        # For simplicity, we assume authentication is successful and set the user in the 'g' context object
        # g.user = {'id': 123, 'email': 'user@example.com'}
        return func(*args, **kwargs)

    return decorated


@app.route("/query", methods=["GET"])
@authenticate
def query_index():
    index = GPTSimpleVectorIndex.load_from_disk(
        INDEX_NAME, service_context=SERVICE_CONTEXT
    )
    query_text = request.args.get("text", None)
    data_source = request.args.get("data_source", None)
    if query_text is None:
        return "No text found, please include a ?text=blah parameter in the URL", 400
    if data_source == "Documents":
        response = index.query(query_text)
        response_json = {
            "text": str(response),
            "sources": [
                {
                    "text": str(x.source_text),
                    "similarity": round(x.similarity, 2),
                    "doc_id": str(x.doc_id),
                    "start": x.node_info["start"],
                    "end": x.node_info["end"],
                }
                for x in response.source_nodes
            ],
        }
    elif data_source == "BigQuery":
        response = answer_question(query_text, CREDENTIALS)
        response_json = {
            "text": response["answer"],
            "summary": response["summary"],
            "sql_query": response["sql_query"],
        }
    else:
        return (
            "No data source found, please include a ?data_source=Documents or ?data_source=BigQuery parameter in the URL",
            400,
        )
    return make_response(jsonify(response_json)), 200


@app.route("/uploadFile", methods=["POST"])
@authenticate
def upload_file():
    if "file" not in request.files:
        return "Please send a POST request with a file", 400
    filepath = None
    try:
        uploaded_file = request.files["file"]
        filename = secure_filename(uploaded_file.filename)
        filepath = os.path.join("documents", os.path.basename(filename))
        uploaded_file.save(filepath)
        if filename.endswith(".xlsx") or filename.endswith(".xls"):
            urls = pd.read_excel(filepath, header=None, names=["URL"])
            for url in urls["URL"]:
                insert_into_index(url, kind="url", doc_id=url)
        elif filename.endswith(".csv") or filename.endswith(".tsv"):
            urls = pd.read_csv(filepath, header=None, names=["URL"])
            for url in urls["URL"]:
                insert_into_index(url, kind="url", doc_id=url)

        else:
            if request.form.get("filename_as_doc_id", None) is not None:
                insert_into_index(filepath, doc_id=filename)
            else:
                insert_into_index(filepath)
    except Exception as e:
        # cleanup temp file
        traceback.print_exc()
        if filepath is not None and os.path.exists(filepath):
            os.remove(filepath)
        return "Error: {}".format(str(e)), 500

    # cleanup temp file
    if filepath is not None and os.path.exists(filepath):
        os.remove(filepath)

    return "File inserted!", 200


@app.route("/getDocuments", methods=["GET"])
@authenticate
def get_documents():
    if os.path.exists(PKL_NAME):
        with open(PKL_NAME, "rb") as f:
            stored_docs = pickle.load(f)
        documents_list = []
        for doc_id, doc_text in stored_docs.items():
            documents_list.append({"id": doc_id, "text": doc_text})
        documents_list = documents_list
        return make_response(jsonify(documents_list)), 200
    else:
        return [], 200


@app.route("/")
@authenticate
def home():
    return "Hello, World!"


if __name__ == "__main__":
    app.run(debug=True, port=8000)
