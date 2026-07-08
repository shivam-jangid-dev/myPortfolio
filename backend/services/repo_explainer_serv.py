"""
FastAPI service for the GitHub Repo Explainer.

POST /repo-explain
  Body: { "repo_url": "https://github.com/owner/repo" }
  Returns: structured explanation + list of files read.

Orchestrates: GitHub API fetches → LLM file selection → sufficiency loop → synthesis.
"""

import time
import asyncio
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Request, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from middleware.rate_limiter import limiter
from services.github_api import (
    parse_github_url,
    fetch_repo_metadata,
    fetch_repo_languages,
    fetch_file_tree,
    fetch_files_parallel,
    format_tree_for_llm,
)
from llm.git_repo_explainer import (
    select_files,
    check_sufficiency,
    synthesize_explanation,
    MAX_SUFFICIENCY_ROUNDS,
)

router = APIRouter()
logger = logging.getLogger(__name__)

# ── In-memory cache ───────────────────────────────────────────────────────────
# repo_url → (response_dict, timestamp)
_cache: dict[str, tuple[dict, float]] = {}
_CACHE_TTL = 3600  # 1 hour

# Hard timeout for the entire analysis flow (seconds).
_HARD_TIMEOUT = 60


class RepoRequest(BaseModel):
    repo_url: str


def _get_cached(url: str) -> Optional[dict]:
    """Return cached result if still valid, else None."""
    entry = _cache.get(url)
    if entry is None:
        return None
    result, ts = entry
    if time.time() - ts > _CACHE_TTL:
        del _cache[url]
        return None
    return result


def _set_cache(url: str, result: dict) -> None:
    """Store a result in the cache."""
    _cache[url] = (result, time.time())


@router.post("/repo-explain")
@limiter.limit("3/minute")
async def repo_explain(request: Request, body: RepoRequest):
    """
    Analyze a public GitHub repository and return a structured explanation.
    Uses vectorless RAG: the LLM reasons over the file tree to select files.
    """
    repo_url = body.repo_url.strip()

    # ── 0. Check cache ────────────────────────────────────────────────────────
    cached = _get_cached(repo_url)
    if cached:
        logger.info("Cache hit for %s", repo_url)
        return cached

    # ── 1. Validate URL ───────────────────────────────────────────────────────
    try:
        owner, repo = parse_github_url(repo_url)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # ── 2. Run the analysis pipeline with a hard timeout ──────────────────────
    try:
        result = await asyncio.wait_for(
            _run_analysis(owner, repo),
            timeout=_HARD_TIMEOUT,
        )
    except asyncio.TimeoutError:
        logger.warning("Analysis timed out for %s/%s", owner, repo)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Analysis took too long. The repository may be very large. Please try again.",
        )
    except ValueError as e:
        # Known errors from GitHub API (404, rate limit, etc.)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Analysis failed for %s/%s: %s", owner, repo, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during analysis: {str(e)}",
        )

    # ── 3. Cache and return ───────────────────────────────────────────────────
    _set_cache(repo_url, result)
    return result


async def _run_analysis(owner: str, repo: str) -> dict:
    """
    Full analysis pipeline:
      1. Fetch metadata + tree (parallel)
      2. LLM selects files
      3. Fetch selected file contents
      4. Sufficiency loop (max N rounds)
      5. Final synthesis
    """
    async with httpx.AsyncClient(timeout=20.0) as client:
        # ── Step 1: Fetch metadata, languages, and file tree in parallel ──────
        meta_task = fetch_repo_metadata(client, owner, repo)
        lang_task = fetch_repo_languages(client, owner, repo)
        # We need the default branch for tree fetch, so get metadata first
        metadata = await meta_task
        branch = metadata["default_branch"]

        tree_task = fetch_file_tree(client, owner, repo, branch)
        languages, (tree_items, tree_truncated) = await asyncio.gather(
            lang_task, tree_task
        )

        # Format tree for LLM prompts
        tree_text = format_tree_for_llm(tree_items)
        if tree_truncated:
            tree_text = (
                "NOTE: This is a large repository. The tree below is truncated "
                "to the top 2 directory levels.\n\n" + tree_text
            )

        # ── Step 2: LLM selects files ────────────────────────────────────────
        selected_paths = await run_in_threadpool(
            select_files,
            owner,
            repo,
            metadata["description"],
            metadata["language"],
            tree_text,
        )
        logger.info("LLM selected %d files: %s", len(selected_paths), selected_paths)

        # ── Step 3: Fetch selected file contents ──────────────────────────────
        all_contents: dict[str, str] = {}
        batch_contents = await fetch_files_parallel(
            client, owner, repo, selected_paths
        )
        all_contents.update(batch_contents)

        # ── Step 4: Sufficiency loop ──────────────────────────────────────────
        rounds_done = 0
        for _ in range(MAX_SUFFICIENCY_ROUNDS):
            check = await run_in_threadpool(
                check_sufficiency, all_contents, tree_text
            )

            if check["status"] == "done":
                break

            # Fetch additional files
            more_paths = check.get("files", [])
            if not more_paths:
                break

            logger.info(
                "Sufficiency round %d: fetching %d more files: %s",
                rounds_done + 1,
                len(more_paths),
                more_paths,
            )
            more_contents = await fetch_files_parallel(
                client, owner, repo, more_paths
            )
            all_contents.update(more_contents)
            rounds_done += 1

        # ── Step 5: Final synthesis ───────────────────────────────────────────
        explanation = await run_in_threadpool(
            synthesize_explanation, metadata, all_contents, languages
        )

    return {
        "metadata": {
            "full_name": metadata["full_name"],
            "description": metadata["description"],
            "language": metadata["language"],
            "stars": metadata["stargazers_count"],
            "forks": metadata["forks_count"],
            "topics": metadata["topics"],
        },
        "explanation": explanation,
        "files_read": sorted(all_contents.keys()),
        "analysis_rounds": rounds_done + 1,
    }
