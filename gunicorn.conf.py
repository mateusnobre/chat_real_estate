import json
from multiprocessing import Lock
import os
import pickle
from dotenv import load_dotenv
from google.cloud import storage
from llama_index import GPTSimpleVectorIndex
from utils import SERVICE_CONTEXT

index = None
stored_docs = {}
lock = Lock()
load_dotenv()

INDEX_NAME = os.getenv("INDEX_NAME")
PKL_NAME = os.getenv("PKL_NAME")

CREDENTIALS_JSON = {
    "type": "service_account",
    "project_id": os.getenv("GCLOUD_PROJECT_ID"),
    "private_key_id": os.getenv("GCLOUD_PRIVATE_KEY_ID"),
    "private_key": os.getenv("GCLOUD_PRIVATE_KEY").replace("\\n", "\n"),
    "client_email": os.getenv("GCLOUD_CLIENT_EMAIL"),
    "client_id": os.getenv("GCLOUD_CLIENT_ID"),
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": os.getenv("GCLOUD_CLIENT_X509_CERT_URL"),
    "universe_domain": "googleapis.com",
}
with open("creds.json", "w") as creds_file:
    creds_file.write(json.dumps(CREDENTIALS_JSON))

client = storage.Client.from_service_account_json(json_credentials_path="creds.json")

bucket = storage.Bucket(client, "topic-indexes")
index_blob = bucket.blob(INDEX_NAME)
stored_docs_blob = bucket.blob(PKL_NAME)


with lock:
    if index_blob.exists():
        # download index blob
        index_blob.download_to_filename(INDEX_NAME)
    else:
        # create index.json in bucket
        index = GPTSimpleVectorIndex([], service_context=SERVICE_CONTEXT)
        index.save_to_disk(INDEX_NAME)
        index_blob.upload_from_filename(INDEX_NAME)
    if stored_docs_blob.exists():
        # download stored_docs blob
        stored_docs_blob.download_to_filename(PKL_NAME)
    else:
        # create stored_documents.pkl in bucket
        with open(PKL_NAME, "wb") as f:
            pickle.dump({}, f)
        stored_docs_blob.upload_from_filename(PKL_NAME)
