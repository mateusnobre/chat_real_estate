from multiprocessing import Lock
import os
import pickle
from dotenv import load_dotenv
from langchain import OpenAI

from llama_index import GPTSimpleVectorIndex, LLMPredictor, PromptHelper, ServiceContext


index = None
stored_docs = {}
lock = Lock()

index_name = "./index.json"
pkl_name = "stored_documents.pkl"

load_dotenv()

os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")


"""Create a new global index, or load one from the pre-set path."""
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
    else:
        with open(pkl_name, "wb") as f:
            pickle.dump({}, f)
