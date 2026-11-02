import os
import logging
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv

load_dotenv()

# ── Startup validation ──────────────────────────────────────────────────────
# Fail loudly at import time so Railway/deployment surfaces the error immediately
# rather than at the first real request.
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY environment variable is not set. "
        "Add it to your .env file (development) or deployment environment (production)."
    )

# Model can be overridden per-deployment via LLM_MODEL_NAME env var.
_DEFAULT_MODEL_NAME = os.getenv(
    "LLM_MODEL_NAME",
    "openai/gpt-oss-20b"
)

logger = logging.getLogger(__name__)


def model_initialization(
    system_prompt: str = "",
    model_name: str = "",
    response_format=None,
):
    """Initialize Groq chat model using LangChain."""

    model = init_chat_model(
        model=model_name or _DEFAULT_MODEL_NAME,
        model_provider="groq",
        api_key=GROQ_API_KEY,
        temperature=0.7,
        timeout=30,
        max_retries=1,
        max_tokens=1000,
    )

    if response_format is not None:
        model = model.with_structured_output(response_format)

    return model
