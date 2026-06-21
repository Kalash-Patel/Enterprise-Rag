import os
import uuid
from typing import List, Dict, Any
# pyrefly: ignore [missing-import]
from langchain_text_splitters import RecursiveCharacterTextSplitter
# pyrefly: ignore [missing-import]
from langchain_community.document_loaders import PyPDFLoader, TextLoader
# pyrefly: ignore [missing-import]
# from langchain_community.vectorstores import Chroma
from langchain_chroma import Chroma
# pyrefly: ignore [missing-import]
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploaded_files")
CHROMA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CHROMA_DIR, exist_ok=True)



# TextLoader → TextSplitter → Embeddings → VectorStore → Retriever → LLM

class RAGService:
  def __init__(self):
    self.documents: Dict[str, Dict[str, Any]] = {}
    self.query_count = 0
    self.total_latency_ms = 0
    self.embeddings = None
    self.vector_store = None
    self.initialized = False
    
    # Initialize connection if API key is set
    self.api_key = os.getenv("OPEN_ROUTER_KEY")
    self._init_rag()

  def _init_rag(self):
    try:
      # Use OpenAI if key is present, otherwise load mock embeddings to prevent crashes
      if self.api_key and "your_openai" not in self.api_key:
        self.embeddings = OpenAIEmbeddings(
          model="openai/text-embedding-3-small",
          api_key=self.api_key,
          base_url="https://openrouter.ai/api/v1",
          )

        self.vector_store = Chroma(
          persist_directory=CHROMA_DIR,
          embedding_function=self.embeddings
        )

        self.initialized = True
        print("RAGService initialized with OpenAI Embeddings and Chroma DB.")
        # Load existing documents from vector store to sync in-memory state
        try:
          self.list_documents()
        except Exception as e:
          print(f"Error syncing documents at init: {e}")
      else:
        print("OPENAI_API_KEY not set or invalid. Running in Mock/Preview mode.")
        self.embeddings = None
        self.vector_store = None
        self.initialized = False
    except Exception as e:
      print(f"Error initializing RAG components: {e}")
      self.initialized = False

  def check_connections(self) -> Dict[str, str]:
    # Dynamic reload in case user updates .env
    if not self.initialized:
      self.api_key = os.getenv("OPEN_ROUTER_KEY")
      self._init_rag()
      
    return {
      "llmStatus": "connected" if self.initialized else "disconnected",
      "vectorDbStatus": "connected" if self.initialized else "disconnected"
    }

  def ingest_document(self, file_name: str, file_bytes: bytes) -> Dict[str, Any]:
    # Check if document already exists
    self.list_documents()
    for doc in self.documents.values():
      if doc["name"].lower() == file_name.lower():
        raise ValueError(f"Document with filename '{file_name}' already exists.")

    doc_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{file_name}")
    
    # Save file locally
    with open(file_path, "wb") as f:
      f.write(file_bytes)

    doc_size = len(file_bytes)
    
    # Setup document record
    doc_info = {
      "id": doc_id,
      "name": file_name,
      "size": doc_size,
      "status": "indexing",
      "chunkCount": 0,
      "uploadDate": uuid.uuid4().hex[:8], # Placeholders or actual timestamps
      "filePath": file_path
    }
    
    # We save a temporary timestamp
    import datetime
    doc_info["uploadDate"] = datetime.datetime.now().isoformat()
    self.documents[doc_id] = doc_info

    try:
      # Load document based on file type
      if file_name.lower().endswith(".pdf"):
        loader = PyPDFLoader(file_path)
      else:
        loader = TextLoader(file_path, encoding="utf-8")
        
      docs = loader.load()
      
      # Split text
      text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
      chunks = text_splitter.split_documents(docs)
      
      # Enrich metadata
      for chunk in chunks:
        chunk.metadata["document_id"] = doc_id
        chunk.metadata["document_name"] = file_name
        if "page" not in chunk.metadata:
          chunk.metadata["page"] = 1
        chunk.metadata["uploadDate"] = datetime.datetime.now().isoformat()
        chunk.metadata["status"] = "ready"
        chunk.metadata["size"] = doc_size
        chunk.metadata["filePath"] = file_path


      doc_info["chunkCount"] = len(chunks)

      # Index in Chroma DB if online
      if self.initialized and self.vector_store:
        self.vector_store.add_documents(chunks)
        doc_info["status"] = "ready"
      else:
        # Mock successful indexing for visual testing when offline
        doc_info["status"] = "ready"
        print(f"Mocked indexing for document '{file_name}' ({len(chunks)} chunks).")

      self.documents[doc_id] = doc_info
      return doc_info

    except Exception as e:
      print(f"Error during document ingestion: {e}")
      doc_info["status"] = "error"
      self.documents[doc_id] = doc_info
      return doc_info

  def list_documents(self) -> List[Dict[str, Any]]:
    # Dynamic reload in case user updates .env
    if not self.initialized:
      self.api_key = os.getenv("OPEN_ROUTER_KEY")
      self._init_rag()

    if self.initialized and self.vector_store:
      try:
        result = self.vector_store.get()
        metadatas = result.get("metadatas", [])
        
        # Group chunks by document_id to reconstruct documents dictionary
        grouped_docs = {}
        for meta in metadatas:
          if not meta:
            continue
          doc_id = meta.get("document_id")
          if not doc_id:
            continue
          
          if doc_id not in grouped_docs:
            grouped_docs[doc_id] = []
          grouped_docs[doc_id].append(meta)

        # Merge reconstructed documents into self.documents
        for doc_id, chunks_meta in grouped_docs.items():
          # If document is currently indexing in memory, don't overwrite it
          if doc_id in self.documents and self.documents[doc_id].get("status") == "indexing":
            continue
          
          first_chunk = chunks_meta[0]
          name = first_chunk.get("document_name") or first_chunk.get("name") or "Unknown Document"
          file_path = first_chunk.get("filePath") or first_chunk.get("source") or ""
          upload_date = first_chunk.get("uploadDate") or ""
          status = first_chunk.get("status") or "ready"
          
          # Determine size
          size = first_chunk.get("size")
          if size is None:
            if file_path and os.path.exists(file_path):
              try:
                size = os.path.getsize(file_path)
              except Exception:
                size = 0
            else:
              size = 0
              
          self.documents[doc_id] = {
            "id": doc_id,
            "name": name,
            "size": size,
            "status": status,
            "chunkCount": len(chunks_meta),
            "uploadDate": upload_date,
            "filePath": file_path
          }
      except Exception as e:
        print(f"Error reading from Chroma DB: {e}")

    return list(self.documents.values())

  def delete_document(self, doc_id: str) -> bool:

    #To delete all the data from vectordb
    # result = self.vector_store.get()
    # self.vector_store.delete(ids=result["ids"]) 
    if doc_id not in self.documents:
      return False
      
    doc_info = self.documents[doc_id]
    
    # Remove file from disk
    if os.path.exists(doc_info["filePath"]):
      try:
        os.remove(doc_info["filePath"])
      except Exception as e:
        print(f"Failed to delete file {doc_info['filePath']}: {e}")

    # Remove chunks from Chroma DB if online
    if self.initialized and self.vector_store:
      try:
        # Delete using metadata filtering
        self.vector_store.delete(
          where={"document_id": doc_id}
        )
      except Exception as e:
        print(f"Failed to delete chunks from Chroma DB for {doc_id}: {e}")

    del self.documents[doc_id]
    return True

  def get_total_chunks(self) -> int:
    return sum(doc.get("chunkCount", 0) for doc in self.documents.values())

  def query(self, question: str, temperature: float, max_tokens: int) -> Dict[str, Any]:
    import time
    start_time = time.time()
    self.query_count += 1

    # Dynamic reload in case user updates .env
    if not self.initialized:
      self.api_key = os.getenv("OPEN_ROUTER_KEY")
      self._init_rag()

    # If Chroma is initialized, retrieve context
    sources = []
    context = ""
    
    if self.initialized and self.vector_store:
      try:
        # Retrieve top 4 similar chunks
        results = self.vector_store.similarity_search(question, k=4)
        
        context_parts = []
        for doc in results:
          doc_name = doc.metadata.get("document_name", "Unknown Document")
          page = doc.metadata.get("page", 1)
          snippet = doc.page_content
          
          context_parts.append(f"Source: {doc_name} (Page {page})\nContent: {snippet}\n---")
          
          sources.append({
            "documentName": doc_name,
            "pageNumber": page,
            "snippet": snippet
          })
        
        context = "\n".join(context_parts)
      except Exception as e:
        print(f"Error during retrieval: {e}")

    # Execute LLM call if initialized, otherwise generate a mock RAG answer
    if self.initialized and context:
      try:
        chat = ChatOpenAI(
            model="google/gemini-2.5-flash",
            api_key=os.getenv("OPEN_ROUTER_KEY"),
            base_url="https://openrouter.ai/api/v1",
            max_tokens=512,      # or 1024
            temperature=0,
        )
        
        
        prompt_template = ChatPromptTemplate.from_template(
          "You are a helpful and precise Enterprise Document Q&A Assistant. "
          "Use the following pieces of retrieved context to answer the user's question. "
          "If the question cannot be answered using the context, say that you cannot find the information in the documents. "
          "Do not make up facts. Keep the response structure professional.\n\n"
          "Context:\n{context}\n\n"
          "Question: {question}\n\n"
          "Answer:"
        )
        
        messages = prompt_template.format_messages(context=context, question=question)
        response = chat.invoke(messages)
        answer = response.content
        
      except Exception as e:
        answer = f"Error generating answer from LLM: {e}"
    else:
      # Mock answer generator for offline/preview mode
      if not self.documents:
        answer = "No documents have been indexed yet. Please upload files to search."
      else:
        # Simulate retrieval of some metadata if we have documents uploaded but API is offline
        mock_doc = list(self.documents.values())[0]
        sources = [{
          "documentName": mock_doc["name"],
          "pageNumber": 1,
          "snippet": f"This is a mocked preview segment of document '{mock_doc['name']}' because OPENAI_API_KEY is not set."
        }]
        
        answer = (
          f"**[PREVIEW MODE]** The backend received your question: *\"{question}\"*\n\n"
          f"To enable real AI answers, please configure your **`OPENAI_API_KEY`** in the backend `.env` file.\n\n"
          f"**Retrieved Sources (Simulated):**\n"
          f"- Found relevant passage in **{mock_doc['name']}**.\n\n"
          f"This demo interface is fully reactive. Clicking the citations below will slide out the citation viewer panel."
        )

    latency_ms = int((time.time() - start_time) * 1000)
    self.total_latency_ms += latency_ms

    return {
      "answer": answer,
      "sources": sources,
      "latencyMs": latency_ms
    }

  def get_stats(self) -> Dict[str, Any]:
    connections = self.check_connections()
    avg_latency = int(self.total_latency_ms / self.query_count) if self.query_count > 0 else 0
    
    return {
      "stats": {
        "totalDocuments": len(self.documents),
        "totalChunks": self.get_total_chunks(),
        "queryCount": self.query_count,
        "avgResponseTimeMs": avg_latency,
        "vectorDbStatus": connections["vectorDbStatus"],
        "llmStatus": connections["llmStatus"]
      }
    }
