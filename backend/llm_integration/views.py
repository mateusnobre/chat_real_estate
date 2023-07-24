import json
import traceback

from langchain import SQLDatabaseChain
from llm_integration.forms import IndexForm, UploadedFileForm
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from google.oauth2 import service_account
from multiprocessing import Lock
from langchain.document_loaders import YoutubeLoader
from django.core import serializers
from llama_index import (
    LLMPredictor,
    PromptHelper,
    SimpleDirectoryReader,
    BeautifulSoupWebReader,
    Document,
    ServiceContext,
    StorageContext,
    load_index_from_storage,
    SQLDatabase,
    GPTVectorStoreIndex,
)
import pandas as pd
import tiktoken
from .globals import (
    CHUNK_SIZE_LIMIT,
    MAX_CHUNK_OVERLAP,
    MAX_INPUT_SIZE,
    NUM_OUTPUT,
    OPEN_AI_MODEL_NAME,
    TEMPERATURE,
)
from google.cloud import storage
from django.shortcuts import get_object_or_404
from .models import Index, UploadedFile
from django.http import HttpResponse, JsonResponse
from django.core.exceptions import ObjectDoesNotExist
import shutil
from rest_framework_simplejwt.tokens import AccessToken
from django.core.files.storage import default_storage
from django.http import HttpResponseBadRequest, HttpResponseServerError
from django.core.files.base import ContentFile
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from langchain.embeddings.huggingface import HuggingFaceEmbeddings
from llama_index.embeddings import LangchainEmbedding
from llama_index.prompts import Prompt

from llama_index.callbacks import CallbackManager, TokenCountingHandler
import gcsfs
from sqlalchemy.engine import create_engine
from langchain.chat_models import ChatOpenAI
from langchain import SQLDatabase, SQLDatabaseChain
from langchain.prompts.prompt import PromptTemplate



_DEFAULT_TEMPLATE = """Given an input question, first create a syntactically correct {dialect} query to run, then look at the results of the query and return the answer.
Use the following format:

Question: "Question here"
SQLQuery: "SQL Query to run"
SQLResult: "Result of the SQLQuery"
Answer: "Final answer here"

Only use the following tables:

{table_info}

Question: {input}"""
SQL_PROMPT = PromptTemplate(
    input_variables=["input", "table_info", "dialect"], template=_DEFAULT_TEMPLATE
)


token_counter = TokenCountingHandler(
    tokenizer=tiktoken.encoding_for_model("gpt-3.5-turbo").encode
)

callback_manager = CallbackManager([token_counter])

text_qa_template_str = (
    "Context information is below.\n"
    "---------------------\n"
    "{context_str}\n"
    "---------------------\n"
    "Using both the context information and also using your own knowledge, "
    "answer the question: {query_str}\n"
    "If the context isn't helpful, you can also answer the question on your own.\n"
)
TEXT_QA_TEMPLATE = Prompt(text_qa_template_str)

refine_template_str = (
    "The original question is as follows: {query_str}\n"
    "We have provided an existing answer: {existing_answer}\n"
    "We have the opportunity to refine the existing answer "
    "(only if needed) with some more context below.\n"
    "------------\n"
    "{context_msg}\n"
    "------------\n"
    "Using the new context and your own knowledege,update/repeat the existing answer.\n"
)
REFINE_TEMPLATE = Prompt(refine_template_str)

INDEX_PREFIX = settings.INDEX_PREFIX
OPEN_AI_API_KEY = settings.OPENAI_API_KEY

LOCK = Lock()
LLM = ChatOpenAI(
        temperature=TEMPERATURE,
        model_name=OPEN_AI_MODEL_NAME,
        openai_api_key=OPEN_AI_API_KEY,
    )
llm_predictor = LLMPredictor(
    llm=LLM
    # callback=StreamingStdOutCallbackHandler(streaming=True),
)

GCLOUD_PROJECT_ID = settings.GCLOUD_PROJECT_ID
# define prompt helper
prompt_helper = PromptHelper(MAX_INPUT_SIZE, NUM_OUTPUT, MAX_CHUNK_OVERLAP)


model_name = "sentence-transformers/all-MiniLM-L6-v2"
model_kwargs = {"device": "cpu"}
encode_kwargs = {"normalize_embeddings": False}
embed_model = LangchainEmbedding(
    HuggingFaceEmbeddings(
        model_name=model_name, model_kwargs=model_kwargs, encode_kwargs=encode_kwargs
    )
)

SERVICE_CONTEXT = ServiceContext.from_defaults(
    llm_predictor=llm_predictor,
    prompt_helper=prompt_helper,
    chunk_size_limit=CHUNK_SIZE_LIMIT,
    embed_model=embed_model,
    callback_manager=callback_manager,
)

QDRANT_CLIENT = QdrantClient(
    url=settings.QDRANT_URL,
    api_key=settings.QDRANT_API_KEY,
)

callback_manager = CallbackManager([token_counter])

# Create your views here.


CREDENTIALS_JSON = {
    "type": "service_account",
    "project_id": settings.GCLOUD_PROJECT_ID,
    "private_key_id": settings.GCLOUD_PRIVATE_KEY_ID,
    "private_key": settings.GCLOUD_PRIVATE_KEY.replace("\\n", "\n"),
    "client_email": settings.GCLOUD_CLIENT_EMAIL,
    "client_id": settings.GCLOUD_CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": settings.GCLOUD_CLIENT_X509_CERT_URL,
    "universe_domain": "googleapis.com",
}
with open("creds.json", "w") as creds_file:
    creds_file.write(json.dumps(CREDENTIALS_JSON))



SQL_ENGINE = create_engine(f'bigquery://{settings.GCLOUD_PROJECT_ID}', location="US",credentials_path="creds.json")
STORAGE_CLIENT = storage.Client.from_service_account_json(json_credentials_path="creds.json")
GCLOUD_STORAGE_BUCKET = settings.GCLOUD_STORAGE_BUCKET
BUCKET = storage.Bucket(STORAGE_CLIENT, GCLOUD_STORAGE_BUCKET)
CREDENTIALS = service_account.Credentials.from_service_account_file("creds.json")

LOCK = Lock()
scoped_credentials = CREDENTIALS.with_scopes(
    ["https://www.googleapis.com/auth/cloud-platform"]
)
GCP_FS = gcsfs.GCSFileSystem(
    project=settings.GCLOUD_PROJECT_ID, token=scoped_credentials
)


def num_tokens_from_string(string: str, model_name: str) -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.encoding_for_model(model_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens


@csrf_exempt
def query_index(request):
    if request.method != "GET":
        return JsonResponse({"error": "Invalid request method"}, status=400)
    query_text = request.GET.get("text")
    index_name = request.GET.get("index_name")
    
    if index_name.split(" ")[0] == "BigQuery":
        try:
            table_name = index_name.split(" ")[1]
            sql_database = SQLDatabase(SQL_ENGINE, include_tables=[settings.GCLOUD_DATABASE+"."+table_name])
            db_chain = SQLDatabaseChain.from_llm(LLM, sql_database, prompt=SQL_PROMPT, verbose=True,return_intermediate_steps=True)
            response = db_chain.__call__(query_text,include_run_info=True)
            sql_query = response["intermediate_steps"][1]
            sql_result = response["intermediate_steps"][3]

            response_json = {
            "text": (response["result"]),
            "sources": [
                {
                    "sql_query": sql_query,
                    "sql_result": sql_result,
                }
            ],
            }
            return JsonResponse(response_json, status=200)
        except Exception as e:
            traceback.print_exc()
            return JsonResponse(status=500)
    access_token = request.headers.get("Authorization").split(" ")[1]
    token = AccessToken(access_token)
    customer_id = str(token["user_id"])
    if index_name in ["AI_Tools"]:
        index_path = index_name
    else:
        index_path = INDEX_PREFIX + "_" + customer_id + "_" + index_name

    qdrant_vector_store = QdrantVectorStore(
        client=QDRANT_CLIENT, collection_name=index_path
    )
    storage_context = StorageContext.from_defaults(
        vector_store=qdrant_vector_store,
        persist_dir=f"{GCLOUD_STORAGE_BUCKET}/" + index_path,
        fs=GCP_FS,
    )
    index = load_index_from_storage(
        service_context=SERVICE_CONTEXT, storage_context=storage_context
    )

    if query_text is None:
        return JsonResponse(
            {"error": "No text found"},
            status=400,
        )
    try:
        if index is not None:
            selected_query_engine = index.as_query_engine(
                text_qa_template=TEXT_QA_TEMPLATE,
                refine_template=REFINE_TEMPLATE,
            )
            
            response = selected_query_engine.query(query_text)    
            response_json = {
                "text": str(response),
                "sources": [
                    {
                        "text": str(x.node.text),
                        "similarity": round(x.score, 2),
                        "start": x.node.start_char_idx,
                        "end": x.node.end_char_idx,
                    }
                    for x in response.source_nodes
                ],
            }
        else:
            return JsonResponse(
                {"error": "No agent selected"},
                status=400,
            )

        return JsonResponse(response_json, status=200)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


def insert_into_index(doc_file_path, index_name, customer_id, kind="text", doc_id=None):
    """Insert new document into a specific index."""
    index_path = INDEX_PREFIX + "_" + customer_id + "_" + index_name
    qdrant_vector_store = QdrantVectorStore(
        client=QDRANT_CLIENT, collection_name=index_path
    )
    storage_context = StorageContext.from_defaults(
        vector_store=qdrant_vector_store,
        persist_dir=f"{GCLOUD_STORAGE_BUCKET}/" + index_path,
        fs=GCP_FS,
    )
    index = load_index_from_storage(
        service_context=SERVICE_CONTEXT, storage_context=storage_context
    )


    try:
        if kind == "text":
            reader = SimpleDirectoryReader(input_files=[doc_file_path])
            document = reader.load_data()[0]
            doc_id = str(doc_file_path).split("/")[-1]
        elif kind == "url":
            if "youtube.com" in doc_file_path.lower():
                reader = YoutubeLoader.from_youtube_url(
                    doc_file_path, add_video_info=True
                )
                documents = reader.load()
                if len(documents) == 0:
                    return "No subtitles found"
                document = documents[0]
                document.metadata["publish_date"] = document.metadata[
                    "publish_date"
                ].strftime("%Y-%m-%d %H:%M:%S")
                doc_id = (
                    document.metadata["title"] + " - " + document.metadata["author"]
                )
                document = Document(
                    document.page_content,
                    doc_id=doc_id,
                    extra_info=document.metadata,
                )
            else:
                reader = BeautifulSoupWebReader()
                document = reader.load_data(urls=[doc_file_path])[0]

        doc_file = UploadedFile.objects.filter(name=doc_id).first()

        if doc_file is None:
            # Keep track of stored docs -- llama_index doesn't make this easy

            index.insert(document)
            index.storage_context.persist(
                persist_dir=f"{GCLOUD_STORAGE_BUCKET}/" + index_path, fs=GCP_FS
            )

            index_object = Index.objects.filter(name=index_name, customer=customer_id).first()
            uploaded_file_form = UploadedFileForm({"name": doc_id, "description": document.text[0:200], "index": index_object.index_id})
            if uploaded_file_form.is_valid():
                uploaded_file_form.save()
            else:
                print(uploaded_file_form.errors)
            # Save index and stored docs to their respective locations
         
            # Perform the necessary upload operations to the storage location
        # Cleanup temp file
        default_storage.delete(doc_file_path)
    except Exception:
        default_storage.delete(doc_file_path)
        traceback.print_exc()
    return


@csrf_exempt
def upload_file(request):
    if "file" not in request.FILES:
        return HttpResponseBadRequest("Please send a POST request with a file")
    try:
        uploaded_file = request.FILES["file"]
        filename = uploaded_file.name
        filepath = default_storage.save(
            "documents/" + filename, ContentFile(uploaded_file.read())
        )

        index_name = request.GET.get("index_name")
        access_token = request.headers.get("Authorization").split(" ")[1]
        token = AccessToken(access_token)
        customer_id = str(token["user_id"])        
        if filename.endswith(".xlsx") or filename.endswith(".xls"):
            urls = pd.read_excel(filepath, header=None, names=["URL"])
            for url in urls["URL"]:
                insert_into_index(url, index_name, customer_id, kind="url", doc_id=url)
        elif filename.endswith(".csv") or filename.endswith(".tsv"):
            urls = pd.read_csv(filepath, header=None, names=["URL"])
            for url in urls["URL"]:
                insert_into_index(url, index_name, customer_id, kind="url", doc_id=url)
        else:
            if request.POST.get("filename_as_doc_id", None) is not None:
                insert_into_index(filepath, index_name, customer_id, doc_id=filename)
            else:
                insert_into_index(filepath, index_name, customer_id)
    except Exception as e:
        # Cleanup temp file
        traceback.print_exc()
        return HttpResponseServerError("Error: {}".format(str(e)))

    return HttpResponse("File inserted!")


@csrf_exempt
def get_documents(request):
    index_name = request.GET.get("index_name")
    if index_name.split(" ")[0] == "BigQuery" or index_name in ["AI_Tools"]:
        return HttpResponse([], status=200)
    access_token = request.headers.get("Authorization").split(" ")[1]
    token = AccessToken(access_token)
    customer_id = str(token["user_id"])
    index_object = Index.objects.filter(name=index_name, customer=customer_id).first()

    try:
        documents_list = []
        document_objects = list(UploadedFile.objects.filter(index=index_object.index_id))
        for document in document_objects:
            name = getattr(document,'name')
            description = getattr(document,'description')
            documents_list.append({"id": name, "text": description})
        return JsonResponse(documents_list, safe=False, status=200)
    except:
        traceback.print_exc()
        return HttpResponse([], status=500)


@csrf_exempt
def index_list(request):
    try:
        indexes = Index.objects.all()
        data = serializers.serialize("json", indexes)
        return HttpResponse(data, content_type="application/json", status=200)
    except Exception:
        return HttpResponse(status=500)


@csrf_exempt
def index_create(request):
    try:
        if request.method == "POST":
            access_token = request.headers.get("Authorization").split(" ")[1]
            token = AccessToken(access_token)
            customer_id = str(token["user_id"])

            index_name = request.POST.get("name")
            form = IndexForm({"name": index_name, "customer": customer_id})
            if form.is_valid():
                index_path = INDEX_PREFIX + "_" + customer_id + "_" + index_name

                with LOCK:
                    qdrant_vector_store = QdrantVectorStore(
                        client=QDRANT_CLIENT, collection_name=index_path
                    )
                    storage_context = StorageContext.from_defaults(
                        vector_store=qdrant_vector_store,
                    )
                    index = GPTVectorStoreIndex.from_documents(
                        [Document(text="I do not know", doc_id="test")],
                        storage_context=storage_context,
                        service_context=SERVICE_CONTEXT,
                    )
                    index.storage_context.persist(
                        persist_dir=f"{GCLOUD_STORAGE_BUCKET}/" + index_path, fs=GCP_FS
                    )

                form.save()
                return HttpResponse(status=201)
            else:
                print(form.errors)
        else:
            form = IndexForm()
        return HttpResponse(status=400)
    except Exception:
        traceback.print_exc()
        return HttpResponse(status=500)


@csrf_exempt
def index_delete(request, pk):
    try:
        index = get_object_or_404(Index, pk=pk)
        if request.method == "DELETE":
            access_token = request.headers.get("Authorization").split(" ")[1]
            token = AccessToken(access_token)
            customer_id = str(token["user_id"])

            index_path = INDEX_PREFIX + "_" + customer_id + "_" + index.name
            try:
                shutil.rmtree(index_path)
                blobs = BUCKET.list_blobs(prefix=index_path)
                for blob in blobs:
                    blob.delete()
            except Exception:
                traceback.print_exc()

            index.delete()
            return HttpResponse(status=204)
        return HttpResponse(status=400)
    except ObjectDoesNotExist:
        return HttpResponse(status=404)
    except Exception:
        return HttpResponse(status=500)


@csrf_exempt
def get_indexes_by_user(request):
    try:
        access_token = request.headers.get("Authorization").split(" ")[1]
        token = AccessToken(access_token)
        customer_id = str(token["user_id"])
        indexes = Index.objects.filter(customer_id=customer_id)
        data = serializers.serialize("json", indexes)
        return HttpResponse(data, content_type="application/json", status=200)
    except Exception as e:
        traceback.print_exc()
        return HttpResponse(status=500)


@csrf_exempt
def get_index_by_id(request, pk):
    try:
        index = Index.objects.get(pk=pk)
        data = serializers.serialize("json", [index])
        return HttpResponse(data, content_type="application/json", status=200)
    except ObjectDoesNotExist:
        return HttpResponse(status=404)
    except Exception:
        return HttpResponse(status=500)
