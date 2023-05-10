import os
from multiprocessing.managers import BaseManager
import traceback
from dotenv import load_dotenv
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

load_dotenv()

os.environ["INDEX_HOST"] = os.getenv("INDEX_HOST")
os.environ["INDEX_PORT"] = int(os.getenv("INDEX_PORT"))
os.environ["INDEX_PASSWORD"] = os.getenv("INDEX_PASSWORD")
os.environ["FLASK_HOST"] = os.getenv("FLASK_HOST")
os.environ["FLASK_PORT"] = int(os.getenv("FLASK_PORT"))


# initialize manager connection
manager = BaseManager(
    (os.environ.get("INDEX_HOST", ""), os.environ.get("INDEX_PORT", "")),
    os.environ.get("INDEX_PASSWORD", "").encode("utf-8"),
)
manager.register("query_index")
manager.register("insert_into_index")
manager.register("get_documents_list")
manager.connect()


@app.route("/query", methods=["GET"])
def query_index():
    global manager
    query_text = request.args.get("text", None)
    if query_text is None:
        return "No text found, please include a ?text=blah parameter in the URL", 400

    response = manager.query_index(query_text)._getvalue()
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
    return make_response(jsonify(response_json)), 200


@app.route("/uploadFile", methods=["POST"])
def upload_file():
    global manager
    if "file" not in request.files:
        return "Please send a POST request with a file", 400

    filepath = None
    try:
        uploaded_file = request.files["file"]
        filename = secure_filename(uploaded_file.filename)
        filepath = os.path.join("documents", os.path.basename(filename))
        uploaded_file.save(filepath)

        if request.form.get("filename_as_doc_id", None) is not None:
            manager.insert_into_index(filepath, doc_id=filename)
        else:
            manager.insert_into_index(filepath)
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
def get_documents():
    document_list = manager.get_documents_list()._getvalue()

    return make_response(jsonify(document_list)), 200


@app.route("/")
def home():
    return "Hello, World! Welcome to the llama_index docker image!"


def run_flask_server():
    app.run(
        host=os.environ.get("FLASK_HOST", "0.0.0.0"),
        port=os.environ.get("FLASK_PORT", 5601),
    )


if __name__ == "__main__":
    run_flask_server()
