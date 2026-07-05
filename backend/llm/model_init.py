import os
import logging
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv

load_dotenv()

# ── Startup validation ──────────────────────────────────────────────────────
# Fail loudly at import time so Railway/deployment surfaces the error immediately
# rather than at the first real request.
_GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not _GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY environment variable is not set. "
        "Add it to your .env file (development) or deployment environment (production)."
    )

# Model can be overridden per-deployment via LLM_MODEL_NAME env var.
_DEFAULT_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "groq/llama-3.3-70b-versatile")

logger = logging.getLogger(__name__)


def model_initialization(
    system_prompt: str,
    model_name: str = "",
    response_format: str = "{}",
):
    resolved_model = model_name if model_name else _DEFAULT_MODEL_NAME
    logger.debug("Initialising model: %s", resolved_model)
    model = init_chat_model(
        model=resolved_model,
        temperature=1,
        system_prompt=system_prompt,
        response_format=response_format,
    )
    return model
