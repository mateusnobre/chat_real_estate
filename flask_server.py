import os
import traceback
from dotenv import load_dotenv
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from werkzeug.utils import secure_filename
import pickle
from langchain import OpenAI
from multiprocessing import Lock
from llama_index import (
    LLMPredictor,
    PromptHelper,
    SimpleDirectoryReader,
    BeautifulSoupWebReader,
    GPTSimpleVectorIndex,
    Document,
    ServiceContext,
)

load_dotenv()

os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

llm_predictor = LLMPredictor(
    llm=OpenAI(
        temperature=0,
        model_name="gpt-3.5-turbo",
        openai_api_key=os.environ["OPENAI_API_KEY"],
    )
)

# set maximum input size
max_input_size = 2049
# set number of output tokens
num_output = 500
# set maximum chunk overlap
max_chunk_overlap = 20
chunk_size_limit = 512

# define prompt helper
prompt_helper = PromptHelper(max_input_size, num_output, max_chunk_overlap)

SERVICE_CONTEXT = ServiceContext.from_defaults(
    llm_predictor=llm_predictor,
    prompt_helper=prompt_helper,
    chunk_size_limit=chunk_size_limit,
)

stored_docs = {}
lock = Lock()
index_name = "./index.json"
pkl_name = "stored_documents.pkl"

app = Flask(__name__)
CORS(app)


@app.route("/query", methods=["GET"])
def query_index():
    index = GPTSimpleVectorIndex.load_from_disk(
        index_name, service_context=SERVICE_CONTEXT
    )
    query_text = request.args.get("text", None)
    if query_text is None:
        return "No text found, please include a ?text=blah parameter in the URL", 400

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
    return make_response(jsonify(response_json)), 200


def insert_into_index(doc_file_path, doc_id=None):
    """Insert new document into global index."""
    with open(pkl_name, "rb") as f:
        stored_docs = pickle.load(f)
    index = GPTSimpleVectorIndex.load_from_disk(
        index_name, service_context=SERVICE_CONTEXT
    )
    # if doc_file_path.endswith(".html"):
    #     document = BeautifulSoupWebReader(input_files=[doc_file_path]).load_data()[0]
    # else:
    document = SimpleDirectoryReader(input_files=[doc_file_path]).load_data()[0]
    if doc_id is not None:
        document.doc_id = doc_id

    with lock:
        # Keep track of stored docs -- llama_index doesn't make this easy
        stored_docs[document.doc_id] = document.text[
            0:200
        ]  # only take the first 200 chars

        index.insert(document)
        index.save_to_disk(index_name)

        with open(pkl_name, "wb") as f:
            pickle.dump(stored_docs, f)

    return


@app.route("/uploadFile", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return "Please send a POST request with a file", 400

    filepath = None
    try:
        uploaded_file = request.files["file"]
        filename = secure_filename(uploaded_file.filename)
        filepath = os.path.join("documents", os.path.basename(filename))
        uploaded_file.save(filepath)

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
def get_documents():
    if os.path.exists(pkl_name):
        with open(pkl_name, "rb") as f:
            stored_docs = pickle.load(f)
        documents_list = []
        for doc_id, doc_text in stored_docs.items():
            documents_list.append({"id": doc_id, "text": doc_text})
        documents_list = documents_list
        return make_response(jsonify(documents_list)), 200
    else:
        return [], 200


@app.route("/")
def home():
    return "Hello, World! Welcome to the llama_index docker image!"
