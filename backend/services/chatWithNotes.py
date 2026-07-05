import os
import tempfile
import logging
from fastapi import APIRouter, Request, UploadFile, File, Form, HTTPException, status
from fastapi.concurrency import run_in_threadpool

# Note the changed import for `query_notes`
from llm.chat_with_notes import loader, get_embedder, vector_store, chat_with_notes_agent
from middleware.rate_limiter import limiter

router = APIRouter()

ALLOWED_CONTENT_TYPES = [
    "application/pdf",  
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  
    "application/msword"
]

@router.post("/chat-with-notes")
@limiter.limit("3/minute")
async def chat_with_notes(request: Request, user_query: str = Form(None), notes: UploadFile = File(None)):
    temp_file_path = None
    try:
        if notes:
            if notes.content_type not in ALLOWED_CONTENT_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid file type: {notes.content_type}. Only PDF and Word documents are allowed."
                )
            
            # Save temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{notes.filename.split('.')[-1]}") as temp_file:
                temp_file.write(await notes.read())
                temp_file_path = temp_file.name
            
            # Extract extension safely (e.g., "pdf" or "docx")
            file_extension = notes.filename.split('.')[-1]
            
            # Ingestion pipeline in threadpool
            def process_notes():
                doc = loader(temp_file_path, file_extension)
                embed = get_embedder()
                chunked_docs = embed.chunk_document(doc)
                embeddings = embed.embed_chunks(chunked_docs)
                vector_store(chunked_docs, embeddings)

            await run_in_threadpool(process_notes)

        # Query pipeline (Changed `query` parameter to `user_query` to avoid name collisions)
        if user_query:
            result = await run_in_threadpool(chat_with_notes_agent, user_query)
            return {"message": "Notes processed successfully", "results": result}
            
        if notes:
            return {"message": "Notes processed and stored successfully"}
            
        return {"message": "No query or notes provided."}

    except Exception as e:
        logging.error(f"Error in chat_with_notes: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the file: {str(e)}"
        )
    finally:
        # CRITICAL: Clean up the temporary file so you don't run out of disk space
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)