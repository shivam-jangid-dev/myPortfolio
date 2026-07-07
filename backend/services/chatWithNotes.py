import os
import uuid
import tempfile
import logging
from fastapi import APIRouter, Request, UploadFile, File, Form, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from llm.chat_with_notes import loader, store_document, chat_with_notes_agent
from middleware.rate_limiter import limiter

router = APIRouter()

logger = logging.getLogger(__name__)

MAX_UPLOAD_SIZE = 20 * 1024 * 1024  # 20 MB

ALLOWED_CONTENT_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
]

# Maps each allowed MIME type to the file extensions that are legitimately produced
# by that type.  Checked alongside content_type to catch clients that spoof the header.
ALLOWED_EXTENSIONS: dict[str, list[str]] = {
    "application/pdf": ["pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
    "application/msword": ["doc"],
}


@router.post("/chat-with-notes")
@limiter.limit("3/minute")
async def chat_with_notes(
    request: Request,
    user_query: str = Form(None),
    notes: UploadFile = File(None),
    session_id: str = Form(None),   # client sends this back when querying after upload
):
    """
    Two-phase endpoint:
      Phase 1 — Upload: send `notes` (file).  Returns a `session_id`.
      Phase 2 — Query:  send `user_query` + `session_id`.  Returns AI answer.
    Both fields can be sent together for a combined upload-then-query call.
    """
    temp_file_path = None
    active_session_id = session_id  # may be None on upload, required on query-only

    try:
        # ── Phase 1: document ingestion ───────────────────────────────────────
        if notes:
            # 1a. Content-type allowlist
            if notes.content_type not in ALLOWED_CONTENT_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Invalid file type: {notes.content_type}. "
                        "Only PDF and Word documents are allowed."
                    ),
                )

            # 1b. Extension vs content-type consistency (partial spoofing defence)
            file_extension = (
                notes.filename.rsplit(".", 1)[-1].lower()
                if notes.filename and "." in notes.filename
                else ""
            )
            allowed_exts = ALLOWED_EXTENSIONS.get(notes.content_type, [])
            if file_extension not in allowed_exts:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File extension does not match the declared content type.",
                )

            # 1c. Read once, then enforce size limit before touching the filesystem
            file_bytes = await notes.read()
            if len(file_bytes) > MAX_UPLOAD_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="File exceeds the 20 MB upload limit.",
                )

            # 1d. Write to a secure temp file
            with tempfile.NamedTemporaryFile(
                delete=False, suffix=f".{file_extension}"
            ) as temp_file:
                temp_file.write(file_bytes)
                temp_file_path = temp_file.name

            # 1e. Generate a unique collection name for this upload session
            active_session_id = uuid.uuid4().hex  # 32-char hex string

            def process_notes():
                doc = loader(temp_file_path, file_extension)
                store_document(active_session_id, doc)

            await run_in_threadpool(process_notes)

        # ── Phase 2: query ────────────────────────────────────────────────────
        if user_query:
            if not active_session_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "session_id is required to query notes. "
                        "Upload a document first and pass the returned session_id."
                    ),
                )
            result = await run_in_threadpool(
                chat_with_notes_agent, user_query, active_session_id
            )
            return {
                "message": "Query completed successfully",
                "results": result,
                "session_id": active_session_id,
            }

        if notes:
            return {
                "message": "Notes processed and stored successfully",
                "session_id": active_session_id,
            }

        return {"message": "No query or notes provided."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in chat_with_notes: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the request: {str(e)}",
        )
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)