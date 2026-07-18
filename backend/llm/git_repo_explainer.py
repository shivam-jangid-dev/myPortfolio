"""
LLM orchestration for the GitHub Repo Explainer.

Two-stage pipeline:
  1. Final Synthesis  — produces structured explanation directly from eager data
  2. Answer Followup  — decides if more data is needed, fetches it, answers

This is "vectorless RAG": retrieval is driven by LLM reasoning over the
repo's structured file tree and metadata, not by vector similarity search.
"""

import json
import logging

from langchain_core.messages import SystemMessage, HumanMessage
from .model_init import model_initialization

logger = logging.getLogger(__name__)

# ── Loop caps ──────────────────────────────────────────────────────────────────
MAX_FOLLOWUP_FETCHES = 2


def _parse_json_response(text: str) -> dict | list:
    """
    Parse a JSON response from the LLM.
    Handles common quirks: markdown code fences, trailing text, etc.
    """
    cleaned = text.strip()

    # Strip markdown code fences if present
    if cleaned.startswith("```"):
        # Remove opening fence (possibly with language identifier)
        first_newline = cleaned.index("\n") if "\n" in cleaned else len(cleaned)
        cleaned = cleaned[first_newline + 1:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]

    cleaned = cleaned.strip()
    return json.loads(cleaned)


def _invoke_llm(system: str, user: str, retry: bool = True) -> str:
    """Call the LLM and return the raw text response. Retries once on failure."""
    model = model_initialization()
    try:
        response = model.invoke([
            SystemMessage(content=system),
            HumanMessage(content=user),
        ])
        return response.content
    except Exception as e:
        if retry:
            logger.warning("LLM call failed, retrying: %s", e)
            return _invoke_llm(system, user, retry=False)
        raise


# ── Stage 1: Final Synthesis ──────────────────────────────────────────────────

def synthesize_explanation(
    metadata: dict,
    file_tree: str,
    languages: dict[str, int],
    readme: str = "",
    contributors: list[dict] | None = None,
    commits: list[dict] | None = None,
) -> dict:
    """
    Generate the final structured explanation of the repository in a single shot.
    Returns a dict with the explanation sections.
    """
    system = (
        "You are explaining a GitHub repository to a developer seeing it for the "
        "first time. Base your answer ONLY on the data below — do not invent "
        "file or folder names that weren't given to you. Be specific and concrete."
    )

    # Format language breakdown
    lang_text = ", ".join(
        f"{lang} ({bytes_count:,} bytes)"
        for lang, bytes_count in sorted(
            languages.items(), key=lambda x: x[1], reverse=True
        )
    )

    # Build contributor and commit sections
    extra_context = ""
    if readme:
        extra_context += f"\nREADME.md:\n{readme}\n"

    if contributors:
        contrib_lines = ", ".join(
            f"{c['login']} ({c['contributions']} commits)" for c in contributors[:10]
        )
        extra_context += f"\nTop contributors: {contrib_lines}\n"

    if commits:
        commit_lines = "\n".join(
            f"  - {c['author']}: {c['message'][:120]} ({c['date'][:10]})"
            for c in commits[:10]
        )
        extra_context += f"\nRecent commits:\n{commit_lines}\n"

    user = f"""Repository: {metadata.get('full_name', 'Unknown')}
Description: {metadata.get('description', 'N/A')}
Stars: {metadata.get('stargazers_count', 0)} | Forks: {metadata.get('forks_count', 0)}
License: {metadata.get('license', 'None')}
Languages: {lang_text}
Topics: {', '.join(metadata.get('topics', [])) or 'None'}
{extra_context}
Full file tree:
{file_tree}

Respond in EXACTLY this JSON structure (all values are strings except tech_stack which is a list):
{{
  "what_it_does": "2-3 plain-English sentences explaining what this project does",
  "tech_stack": ["item1", "item2", "item3"],
  "architecture": "How the pieces fit together — describe the project structure, key modules, and data flow",
  "getting_started": "Setup steps (from README if present, else reasonable defaults based on the tech stack)",
  "notable": "Anything interesting: testing setup, CI/CD, unusual structure, design patterns, etc."
}}

Return ONLY valid JSON, nothing else."""

    raw = _invoke_llm(system, user)

    try:
        result = _parse_json_response(raw)
        if isinstance(result, dict):
            # Ensure tech_stack is a list
            if isinstance(result.get("tech_stack"), str):
                result["tech_stack"] = [result["tech_stack"]]
            return result
    except (json.JSONDecodeError, ValueError) as e:
        logger.error("Failed to parse synthesis response: %s", e)

    # Fallback: return raw text as a single section
    return {
        "what_it_does": raw[:500] if raw else "Unable to generate explanation.",
        "tech_stack": [metadata.get("language", "Unknown")],
        "architecture": "Unable to parse structured response from AI.",
        "getting_started": "Please refer to the repository's README.",
        "notable": "",
    }


# ── Stage 2: Follow-up Q&A ───────────────────────────────────────────────────

# Allowed on-demand endpoint keys the LLM can request
_ENDPOINT_DESCRIPTIONS = {
    "issues": "List open issues",
    "pull_requests": "List open pull requests",
    "releases": "List releases / versions",
    "file_content": "Read a specific file (requires 'path' param)",
    "issue_detail": "Read a specific issue (requires 'number' param)",
}


def decide_followup_fetch(
    question: str,
    repo_summary: str,
    qa_history: list[dict] | None = None,
) -> dict | None:
    """
    Ask the LLM whether it needs additional GitHub data to answer a follow-up
    question, or if it already has enough context.

    Returns None if no fetch is needed.
    Returns {"endpoint": "...", "params": {...}} if it needs data.
    """
    system = (
        "You are answering follow-up questions about a GitHub repository. "
        "You have access to a set of on-demand endpoints to fetch more data "
        "if needed. Decide whether you need additional data to answer."
    )

    endpoints_desc = "\n".join(
        f'  "{key}": {desc}' for key, desc in _ENDPOINT_DESCRIPTIONS.items()
    )

    history_text = ""
    if qa_history:
        for entry in qa_history[-5:]:  # Last 5 Q&A pairs for context
            history_text += f"\nQ: {entry.get('question', '')}\nA: {entry.get('answer', '')[:300]}\n"

    user = f"""Repository context:
{repo_summary}

{f"Previous Q&A:{history_text}" if history_text else ""}

New question: {question}

Available endpoints you can request:
{endpoints_desc}

If you already have enough information to answer this question from the
repository context above, return:
{{"endpoint": null}}

If you need more data, return:
{{"endpoint": "<key>", "params": {{"path": "src/file.py"}}}}

Notes:
- "params" is only needed for "file_content" (needs "path") and "issue_detail" (needs "number")
- For other endpoints, omit "params" or set it to {{}}
- Only request ONE endpoint at a time

Return ONLY valid JSON, nothing else."""

    raw = _invoke_llm(system, user)

    try:
        result = _parse_json_response(raw)
        if isinstance(result, dict):
            endpoint = result.get("endpoint")
            if endpoint is None or endpoint == "null":
                return None
            if endpoint in _ENDPOINT_DESCRIPTIONS:
                return {
                    "endpoint": endpoint,
                    "params": result.get("params") or {},
                }
            logger.warning("LLM requested unknown endpoint: %s", endpoint)
            return None
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning("Failed to parse followup-fetch decision: %s", e)

    return None


def generate_followup_answer(
    question: str,
    repo_summary: str,
    extra_data: str = "",
    qa_history: list[dict] | None = None,
) -> str:
    """
    Generate the final answer to a follow-up question, optionally incorporating
    freshly-fetched on-demand data.
    """
    system = (
        "You are a helpful assistant answering questions about a GitHub repository. "
        "Be concise and specific. Base your answer on the data provided — do not "
        "make up information that isn't in the context."
    )

    history_text = ""
    if qa_history:
        for entry in qa_history[-5:]:
            history_text += f"\nQ: {entry.get('question', '')}\nA: {entry.get('answer', '')[:300]}\n"

    data_section = ""
    if extra_data:
        data_section = f"\nAdditional data fetched for this question:\n{extra_data}\n"

    user = f"""Repository context:
{repo_summary}

{f"Previous Q&A:{history_text}" if history_text else ""}
{data_section}

Question: {question}

Provide a clear, helpful answer based on the information available."""

    return _invoke_llm(system, user)