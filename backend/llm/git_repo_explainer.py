
"""
LLM orchestration for GitHub Repository Explainer.

Architecture:
1. Final Synthesis
2. Follow-up Fetch Decision
3. Follow-up Answer Generation

Uses vectorless RAG with compact repository context.
"""

import json
import logging
import re
import os
from langchain_core.messages import SystemMessage, HumanMessage

from .model_init import model_initialization

logger = logging.getLogger(__name__)

MAX_FOLLOWUP_FETCHES = 2

# Conservative context limits.
# These are character limits, not exact token limits.
MAX_README_CHARS = 5000
MAX_TREE_CHARS = 10000
MAX_TOTAL_CONTEXT_CHARS = 20000
MAX_FOLLOWUP_CONTEXT_CHARS = 9000
MAX_EXTRA_DATA_CHARS = 4000

IMPORTANT_FILES = {
    "readme.md",
    "requirements.txt",
    "pyproject.toml",
    "package.json",
    "package-lock.json",
    "dockerfile",
    "docker-compose.yml",
    "main.py",
    "app.py",
    "manage.py",
    "go.mod",
    "cargo.toml",
    "pom.xml",
    "build.gradle",
    "makefile",
    ".env.example",
}

IGNORED_PARTS = {
    ".git",
    ".github",
    ".venv",
    "venv",
    "env",
    "__pycache__",
    "node_modules",
    "dist",
    "build",
    ".next",
    ".pytest_cache",
    ".mypy_cache",
    "coverage",
    "vendor",
}


def _limit_text(text: str, max_chars: int) -> str:
    """Limit text without exceeding the configured character budget."""

    if not text:
        return ""

    if len(text) <= max_chars:
        return text

    return text[:max_chars] + "\n...[truncated]"


def _filter_file_tree(file_tree: str) -> str:
    """
    Prioritize important files and remove unnecessary paths.

    Keeps important project configuration and source files first.
    """

    if not file_tree:
        return "File tree unavailable."

    important = []
    regular = []

    seen = set()

    for line in file_tree.splitlines():

        path = line.strip()

        if not path:
            continue

        normalized = path.replace("\\", "/").lower()
        parts = normalized.split("/")

        # Ignore generated and dependency directories.
        if any(part in IGNORED_PARTS for part in parts):
            continue

        if normalized in seen:
            continue

        seen.add(normalized)

        filename = parts[-1]

        if filename in IMPORTANT_FILES:
            important.append(path)

        elif (
            filename.endswith((".py", ".js", ".jsx", ".ts", ".tsx",
                               ".java", ".go", ".rs", ".php"))
            or path.endswith("/")
        ):
            regular.append(path)

    # Prioritize important files.
    selected = important[:80] + regular[:120]

    result = "\n".join(selected)

    return _limit_text(result, MAX_TREE_CHARS)


def _estimate_tokens(text: str) -> int:
    """
    Rough token estimate.

    This is intentionally conservative and is not a substitute
    for the model provider's actual tokenizer.
    """

    return max(1, len(text) // 3)


def _parse_json_response(text: str) -> dict | list:
    """Parse JSON responses, including markdown code fences."""

    cleaned = (text or "").strip()

    cleaned = re.sub(
        r"^```(?:json)?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Attempt to extract a JSON object from surrounding text.
        start = cleaned.find("{")
        end = cleaned.rfind("}")

        if start != -1 and end > start:
            return json.loads(cleaned[start:end + 1])

        raise


def _invoke_llm(system: str, user: str) -> str:
    """
    Invoke Groq once.

    Do not retry oversized requests or token rate-limit failures.
    """

    model = model_initialization()

    estimated_tokens = (
        _estimate_tokens(system)
        + _estimate_tokens(user)
    )

    logger.info(
        "LLM request estimated input size: %d tokens",
        estimated_tokens,
    )

    try:
        response = model.invoke([
            SystemMessage(content=system),
            HumanMessage(content=user),
        ])

        content = response.content

        if isinstance(content, str):
            return content

        # Handle models returning structured content blocks.
        if isinstance(content, list):
            return "".join(
                item.get("text", "")
                for item in content
                if isinstance(item, dict)
            )

        return str(content)

    except Exception as exc:
        error_message = str(exc).lower()

        if (
            "413" in error_message
            or "request too large" in error_message
            or "rate_limit_exceeded" in error_message
            or "tokens per minute" in error_message
        ):
            logger.error(
                "Groq token limit exceeded. "
                "Estimated input: %d tokens. Error: %s",
                estimated_tokens,
                exc,
            )

        else:
            logger.exception("Groq LLM request failed.")

        raise


# ============================================================
# STAGE 1: FINAL REPOSITORY SYNTHESIS
# ============================================================

def synthesize_explanation(
    metadata: dict,
    file_tree: str,
    languages: dict[str, int],
    readme: str = "",
    contributors: list[dict] | None = None,
    commits: list[dict] | None = None,
) -> dict:

    system = """
You are an expert software engineer explaining GitHub repositories.

Explain the repository to a developer seeing it for the first time.

Rules:
- Only use the provided repository information.
- Never invent filenames, folders, technologies or functionality.
- Explain architecture clearly.
- Keep the response concise but useful.
- Return valid JSON only.
"""

    # Compact repository metadata.
    lang_text = ", ".join(
        f"{name} ({size:,} bytes)"
        for name, size in sorted(
            (languages or {}).items(),
            key=lambda item: item[1],
            reverse=True,
        )[:10]
    )

    # Filter the file tree.
    filtered_tree = _filter_file_tree(file_tree)

    # Limit README.
    readme = _limit_text(readme, MAX_README_CHARS)

    # Limit contributors.
    contributor_lines = []

    for contributor in (contributors or [])[:5]:
        contributor_lines.append(
            f"{contributor.get('login', 'Unknown')} "
            f"({contributor.get('contributions', 0)} commits)"
        )

    contributors_text = ", ".join(contributor_lines)

    # Limit recent commits.
    commit_lines = []

    for commit in (commits or [])[:5]:
        author = str(commit.get("author", "Unknown"))[:60]
        message = str(commit.get("message", ""))[:100]
        date = str(commit.get("date", ""))[:10]

        commit_lines.append(
            f"- {author}: {message} ({date})"
        )

    commits_text = "\n".join(commit_lines)

    # Construct repository context.
    context = f"""
Repository: {metadata.get('full_name', 'Unknown')}

Description: {metadata.get('description', 'N/A')}

Stars: {metadata.get('stargazers_count', 0)}
Forks: {metadata.get('forks_count', 0)}

License: {metadata.get('license', 'None')}

Languages: {lang_text}

Topics: {', '.join((metadata.get('topics') or [])[:10])}

README:
{readme}

Top Contributors:
{contributors_text}

Recent Commits:
{commits_text}

Important Repository Files:
{filtered_tree}
"""

    # Additional safety limit for the entire context.
    context = _limit_text(
        context,
        MAX_TOTAL_CONTEXT_CHARS,
    )

    user = f"""
Analyze this GitHub repository.

{context}

Return EXACTLY this JSON structure:

{{
    "what_it_does": "2-3 sentences explaining the project",
    "tech_stack": ["technology1", "technology2"],
    "architecture": "Explain the project structure and data flow",
    "getting_started": "Explain installation and setup steps",
    "notable": "Testing, CI/CD, design patterns and interesting details"
}}

Return only valid JSON.
"""

    raw = _invoke_llm(system, user)

    try:
        result = _parse_json_response(raw)

        if isinstance(result, dict):

            if isinstance(result.get("tech_stack"), str):
                result["tech_stack"] = [
                    result["tech_stack"]
                ]

            # Ensure the expected response structure.
            defaults = {
                "what_it_does": "",
                "tech_stack": [],
                "architecture": "",
                "getting_started": "",
                "notable": "",
            }

            for key, default in defaults.items():
                if key not in result:
                    result[key] = default

            return result

    except (json.JSONDecodeError, ValueError) as exc:
        logger.error(
            "Could not parse synthesis response: %s",
            exc,
        )

    return {
        "what_it_does": (
            raw[:500] if raw else
            "Unable to generate repository explanation."
        ),
        "tech_stack": [
            metadata.get("language", "Unknown")
        ],
        "architecture": "Unable to parse structured AI response.",
        "getting_started": "Please refer to the repository README.",
        "notable": "",
    }


# ============================================================
# STAGE 2: FOLLOW-UP FETCH DECISION
# ============================================================

_ENDPOINT_DESCRIPTIONS = {
    "issues": "List open issues",
    "pull_requests": "List open pull requests",
    "releases": "List repository releases",
    "file_content": "Read a specific file using path",
    "issue_detail": "Read a specific issue using number",
}


def decide_followup_fetch(
    question: str,
    repo_summary: str,
    qa_history: list[dict] | None = None,
) -> dict | None:

    system = """
You are a GitHub repository research assistant.

Decide whether additional GitHub data is required to answer
the user's question.

Request additional data only when necessary.

Return valid JSON only.
"""

    history_text = ""

    if qa_history:
        for entry in qa_history[-3:]:
            history_text += (
                f"\nQ: {str(entry.get('question', ''))[:200]}"
                f"\nA: {str(entry.get('answer', ''))[:250]}\n"
            )

    endpoints_desc = "\n".join(
        f'"{key}": {value}'
        for key, value in _ENDPOINT_DESCRIPTIONS.items()
    )

    compact_summary = _limit_text(
        repo_summary,
        MAX_FOLLOWUP_CONTEXT_CHARS,
    )

    user = f"""
Repository context:
{compact_summary}

Previous Q&A:
{history_text}

New question:
{question[:1000]}

Available endpoints:
{endpoints_desc}

If no additional data is required:
{{"endpoint": null}}

If additional data is required:
{{"endpoint": "file_content", "params": {{"path": "src/file.py"}}}}

Request only one endpoint at a time.

Return only valid JSON.
"""

    raw = _invoke_llm(system, user)

    try:
        result = _parse_json_response(raw)

        if not isinstance(result, dict):
            return None

        endpoint = result.get("endpoint")

        if endpoint in (None, "null"):
            return None

        if endpoint not in _ENDPOINT_DESCRIPTIONS:
            logger.warning(
                "Unknown endpoint requested: %s",
                endpoint,
            )
            return None

        return {
            "endpoint": endpoint,
            "params": result.get("params") or {},
        }

    except (json.JSONDecodeError, ValueError) as exc:
        logger.warning(
            "Follow-up decision JSON parsing failed: %s",
            exc,
        )

        return None


# ============================================================
# STAGE 3: FOLLOW-UP ANSWER GENERATION
# ============================================================

def generate_followup_answer(
    question: str,
    repo_summary: str,
    extra_data: str = "",
    qa_history: list[dict] | None = None,
) -> str:

    system = """
You are a helpful GitHub repository assistant.

Answer clearly and concisely.

Use only the repository context and additional data provided.
Do not invent facts.
"""

    history_text = ""

    if qa_history:
        for entry in qa_history[-3:]:
            history_text += (
                f"\nQ: {str(entry.get('question', ''))[:200]}"
                f"\nA: {str(entry.get('answer', ''))[:250]}\n"
            )

    compact_summary = _limit_text(
        repo_summary,
        MAX_FOLLOWUP_CONTEXT_CHARS,
    )

    compact_extra = _limit_text(
        extra_data,
        MAX_EXTRA_DATA_CHARS,
    )

    user = f"""
Repository context:
{compact_summary}

Previous Q&A:
{history_text}

Additional GitHub data:
{compact_extra}

Question:
{question[:1000]}

Provide a clear, specific answer.
"""

    return _invoke_llm(system, user)
