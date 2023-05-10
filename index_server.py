import os
import pickle
from dotenv import load_dotenv
from langchain import OpenAI

load_dotenv()

# NOTE: for local testing only, do NOT deploy with your key hardcoded
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

from multiprocessing import Lock
from multiprocessing.managers import BaseManager
from llama_index import (
    LLMPredictor,
    PromptHelper,
    SimpleDirectoryReader,
    BeautifulSoupWebReader,
    GPTSimpleVectorIndex,
    Document,
    ServiceContext,
)

index = None
stored_docs = {}
lock = Lock()

index_name = "./index.json"
pkl_name = "stored_documents.pkl"


def initialize_index():
    """Create a new global index, or load one from the pre-set path."""
    global index, stored_docs
    # define LLM
    llm_predictor = LLMPredictor(
        llm=OpenAI(
            temperature=0,
            model_name="ada",
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

    service_context = ServiceContext.from_defaults(
        llm_predictor=llm_predictor,
        prompt_helper=prompt_helper,
        chunk_size_limit=chunk_size_limit,
    )
    with lock:
        if os.path.exists(index_name):
            index = GPTSimpleVectorIndex.load_from_disk(
                index_name, service_context=service_context
            )
        else:
            index = GPTSimpleVectorIndex([], service_context=service_context)
            index.save_to_disk(index_name)
        if os.path.exists(pkl_name):
            with open(pkl_name, "rb") as f:
                stored_docs = pickle.load(f)


def query_index(query_text):
    """Query the global index."""
    global index
    response = index.query(query_text)
    return response


def insert_into_index(doc_file_path, doc_id=None):
    """Insert new document into global index."""
    global index, stored_docs
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


def get_documents_list():
    """Get the list of currently stored documents."""
    global stored_doc
    documents_list = []
    for doc_id, doc_text in stored_docs.items():
        documents_list.append({"id": doc_id, "text": doc_text})

    return documents_list


def run_index_server():
    # init the global index
    print("initializing index...")
    initialize_index()

    # setup server
    # NOTE: you might want to handle the password in a less hardcoded way
    manager = BaseManager(
        (os.environ.get("INDEX_HOST", ""), os.environ.get("INDEX_PORT", "")),
        os.environ.get("INDEX_PASSWORD", "").encode("utf-8"),
    )
    manager.register("query_index", query_index)
    manager.register("insert_into_index", insert_into_index)
    manager.register("get_documents_list", get_documents_list)
    server = manager.get_server()

    print("server started...")
    server.serve_forever()


if __name__ == "__main__":
    run_index_server()
