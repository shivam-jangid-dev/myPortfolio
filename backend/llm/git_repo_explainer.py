"""
LLM orchestration for the GitHub Repo Explainer.

Three-stage pipeline:
  1. File Selector   — picks 5-8 key files from the tree
  2. Sufficiency Loop — checks if enough info gathered (max 2 rounds)
  3. Final Synthesis  — produces structured explanation

This is "vectorless RAG": retrieval is driven by LLM reasoning over the
repo's structured file tree, not by vector similarity search.
"""

import json
import logging

from langchain_core.messages import SystemMessage, HumanMessage
from .model_init import model_initialization

logger = logging.getLogger(__name__)

# ── Loop caps ──────────────────────────────────────────────────────────────────
MAX_SUFFICIENCY_ROUNDS = 2
MAX_FILES_PER_ROUND = 8
MAX_INITIAL_FILES = 8


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


# ── Stage 1: File Selector ────────────────────────────────────────────────────

def select_files(
    owner: str,
    repo: str,
    description: str,
    language: str,
    file_tree: str,
) -> list[str]:
    """
    Given repo metadata and file tree, ask the LLM to select 5-8 key files.
    Returns a list of file paths.
    """
    system = (
        "You are exploring a GitHub repository to understand it. "
        "Your task is to select the most informative files to read."
    )

    user = f"""Repo: {owner}/{repo}
Description: {description}
Primary language: {language}

Full file tree:
{file_tree}

From this file tree, select the {MAX_INITIAL_FILES} files most likely to reveal
what this project does and how it works. Prioritize:
- README or similar docs
- Entry points (main.py, index.js, app.js, cmd/main.go, etc.)
- Config files (package.json, requirements.txt, Cargo.toml, Dockerfile, etc.)
- Core source files that appear central based on naming and location

Return ONLY a JSON array of file paths, nothing else.
Example: ["README.md", "src/index.js", "package.json"]"""

    raw = _invoke_llm(system, user)

    try:
        result = _parse_json_response(raw)
        if isinstance(result, list):
            # Ensure all items are strings and limit count
            paths = [str(p) for p in result if isinstance(p, str)]
            return paths[:MAX_INITIAL_FILES]
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning("Failed to parse file selector response: %s", e)

    # Fallback: try to extract paths from the raw text
    logger.warning("Using fallback path extraction from LLM response")
    return _fallback_extract_paths(raw)


def _fallback_extract_paths(text: str) -> list[str]:
    """Last-resort extraction: pull quoted strings that look like file paths."""
    import re
    paths = re.findall(r'"([^"]+\.[a-zA-Z]+)"', text)
    return paths[:MAX_INITIAL_FILES]


# ── Stage 2: Sufficiency Check ────────────────────────────────────────────────

def check_sufficiency(
    file_contents: dict[str, str],
    file_tree: str,
) -> dict:
    """
    Ask the LLM if it has enough information to explain the repo.
    Returns {"status": "done"} or {"status": "need_more", "files": [...]}.
    """
    system = (
        "You are analyzing a GitHub repository. Decide if you have enough "
        "information to write a complete explanation, or if you need to read more files."
    )

    # Format file contents for the prompt
    files_text = ""
    for path, content in file_contents.items():
        files_text += f"\n--- {path} ---\n{content}\n"

    user = f"""You have read the following files so far:
{files_text}

Full file tree for reference:
{file_tree}

Do you now have enough information to explain what this project does,
its architecture, and how to run it?

If yes, return: {{"status": "done"}}
If no, return: {{"status": "need_more", "files": ["path1", "path2"]}}
(select up to {MAX_FILES_PER_ROUND} additional files that would fill gaps in your understanding)

Return ONLY valid JSON, nothing else."""

    raw = _invoke_llm(system, user)

    try:
        result = _parse_json_response(raw)
        if isinstance(result, dict):
            status = result.get("status", "done")
            if status == "need_more":
                files = result.get("files", [])
                files = [str(f) for f in files if isinstance(f, str)]
                return {"status": "need_more", "files": files[:MAX_FILES_PER_ROUND]}
            return {"status": "done"}
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning("Failed to parse sufficiency check: %s — assuming done", e)

    return {"status": "done"}


# ── Stage 3: Final Synthesis ──────────────────────────────────────────────────

def synthesize_explanation(
    metadata: dict,
    file_contents: dict[str, str],
    languages: dict[str, int],
) -> dict:
    """
    Generate the final structured explanation of the repository.
    Returns a dict with the explanation sections.
    """
    system = (
        "You are explaining a GitHub repository to a developer seeing it for the "
        "first time. Base your answer ONLY on the data below — do not invent "
        "file or folder names that weren't given to you. Be specific and concrete."
    )

    # Format file contents
    files_text = ""
    for path, content in file_contents.items():
        files_text += f"\n--- {path} ---\n{content}\n"

    # Format language breakdown
    lang_text = ", ".join(
        f"{lang} ({bytes_count:,} bytes)"
        for lang, bytes_count in sorted(
            languages.items(), key=lambda x: x[1], reverse=True
        )
    )

    user = f"""Repository: {metadata.get('full_name', 'Unknown')}
Description: {metadata.get('description', 'N/A')}
Stars: {metadata.get('stargazers_count', 0)} | Forks: {metadata.get('forks_count', 0)}
Languages: {lang_text}
Topics: {', '.join(metadata.get('topics', [])) or 'None'}

Files read:
{files_text}

Respond in EXACTLY this JSON structure (all values are strings):
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