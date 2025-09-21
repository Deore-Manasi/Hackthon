from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.chains import RetrievalQA
from utils import read_document
from config import OPENAI_API_KEY
import os
import openai

# Set OpenAI API key
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
openai.api_key = OPENAI_API_KEY

app = FastAPI()

# CORS setup for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for query input
class QueryRequest(BaseModel):
    query: str

# OpenAI embeddings and model setup
embeddings = OpenAIEmbeddings()
llm = ChatOpenAI(temperature=0.2, model_name="gpt-3.5-turbo")

# Temporary in-memory store for FAISS
faiss_store = None

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    global faiss_store
    
    contents = await file.read()
    text = read_document(contents, filename=file.filename)

    # Split text for embeddings
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs = splitter.create_documents([text])

    # Check for empty docs to avoid IndexError
    if not docs:
        return {"error": "No valid text chunks found in the uploaded document."}

    # Create FAISS vector store
    faiss_store = FAISS.from_documents(docs, embeddings)

    return {"message": "Document uploaded and processed successfully", "chunks": len(docs)}

@app.post("/query/")
async def query_doc(request: QueryRequest):
    global faiss_store
    if not faiss_store:
        return {"error": "No document uploaded yet"}

    retriever = faiss_store.as_retriever(search_type="similarity", search_kwargs={"k":3})
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff", 
        retriever=retriever,
        return_source_documents=False
    )

    result = qa_chain.run(request.query)
    return {"answer": result}
