from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel

from .model_init import model_initialization


class ResumeAnalysis(BaseModel):
    score: int
    summary: str
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]


# Single system prompt — job description is passed in the human message, NOT the
# system prompt, to avoid prompt-injection via user-supplied JD text.
_SYSTEM_PROMPT = """
You are a professional resume analyser.
Analyse the provided resume (and optional job description) and return a JSON object with:
  "score"           (int, 0-100)
  "summary"         (str, 2-3 sentence overall assessment)
  "strengths"       (list[str], 3-5 specific strengths)
  "weaknesses"      (list[str], 2-4 specific areas for improvement)
  "recommendations" (list[str], 3-5 concrete, actionable improvements)
"""


def resume_analyzer(resume_text: str, job_description: str = None) -> dict:
    # response_format uses .with_structured_output() under the hood (LangChain 1.x).
    model = model_initialization(response_format=ResumeAnalysis)

    # Keep user-supplied content in the human message, never in the system prompt.
    # This prevents job_description from being used as a prompt-injection vector.
    if job_description:
        human_content = (
            f"Resume:\n{resume_text}\n\n"
            f"Job Description (score and tailor feedback against this):\n{job_description}"
        )
    else:
        human_content = f"Resume:\n{resume_text}"

    # System prompt is passed as a message, not a model constructor kwarg (LangChain 1.x).
    response = model.invoke([
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(content=human_content),
    ])

    # with_structured_output returns the Pydantic model directly — no .content needed.
    return response.model_dump()