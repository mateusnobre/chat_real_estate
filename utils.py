import json
import os
import re
import traceback
from dotenv import load_dotenv
from langchain import LLMChain, PromptTemplate
import pandas as pd
import pickle
from langchain.chat_models import ChatOpenAI
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
from langchain.document_loaders import YoutubeLoader
from globals import (
    CHUNK_SIZE_LIMIT,
    MAX_CHUNK_OVERLAP,
    MAX_INPUT_SIZE,
    NUM_OUTPUT,
    OPEN_AI_MODEL_NAME,
    TEMPERATURE,
)
from google.cloud import storage


load_dotenv()
INDEX_NAME = os.getenv("INDEX_NAME")
PKL_NAME = os.getenv("PKL_NAME")
OPEN_AI_API_KEY = os.getenv("OPENAI_API_KEY")

LOCK = Lock()

llm_predictor = LLMPredictor(
    llm=ChatOpenAI(
        temperature=TEMPERATURE,
        model_name=OPEN_AI_MODEL_NAME,
        openai_api_key=OPEN_AI_API_KEY,
    )
)

GCLOUD_PROJECT_ID = os.getenv("GCLOUD_PROJECT_ID")
GCLOUD_DATASET = os.getenv("GCLOUD_DATASET")
# define prompt helper
prompt_helper = PromptHelper(MAX_INPUT_SIZE, NUM_OUTPUT, MAX_CHUNK_OVERLAP)

SERVICE_CONTEXT = ServiceContext.from_defaults(
    llm_predictor=llm_predictor,
    prompt_helper=prompt_helper,
    chunk_size_limit=CHUNK_SIZE_LIMIT,
)

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


def insert_into_index(
    doc_file_path, pkl_name=PKL_NAME, index_name=INDEX_NAME, kind="text", doc_id=None
):
    """Insert new document into global index."""
    with open(pkl_name, "rb") as f:
        stored_docs = pickle.load(f)
    index = GPTSimpleVectorIndex.load_from_disk(
        index_name, service_context=SERVICE_CONTEXT
    )
    try:
        if kind == "text":
            reader = SimpleDirectoryReader(input_files=[doc_file_path])
            document = reader.load_data()[0]
            doc_id = doc_file_path.split("/")[-1]
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
        if not doc_id in stored_docs:
            with LOCK:
                # Keep track of stored docs -- llama_index doesn't make this easy
                stored_docs[doc_id] = document.text[
                    0:200
                ]  # only take the first 200 chars
                index.insert(document)
                index.save_to_disk(index_name)
                index_blob.upload_from_filename(index_name)

                with open(pkl_name, "wb") as f:
                    pickle.dump(stored_docs, f)
                stored_docs_blob.upload_from_filename(pkl_name)

    except:
        traceback.print_exc()
        print("Error loading document of kind {}: {}".format(kind, doc_file_path))
    return


# BigQuery Utils

generate_sql_prompt = PromptTemplate(
    input_variables=["question", "columns", "samples", "table_name"],
    template="""
        # Context
        Your job is to write a sql query that answers the following question:
        {question}

        Below is a list of columns and their datatypes. Your query should only use the data contained in the table. The table name is `{table_name}`.

        # Columns
        {columns}

        # Samples
        {samples}

        If the question is not a question or is answerable with the given columns, respond to the best of your ability or say the question can't be answered.
        Do not use columns that aren't in the table.
        Ensure that the query runs and returns the correct output.

        # Query:
        """,
)

sql_rewriter_prompt = PromptTemplate(
    input_variables=["question", "columns", "samples", "table_name", "query"],
    template="""
        # Context
        Your job is to identify why a segment of a query produced an error, then rewrite it to make it work.
        If the question cannot be answered with the given dataset, say that the question cannot be answered and briefly explain why.
        Wrap the query in triple backticks, like markdown.

        #### EXAMPLE ####
        The query didn't work because you used the column "name", which doesn't exist. It should use the column "first_name" instead.
        The query also is missing a semi-colon at the end. Here's a working version

        ```
        SELECT
        first_name,
        SUM(1) AS total_people
        FROM people
        GROUP BY
        first_name
        LIMIT 10;
        ```
        #################


        # Initial question
        {question}

        # Table name
        {table_name}

        # Columns
        {columns}

        # Samples
        {samples}

        # Original query
        {query}

        # Rewritten code
""",
)

summarizer_prompt = PromptTemplate(
    input_variables=["question", "query", "answer"],
    template="""
        # Context
        Your job is to summarize the answer to a data question and give a brief explanation of the methodology/approach.
        Be concise and call out any caveats.


        # Question
        {question}

        # Query
        {query}

        # Answer
        {answer}

        # Summary and methodology
        """,
)

QUERY_FAILED = "<query_failed>"


class color:
    PURPLE = "\033[95m"
    CYAN = "\033[96m"
    DARKCYAN = "\033[36m"
    BLUE = "\033[94m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"
    END = "\033[0m"


def query_database(query, creds, project=GCLOUD_PROJECT_ID):
    try:
        df = pd.read_gbq(query, project_id=project, credentials=creds)
        return df
    except:
        return QUERY_FAILED


def get_schema(table_name, creds, dataset=GCLOUD_DATASET, project=GCLOUD_PROJECT_ID):
    query = f"""
      SELECT 
 TO_JSON_STRING(
    ARRAY_AGG(STRUCT( 
      IF(is_nullable = 'YES', 'NULLABLE', 'REQUIRED') AS mode,
      column_name AS name,
      data_type AS type)
    ORDER BY ordinal_position), TRUE) AS schema
FROM
  {dataset}.INFORMATION_SCHEMA.COLUMNS
WHERE
  table_name = '{table_name}'
    """

    df = pd.read_gbq(query, project_id=project, credentials=creds)
    dic = df["schema"].values[0]
    loaded_json = json.loads(dic)
    schema_df = pd.DataFrame.from_records(loaded_json)
    schema_list = []
    for idx, row in schema_df.iterrows():
        col = str(row.name)
        if (
            "MIN" not in col
            and "MAX" not in col
            and "MED" not in col
            and "AVE" not in col
        ):
            schema_list.append(f" {col} {row.type},")
    schema_str = "\n".join(schema_list)
    return schema_str


def extract_code(text):
    pattern = r"```(.*?)```"
    match = re.search(pattern, text, re.DOTALL)

    return match.group(1).strip().strip("python").strip() if match else None


sql_generator = LLMChain(
    llm=ChatOpenAI(
        model_name=OPEN_AI_MODEL_NAME,
        temperature=0.1,
        max_tokens=MAX_INPUT_SIZE,
        openai_api_key=OPEN_AI_API_KEY,
    ),
    prompt=generate_sql_prompt,
)

sql_rewriter = LLMChain(
    llm=ChatOpenAI(
        model_name=OPEN_AI_MODEL_NAME,
        temperature=0.1,
        max_tokens=MAX_INPUT_SIZE,
        openai_api_key=OPEN_AI_API_KEY,
    ),
    prompt=sql_rewriter_prompt,
)

summarizer = LLMChain(
    llm=ChatOpenAI(
        model_name=OPEN_AI_MODEL_NAME,
        temperature=0.5,
        max_tokens=MAX_INPUT_SIZE,
        openai_api_key=OPEN_AI_API_KEY,
    ),
    prompt=summarizer_prompt,
)


def answer_question(
    question, creds, table_name="land_com_final", dataset=GCLOUD_DATASET
):
    schema = get_schema(table_name, creds)
    df_samples = query_database(f"SELECT * FROM {dataset}.{table_name} LIMIT 1;", creds)
    for col in df_samples.columns:
        if "MIN" in col or "MAX" in col or "MED" in col or "AVE" in col:
            df_samples.drop(columns=[col], inplace=True)

    samples = str(
        [tuple(df_samples.columns.tolist())]
        + [row[1:] for row in df_samples.to_records(index=False).tolist()]
    )
    # generate the initial query
    sql_query = sql_generator.run(
        {
            "question": question,
            "columns": schema,
            "samples": samples,
            "table_name": table_name,
        }
    ).replace("FROM ", f"FROM {dataset}.")
    # run the query against the database
    db_response = query_database(sql_query, creds)

    # fix the query if necessary
    if str(db_response) == QUERY_FAILED:
        answer_raw = sql_rewriter.run(
            {
                "question": question,
                "columns": schema,
                "samples": samples,
                "table_name": table_name,
                "query": sql_query,
            }
        )

        sql_query = extract_code(answer_raw)
        answer = query_database(sql_query, creds)
    else:
        answer = db_response
    # generate a summary of the result and the methodology
    summarized_response = summarizer.run(
        {"question": question, "query": sql_query, "answer": answer}
    )

    return {
        "summary": summarized_response,
        "sql_query": sql_query,
        "answer": answer.to_string(),
    }
