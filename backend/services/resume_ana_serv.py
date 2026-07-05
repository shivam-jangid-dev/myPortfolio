from api.routes import router
from fastapi import Request, UploadFile, File, Form, HTTPException, status
from typing import Optional
from llm.resume_analyzer import resume_analyzer
from langchain_community.document_loaders import PyMuPDFLoader, TextLoader, Docx2txtLoader, JSONLoader
import base64
import tempfile
import os
from middleware.rate_limiter import limiter

# Define the file types you want to accept
ALLOWED_CONTENT_TYPES = [
    "application/pdf",  # .pdf files
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx files
    "application/msword",  # older .doc files
    "image/png", # .png files
    "image/jpeg", # .jpeg files
    "image/jpg"  # .jpg files
]

@router.post("/resume-analysis")
@limiter.limit("3/minute")
async def resume_analysis(
    request: Request,
    resume: UploadFile = File(...), 
    # Form(None) makes the JD an optional text field in the same form
    job_description: Optional[str] = Form(None) 
):
    try:# Check if the uploaded file's type is in our allowed list
        if resume.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type: {resume.content_type}. Only PDF and Word documents are allowed."
            )

        extracted_data = None

        # 2. Handle Images (Do it entirely in memory!)
        if resume.content_type in ["image/png", "image/jpeg","image/jpg"]:
            # Read the bytes directly from the uploaded file
            file_bytes = await resume.read()
            # Encode to base64 string instantly
            extracted_data = base64.b64encode(file_bytes).decode('utf-8')

        # 3. Handle Documents (Requires saving to disk for LangChain)
        else:
            # Create a secure, temporary file on the server
            with tempfile.NamedTemporaryFile(delete=False, suffix=resume.filename) as temp_file:
                temp_file.write(await resume.read())
                temp_file_path = temp_file.name

            try:
                # Pass the physical file path to LangChain
                if resume.content_type == "application/pdf":
                    loader = PyMuPDFLoader(temp_file_path)
                    extracted_data = loader.load()
                    extracted_data = "\n".join([doc.page_content for doc in extracted_data])
                    
                elif resume.content_type in [
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/msword"
                ]:
                    loader = Docx2txtLoader(temp_file_path)
                    extracted_data = loader.load()
                    extracted_data = "\n".join([doc.page_content for doc in extracted_data])
            finally:
                # ALWAYS clean up the temporary file so your server's hard drive doesn't fill up
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
            
        if job_description:
            result = resume_analyzer(extracted_data, job_description)
            return result
        else:
            result = resume_analyzer(extracted_data)
            return result

    except HTTPException:
        # If it's already an HTTPException (like our 400 error), just raise it as-is
        raise
    except Exception as e:
        # For any other crash, raise a 500 Internal Server Error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the file: {str(e)}"
        )
