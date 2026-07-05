import os
import tempfile
import logging
from fastapi import APIRouter, Request, UploadFile, File, Form, HTTPException, status
from typing import Optional
from langchain_community.document_loaders import PyMuPDFLoader, Docx2txtLoader
import base64
from middleware.rate_limiter import limiter
from llm.resume_analyzer import resume_analyzer

router = APIRouter()

logger = logging.getLogger(__name__)

MAX_UPLOAD_SIZE = 20 * 1024 * 1024  # 20 MB

# Allowlisted MIME types
ALLOWED_CONTENT_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "image/png",
    "image/jpeg",
    "image/jpg",
]

# Maps each allowed MIME type to the file extensions that legitimately produce it.
# Checked alongside content_type to partially mitigate spoofed Content-Type headers.
ALLOWED_EXTENSIONS: dict[str, list[str]] = {
    "application/pdf": ["pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
    "application/msword": ["doc"],
    "image/png": ["png"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/jpg": ["jpg", "jpeg"],
}


@router.post("/resume-analysis")
@limiter.limit("3/minute")
async def resume_analysis(
    request: Request,
    resume: UploadFile = File(...),
    job_description: Optional[str] = Form(None),
):
    temp_file_path = None
    try:
        # ── 1. Content-type allowlist ─────────────────────────────────────────
        if resume.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid file type: {resume.content_type}. "
                    "Only PDF, Word documents, and images are allowed."
                ),
            )

        # ── 2. Extension vs content-type consistency check ────────────────────
        file_ext = (
            resume.filename.rsplit(".", 1)[-1].lower()
            if resume.filename and "." in resume.filename
            else ""
        )
        allowed_exts = ALLOWED_EXTENSIONS.get(resume.content_type, [])
        if file_ext not in allowed_exts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File extension does not match the declared content type.",
            )

        # ── 3. Read once, then enforce size limit before touching the filesystem
        file_bytes = await resume.read()
        if len(file_bytes) > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File exceeds the 20 MB upload limit.",
            )

        extracted_data = None

        # ── 4a. Images — processed entirely in memory ─────────────────────────
        if resume.content_type in ["image/png", "image/jpeg", "image/jpg"]:
            extracted_data = base64.b64encode(file_bytes).decode("utf-8")

        # ── 4b. Documents — requires a temp file for LangChain loaders ────────
        else:
            with tempfile.NamedTemporaryFile(
                delete=False, suffix=f".{file_ext}"   # fixed: was using full filename as suffix
            ) as temp_file:
                temp_file.write(file_bytes)
                temp_file_path = temp_file.name

            try:
                if resume.content_type == "application/pdf":
                    doc_loader = PyMuPDFLoader(temp_file_path)   # renamed: avoids shadowing import
                    extracted_data = "\n".join(
                        [doc.page_content for doc in doc_loader.load()]
                    )
                elif resume.content_type in [
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/msword",
                ]:
                    doc_loader = Docx2txtLoader(temp_file_path)  # renamed: avoids shadowing import
                    extracted_data = "\n".join(
                        [doc.page_content for doc in doc_loader.load()]
                    )
            finally:
                if temp_file_path and os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                    temp_file_path = None  # prevent double-delete in outer finally

        # ── 5. Run LLM analysis ───────────────────────────────────────────────
        result = resume_analyzer(extracted_data, job_description)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in resume_analysis: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the file: {str(e)}",
        )
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
