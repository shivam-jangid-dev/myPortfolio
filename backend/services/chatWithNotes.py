import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status

# Note the changed import for `query_notes`
from llm.chat_with_notes import loader, EmbeddingGenerator, vector_store, query_notes

router = APIRouter()

ALLOWED_CONTENT_TYPES = [
    "application/pdf",  
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  
    "application/msword"
]

@router.post("/chat-with-notes")
async def chat_with_notes(user_query: str = Form(None), notes: UploadFile = File(...)):
    temp_file_path = None
    try:
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
        
        # Ingestion pipeline
        doc = loader(temp_file_path, file_extension)
        embed = EmbeddingGenerator()
        chunked_docs = embed.chunk_document(doc)
        embeddings = embed.embed_chunks(chunked_docs)
        vector_store(chunked_docs, embeddings)

        # Query pipeline (Changed `query` parameter to `user_query` to avoid name collisions)
        if user_query:
            result = query_notes(user_query)
            return {"message": "Notes processed successfully", "results": result}
            
        return {"message": "Notes processed and stored successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the file: {str(e)}"
        )
    finally:
        # CRITICAL: Clean up the temporary file so you don't run out of disk space
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)