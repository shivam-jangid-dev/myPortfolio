"""
FastAPI service for the GitHub Repo Explainer.

Endpoints:
  POST /repo-explain          — Analyse a public GitHub repo (Phase 1)
  POST /repo-explain/ask      — Follow-up Q&A on an analysed repo (Phase 2)
  DELETE /repo-explain/session/{session_id} — Explicitly end a session

Orchestrates: GitHub API eager fetch -> single LLM call -> synthesis -> session-scoped follow-up Q&A with on-demand data.
"""

import time
import uuid
import asyncio
import logging
from dataclasses import dataclass, field

import httpx
from fastapi import APIRouter, Request, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from middleware.rate_limiter import limiter
from services.github_api import (
    parse_github_url,
    fetch_all_eager,
    fetch_on_demand,
    get_cached_repo,
    set_repo_cache,
    purge_expired_repo_cache,
    format_tree_for_llm,
    ON_DEMAND_ENDPOINTS,
)
from llm.git_repo_explainer import (
    synthesize_explanation,
    decide_followup_fetch,
    generate_followup_answer,
    MAX_FOLLOWUP_FETCHES,
)

router = APIRouter()
logger = logging.getLogger(__name__)

# ── Session management ────────────────────────────────────────────────────────

_SESSION_TTL = 1800  # 30 minutes of inactivity
_HARD_TIMEOUT = 120   # max seconds for the analysis pipeline


@dataclass
class Session:
    """In-memory session for a single repo analysis + Q&A conversation."""
    session_id: str
    owner: str
    repo: str
    metadata: dict
    eager_data: dict           # raw eager-fetch results
    explanation: dict          # final LLM explanation
    tree_text: str
    languages: dict
    qa_history: list = field(default_factory=list)
    last_access: float = field(default_factory=time.time)

    def touch(self) -> None:
        """Update last-access timestamp."""
        self.last_access = time.time()

    @property
    def is_expired(self) -> bool:
        return time.time() - self.last_access > _SESSION_TTL

    def repo_summary_for_llm(self) -> str:
        """Build a compact context string for follow-up Q&A prompts."""
        meta = self.metadata
        parts = [
            f"Repository: {meta.get('full_name', '')}",
            f"Description: {meta.get('description', '')}",
            f"Language: {meta.get('language', '')}",
            f"Stars: {meta.get('stargazers_count', 0)} | Forks: {meta.get('forks_count', 0)}",
        ]

        # Include the explanation if available
        expl = self.explanation
        if expl.get("what_it_does"):
            parts.append(f"\nWhat it does: {expl['what_it_does']}")
        if expl.get("architecture"):
            parts.append(f"Architecture: {expl['architecture']}")
        if isinstance(expl.get("tech_stack"), list):
            parts.append(f"Tech stack: {', '.join(expl['tech_stack'])}")

        # Condensed file tree (first 80 lines)
        tree_lines = self.tree_text.split("\n")
        if len(tree_lines) > 80:
            parts.append(f"\nFile tree (truncated to 80 lines):\n" + "\n".join(tree_lines[:80]))
        else:
            parts.append(f"\nFile tree:\n{self.tree_text}")

        return "\n".join(parts)


# Session store: session_id → Session
_sessions: dict[str, Session] = {}


def _purge_expired_sessions() -> None:
    """Remove all expired sessions."""
    expired = [sid for sid, s in _sessions.items() if s.is_expired]
    for sid in expired:
        logger.info("Purging expired session %s", sid[:8])
        del _sessions[sid]


async def session_cleanup_loop() -> None:
    """
    Background task that periodically purges expired sessions and repo cache.
    Designed to be launched once at app startup via asyncio.create_task().
    """
    while True:
        await asyncio.sleep(60)
        try:
            _purge_expired_sessions()
            purge_expired_repo_cache()
        except Exception as e:
            logger.error("Session cleanup error: %s", e, exc_info=True)


# ── Request / response models ────────────────────────────────────────────────

class RepoRequest(BaseModel):
    repo_url: str


class AskRequest(BaseModel):
    session_id: str
    question: str


# ── POST /repo-explain ────────────────────────────────────────────────────────


@router.post("/repo-explain")
@limiter.limit("3/minute")
async def repo_explain(request: Request, body: RepoRequest):
    """
    Analyze a public GitHub repository and return a structured explanation.
    Uses vectorless RAG over repository metadata and filtered file tree.
    Returns a session_id for follow-up questions.
    """

    repo_url = body.repo_url.strip()

    # 1. Validate GitHub URL
    try:
        owner, repo = parse_github_url(repo_url)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # 2. Execute analysis with timeout
    try:
        result = await asyncio.wait_for(
            _run_analysis(owner, repo),
            timeout=_HARD_TIMEOUT,
        )

    except asyncio.TimeoutError:
        logger.warning(
            "Analysis timed out for %s/%s",
            owner,
            repo,
        )

        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=(
                "Analysis took too long. "
                "The repository may be very large. Please try again."
            ),
        )

    except ValueError as e:
        logger.warning(
            "Repository validation/fetch error: %s",
            e,
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    except Exception as e:
        error_message = str(e).lower()

        logger.error(
            "Analysis failed for %s/%s: %s",
            owner,
            repo,
            e,
            exc_info=True,
        )

        # Token/request size errors
        if (
            "413" in error_message
            or "request too large" in error_message
            or "tokens per minute" in error_message
        ):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Repository context exceeded the AI model's "
                    "token limit. Please try again with a smaller "
                    "repository or reduced context."
                ),
            )

        # Rate-limit errors
        if (
            "429" in error_message
            or "rate_limit_exceeded" in error_message
            or "rate limit" in error_message
        ):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "The AI service has reached its rate limit. "
                    "Please try again later."
                ),
            )

        # Other unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during repository analysis.",
        )

    return result


# ── POST /repo-explain/ask ────────────────────────────────────────────────────

@router.post("/repo-explain/ask")
@limiter.limit("3/minute")
async def repo_ask(request: Request, body: AskRequest):
    """
    Answer a follow-up question about an already-analysed repo.
    The LLM decides if it needs more GitHub data; if so, fetches one
    on-demand endpoint at a time (capped at 2 per question).
    """
    session = _sessions.get(body.session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired. Please analyse the repository again.",
        )

    session.touch()
    question = body.question.strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty.",
        )

    try:
        answer = await _run_followup(session, question)
    except Exception as e:
        logger.error(
            "Follow-up failed for session %s: %s", body.session_id[:8], e,
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while answering: {str(e)}",
        )

    # Store in Q&A history
    session.qa_history.append({"question": question, "answer": answer})

    return {"answer": answer, "session_id": body.session_id}


# ── DELETE /repo-explain/session/{session_id} ─────────────────────────────────

@router.delete("/repo-explain/session/{session_id}", status_code=204)
async def repo_session_delete(session_id: str):
    """Explicitly end a session and free its memory."""
    removed = _sessions.pop(session_id, None)
    if removed:
        logger.info("Session %s explicitly ended", session_id[:8])
    # Always return 204 — idempotent delete


# ── Analysis pipeline (Phase 1) ──────────────────────────────────────────────

async def _run_analysis(owner: str, repo: str) -> dict:
    """
    Full analysis pipeline:
      1. Fetch all eager endpoints (parallel, with shared cache)
      2. LLM creates final synthesis directly from eager data
      3. Create session
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        # ── Step 1: Fetch eager data (check shared cache first) ───────────────
        cached_eager = get_cached_repo(owner, repo)
        if cached_eager:
            logger.info("Shared cache hit for %s/%s", owner, repo)
            eager = cached_eager
        else:
            eager = await fetch_all_eager(client, owner, repo)
            set_repo_cache(owner, repo, eager)

        metadata = eager["metadata"]
        languages = eager["languages"]
        tree_text = eager["tree_text"]
        readme = eager["readme"]
        contributors = eager["contributors"]
        commits = eager["commits"]

        # ── Step 2: Final synthesis in one shot ───────────────────────────────
        explanation = await run_in_threadpool(
            synthesize_explanation,
            metadata,
            tree_text,
            languages,
            readme,
            contributors,
            commits,
        )

    # ── Step 3: Create session ────────────────────────────────────────────────
    session_id = uuid.uuid4().hex
    session = Session(
        session_id=session_id,
        owner=owner,
        repo=repo,
        metadata=metadata,
        eager_data=eager,
        explanation=explanation,
        tree_text=tree_text,
        languages=languages,
    )
    _sessions[session_id] = session
    logger.info("Created session %s for %s/%s", session_id[:8], owner, repo)

    return {
        "session_id": session_id,
        "metadata": {
            "full_name": metadata["full_name"],
            "description": metadata["description"],
            "language": metadata["language"],
            "stars": metadata["stargazers_count"],
            "forks": metadata["forks_count"],
            "topics": metadata["topics"],
            "license": metadata.get("license", "None"),
        },
        "explanation": explanation,
        "files_read": [],  # We no longer read specific files in Phase 1
        "analysis_rounds": 1,
    }


# ── Follow-up pipeline (Phase 2) ─────────────────────────────────────────────

async def _run_followup(session: Session, question: str) -> str:
    """
    Handle a follow-up question:
      1. Ask LLM if it needs more data
      2. If yes, fetch the on-demand endpoint
      3. Generate final answer
    Cap at MAX_FOLLOWUP_FETCHES extra fetches per question.
    """
    repo_summary = session.repo_summary_for_llm()
    extra_data_parts: list[str] = []

    async with httpx.AsyncClient(timeout=60.0) as client:
        for fetch_round in range(MAX_FOLLOWUP_FETCHES):
            # Include any data already fetched this question
            current_extra = "\n\n".join(extra_data_parts) if extra_data_parts else ""

            # Build context that includes any already-fetched data
            decision_summary = repo_summary
            if current_extra:
                decision_summary += f"\n\nData already fetched for this question:\n{current_extra}"

            decision = await run_in_threadpool(
                decide_followup_fetch,
                question,
                decision_summary,
                session.qa_history,
            )

            if decision is None:
                # LLM has enough info — break and answer
                break

            endpoint = decision["endpoint"]
            params = decision.get("params", {})
            logger.info(
                "Follow-up fetch round %d: %s (params=%s)",
                fetch_round + 1, endpoint, params,
            )

            fetched = await fetch_on_demand(
                client, session.owner, session.repo, endpoint, params
            )
            extra_data_parts.append(f"[{endpoint}]:\n{fetched}")

    # Generate the final answer
    all_extra = "\n\n".join(extra_data_parts) if extra_data_parts else ""
    answer = await run_in_threadpool(
        generate_followup_answer,
        question,
        repo_summary,
        all_extra,
        session.qa_history,
    )

    return answer
