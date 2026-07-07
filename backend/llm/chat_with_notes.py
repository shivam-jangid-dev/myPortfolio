"""
LLM pipeline for Chat-with-Notes.

Architecture (full-context approach):
  Upload phase : Extract text from the document → store in memory.
  Query phase  : Pass the full document text as context to the Groq LLM.

Why not embeddings?
  The old sentence-transformers + ChromaDB approach required running a neural
  network on CPU for every upload, adding 5-10 s of latency.  Groq's Llama 3.3
  70B has a 128 K-token context window, so most documents fit in a single call —
  giving better coherent reasoning and near-instant upload processing.
"""

import logging
from langchain_core.documents import Document
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_community.document_loaders import PyMuPDFLoader, Docx2txtLoader
from .model_init import model_initialization

logger = logging.getLogger(__name__)

# ── Document loader ────────────────────────────────────────────────────────────

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


# ── In-memory session store ────────────────────────────────────────────────────
# Maps session_id → extracted document text.
# NOTE: Lost on server restart — the frontend should prompt re-upload in that case.

# ~30 K tokens, comfortably within Groq's 128 K context window.
_MAX_CHARS = 120_000

_sessions: dict[str, str] = {}


def store_document(session_id: str, documents: list[Document]) -> None:
    """Flatten all document pages into a single string and cache by session_id."""
    full_text = "\n\n".join(doc.page_content for doc in documents)
    if len(full_text) > _MAX_CHARS:
        logger.warning(
            "Document for session '%s' is %d chars; truncating to %d.",
            session_id, len(full_text), _MAX_CHARS,
        )
        full_text = full_text[:_MAX_CHARS]
    _sessions[session_id] = full_text
    logger.info("Stored %d chars for session '%s'.", len(full_text), session_id)


def chat_with_notes_agent(query: str, session_id: str) -> dict:
    """
    Answer a question using the full document text as LLM context.
    No embedding or vector search — the document is passed directly in the prompt.
    """
    text = _sessions.get(session_id)
    if not text:
        return {
            "output": (
                "Session not found. This usually happens after a server restart. "
                "Please upload your document again."
            )
        }

    system_msg = (
        "You are a helpful assistant that answers questions about the user's uploaded "
        "notes or documents. Use ONLY the information in the provided document to answer. "
        "If the answer is not in the document, say so clearly and concisely."
    )
    model = model_initialization()
    response = model.invoke([
        SystemMessage(content=system_msg),
        HumanMessage(content=f"Document:\n\n{text}\n\nQuestion: {query}"),
    ])
    return {"output": response.content}