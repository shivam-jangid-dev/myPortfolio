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
    system_prompt: str = "",   # retained for call-site compatibility; not passed to model init
    model_name: str = "",
    response_format=None,
):
    """
    Return an initialised LangChain chat model.

    LangChain 1.x changes vs 0.x:
    - model_provider must be passed explicitly (no longer inferred from "provider/model").
    - system_prompt is NOT a constructor kwarg; callers must include it as a SystemMessage.
    - Structured output is configured via .with_structured_output(), not a constructor kwarg.
    """
    resolved_model = model_name if model_name else _DEFAULT_MODEL_NAME

    # LangChain 1.x requires model_provider to be passed explicitly.
    if "/" in resolved_model:
        model_provider, model_id = resolved_model.split("/", 1)
    else:
        model_provider = None
        model_id = resolved_model

    logger.debug("Initialising model: %s (provider: %s)", model_id, model_provider)

    kwargs = dict(model=model_id, temperature=1)
    if model_provider:
        kwargs["model_provider"] = model_provider

    model = init_chat_model(**kwargs)

    # Structured output is applied as a post-processor, not a constructor kwarg.
    if response_format is not None:
        model = model.with_structured_output(response_format)

    return model
