import uvicorn
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, UploadFile, File, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.rag_service import RAGService
import os

app = FastAPI(
  title="Enterprise RAG - Document Assistant Backend",
  description="FastAPI service for document chunking, indexing, and LLM query parsing using LangChain and Chroma DB.",
  version="1.0.0"
)

# Enable CORS for the Frontend development server
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"], # In production, restrict to Frontend domain
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# Initialize global RAG Service
rag_service = RAGService()

class QueryRequest(BaseModel):
  question: str
  temperature: float = 0.5
  max_tokens: int = 1024

@app.get("/")
async def health_check():
  status = rag_service.check_connections()
  return {
    "status": "healthy",
    "connections": status
  }

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
  # Check if file format is supported
  if not (file.filename.lower().endswith(".pdf") or file.filename.lower().endswith(".txt")):
    raise HTTPException(status_code=400, detail="Only PDF and TXT file formats are supported.")
    
  try:
    file_bytes = await file.read()
    document_info = rag_service.ingest_document(file.filename, file_bytes)
    
    if document_info["status"] == "error":
      raise HTTPException(status_code=500, detail=f"Failed to process and index document {file.filename}.")
      
    return {
      "message": "File uploaded and indexed successfully",
      "document": document_info
    }
  except ValueError as ve:
    raise HTTPException(status_code=400, detail=str(ve))
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Inward server error during upload: {str(e)}")

@app.get("/documents")
async def list_documents():
  docs = rag_service.list_documents()
  return {"documents": docs}

@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
  success = rag_service.delete_document(doc_id)
  if not success:
    raise HTTPException(status_code=404, detail="Document not found.")
  return {"message": "Document deleted and index updated successfully."}

@app.post("/query")
async def query_documents(request: QueryRequest):
  if not request.question.strip():
    raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
  try:
    result = rag_service.query(
      question=request.question,
      temperature=request.temperature,
      max_tokens=request.max_tokens
    )
    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Inward server error during query processing: {str(e)}")

@app.get("/stats")
async def get_stats():
  return rag_service.get_stats()

if __name__ == "__main__":
  port = int(os.getenv("PORT", 8000))
  host = os.getenv("HOST", "0.0.0.0")
  uvicorn.run("main:app", host=host, port=port, reload=True)
