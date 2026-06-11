import uuid
import chromadb
import numpy as np
from typing import List, Any
from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyMuPDFLoader, Docx2txtLoader
from sentence_transformers import SentenceTransformer
from langchain.tools import tool
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from .model_init import model_initialization 



# Document loader 
def loader(file_path: str, file_type: str) -> list[Document]:
    try:
        if file_type == "pdf":
            doc_loader = PyMuPDFLoader(file_path)
        elif file_type == "docx":
            doc_loader = Docx2txtLoader(file_path)
        else:
            raise ValueError("Invalid file type")
        return doc_loader.load()
    except Exception as e:
        print(f"Error loading document: {e}")
        return []

class EmbeddingGenerator:
    def __init__(self, model_name:str = "all-MiniLM-L6-v2", chunk_size: int = 1000, chunk_overlap: int = 200):
        self.model = SentenceTransformer(model_name)
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        print(f"[Info] Loaded embedding model: {model_name}")
    
    def chunk_document(self, documents: List[Document]) -> List[Document]:
        if not documents:
            return []
            
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""])
        
        chunks = splitter.split_documents(documents)
        print(f"[Info] Split {len(documents)} documents into {len(chunks)} chunks")
        return chunks
    
    def embed_chunks(self, chunks: List[Document]) -> List[List[float]]:
        if not chunks:
            return []
            
        # FIXED: loop variable changed to 'chunk'
        texts = [chunk.page_content for chunk in chunks]
        print(f"[Info] Generating embeddings for {len(texts)} chunks")
        embeddings = self.model.encode(texts, show_progress_bar=True)
        
        # Converted numpy array to list for ChromaDB safety
        return embeddings.tolist() 
        
# Global embedder instance to avoid re-loading the model on every query
_embedder_instance = None

def get_embedder():
    global _embedder_instance
    if _embedder_instance is None:
        _embedder_instance = EmbeddingGenerator()
    return _embedder_instance

# Vector store
def vector_store(chunks: List[Document], embeddings: List[List[float]]) -> chromadb.Collection:
    client = chromadb.PersistentClient(path="./vector_db")
    collection = client.get_or_create_collection(name="my_notes")
    
    # Safety check to prevent ChromaDB crash on empty lists
    if not chunks or not embeddings:
        print("[Warning] No chunks or embeddings to store.")
        return collection
    
    # Extract strings and metadata for ChromaDB
    texts = [chunk.page_content for chunk in chunks]
    metadatas = [chunk.metadata for chunk in chunks]
    
    # Generate unique IDs to prevent overwriting
    ids = [str(uuid.uuid4()) for _ in range(len(chunks))]
    
    collection.add(
        embeddings=embeddings,
        documents=texts, 
        metadatas=metadatas, 
        ids=ids 
    )
    print(f"[Info] Successfully stored {len(chunks)} vectors in ChromaDB.")
    return collection

@tool
def query_notes(query_text: str):
    """Use this tool to search the user's uploaded notes for relevant information."""
    client = chromadb.PersistentClient(path="./vector_db")
    collection = client.get_or_create_collection(name="my_notes")
    
    # 1. Get the global embedding model
    embedder = get_embedder()
    
    # 2. Embed the user's query text so ChromaDB can compare vectors properly
    query_embedding = embedder.model.encode([query_text]).tolist()
    
    # 3. Search the database
    result = collection.query(
        query_embeddings=query_embedding,
        n_results=5
    )
    
    documents = result.get("documents", [[]])[0]
    return "\n\n".join(documents) if documents else "No relevant notes found."


def chat_with_notes_agent(query:str):
    system_message = "You are a helpful assistant that answers questions about the user's notes. Use the `query_notes` tool to find relevant information."
    model = model_initialization(system_prompt=system_message)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])
    
    agent = create_tool_calling_agent(model, [query_notes], prompt)
    agent_executor = AgentExecutor(agent=agent, tools=[query_notes])
    
    return agent_executor.invoke({"input": query})