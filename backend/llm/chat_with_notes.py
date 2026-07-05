"""
LLM pipeline for Chat-with-Notes.

Key design decisions
────────────────────
- Each uploaded document gets its own ChromaDB collection (named by session_id).
  This prevents data leaking between users and avoids unbounded growth of a single
  shared collection.
- query_notes is built as a tool factory (make_query_tool) so the collection name
  can be captured per-request via closure.
- print() replaced by logging throughout.
- show_progress_bar disabled in encode() to keep production logs clean.
"""

import logging
import uuid
import chromadb
import numpy as np                              # noqa: F401 – kept for numpy safety in tolist()
from typing import List
from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyMuPDFLoader, Docx2txtLoader
from sentence_transformers import SentenceTransformer
from langchain.tools import tool
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from .model_init import model_initialization

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

VECTOR_DB_PATH = "./vector_db"


# ── Document loader ───────────────────────────────────────────────────────────

def loader(file_path: str, file_type: str) -> list[Document]:
    try:
        if file_type == "pdf":
            doc_loader = PyMuPDFLoader(file_path)
        elif file_type in ("docx", "doc"):
            doc_loader = Docx2txtLoader(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
        return doc_loader.load()
    except Exception as e:
        logger.error("Error loading document: %s", e)
        return []


# ── Embedding generator ───────────────────────────────────────────────────────

class EmbeddingGenerator:
    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
    ):
        self.model = SentenceTransformer(model_name)
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        logger.info("Loaded embedding model: %s", model_name)

    def chunk_document(self, documents: List[Document]) -> List[Document]:
        if not documents:
            return []
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""],
        )
        chunks = splitter.split_documents(documents)
        logger.info("Split %d document(s) into %d chunks", len(documents), len(chunks))
        return chunks

    def embed_chunks(self, chunks: List[Document]) -> List[List[float]]:
        if not chunks:
            return []
        texts = [chunk.page_content for chunk in chunks]
        logger.info("Generating embeddings for %d chunks", len(texts))
        # show_progress_bar=False keeps production logs clean
        embeddings = self.model.encode(texts, show_progress_bar=False)
        return embeddings.tolist()


# ── Singleton embedder (avoids reloading the model on every request) ──────────

_embedder_instance = None


def get_embedder() -> EmbeddingGenerator:
    global _embedder_instance
    if _embedder_instance is None:
        _embedder_instance = EmbeddingGenerator()
    return _embedder_instance


# ── Vector store ──────────────────────────────────────────────────────────────

def vector_store(
    chunks: List[Document],
    embeddings: List[List[float]],
    collection_name: str,          # required: per-session ID prevents cross-user leakage
) -> chromadb.Collection:
    """
    Persist chunks and their embeddings in a per-session ChromaDB collection.
    Using a unique collection_name per upload ensures users never see each other's data.
    """
    client = chromadb.PersistentClient(path=VECTOR_DB_PATH)
    collection = client.get_or_create_collection(name=collection_name)

    if not chunks or not embeddings:
        logger.warning("No chunks or embeddings to store (session: %s).", collection_name)
        return collection

    texts = [chunk.page_content for chunk in chunks]
    metadatas = [chunk.metadata for chunk in chunks]
    ids = [str(uuid.uuid4()) for _ in range(len(chunks))]

    collection.add(embeddings=embeddings, documents=texts, metadatas=metadatas, ids=ids)
    logger.info(
        "Stored %d vector(s) in ChromaDB collection '%s'.", len(chunks), collection_name
    )
    return collection


# ── Per-session query tool factory ────────────────────────────────────────────

def make_query_tool(collection_name: str):
    """
    Return a LangChain @tool that searches the ChromaDB collection identified by
    collection_name.  Using a factory (closure) instead of a module-level @tool
    allows each request to query its own isolated collection.
    """

    @tool
    def query_notes(query_text: str) -> str:
        """Use this tool to search the user's uploaded notes for relevant information."""
        client = chromadb.PersistentClient(path=VECTOR_DB_PATH)
        collection = client.get_or_create_collection(name=collection_name)

        embedder = get_embedder()
        query_embedding = embedder.model.encode([query_text]).tolist()

        result = collection.query(query_embeddings=query_embedding, n_results=5)
        documents = result.get("documents", [[]])[0]
        return "\n\n".join(documents) if documents else "No relevant notes found."

    return query_notes


# ── Agent ─────────────────────────────────────────────────────────────────────

def chat_with_notes_agent(query: str, collection_name: str) -> dict:
    """
    Run the LangChain tool-calling agent against the given collection.
    collection_name must match the one created during the upload step.
    """
    system_message = (
        "You are a helpful assistant that answers questions about the user's notes. "
        "Use the `query_notes` tool to find relevant information."
    )
    model = model_initialization(system_prompt=system_message)

    query_tool = make_query_tool(collection_name)

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    agent = create_tool_calling_agent(model, [query_tool], prompt)
    agent_executor = AgentExecutor(agent=agent, tools=[query_tool])
    return agent_executor.invoke({"input": query})