from .model_init import model_initialization   # fixed: relative import (was bare `from model_init`)
from pydantic import BaseModel


class ResumeAnalysis(BaseModel):
    score: int
    feedback: str
    suggestion: str


# Single system prompt — job description is passed in the human message, NOT the
# system prompt, to avoid prompt-injection via user-supplied JD text.
_SYSTEM_PROMPT = """
You are a professional resume analyser.
Analyse the provided resume (and optional job description) and return a JSON object with:
  "score"      (int, 0-100)
  "feedback"   (str, detailed section-by-section feedback)
  "suggestion" (str, concrete, actionable improvements)
"""


def resume_analyzer(resume_text: str, job_description: str = None) -> str:
    model = model_initialization(_SYSTEM_PROMPT, response_format=ResumeAnalysis)

    # Keep user-supplied content in the human message, never in the system prompt.
    # This prevents job_description from being used as a prompt-injection vector.
    if job_description:
        human_message = (
            f"Resume:\n{resume_text}\n\n"
            f"Job Description (score and tailor feedback against this):\n{job_description}"
        )
    else:
        human_message = f"Resume:\n{resume_text}"

    response = model.invoke([human_message])
    return response.content