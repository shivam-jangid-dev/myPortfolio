"""
GitHub API client for the Repo Explainer.

Provides async helpers to fetch repo metadata, file trees, and file contents
from the GitHub REST API.  Uses an optional GITHUB_TOKEN for higher rate limits
(60 → 5,000 req/hr).
"""

import os
import re
import base64
import asyncio
import logging
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

_GITHUB_API = "https://api.github.com"
_GITHUB_TOKEN: Optional[str] = os.getenv("GITHUB_TOKEN")

# Max characters per file sent to the LLM.
MAX_FILE_CHARS = 2_000

# Extensions we never want to fetch (binary / non-informative).
_BINARY_EXTENSIONS = frozenset({
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg", ".webp",
    ".mp3", ".mp4", ".wav", ".avi", ".mov", ".mkv",
    ".zip", ".tar", ".gz", ".rar", ".7z",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".lock", ".min.js", ".min.css",
    ".pyc", ".pyo", ".class", ".o", ".so", ".dll", ".exe",
    ".db", ".sqlite", ".sqlite3",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
})

# ── URL parsing ────────────────────────────────────────────────────────────────

_GITHUB_URL_RE = re.compile(
    r"^https?://github\.com/(?P<owner>[^/]+)/(?P<repo>[^/]+?)(?:\.git)?/?$"
)


def parse_github_url(url: str) -> tuple[str, str]:
    """
    Extract (owner, repo) from a GitHub URL.
    Raises ValueError if the URL doesn't match expected patterns.
    """
    m = _GITHUB_URL_RE.match(url.strip())
    if not m:
        raise ValueError(
            "Invalid GitHub URL. Expected format: https://github.com/owner/repo"
        )
    return m.group("owner"), m.group("repo")


# ── HTTP helpers ───────────────────────────────────────────────────────────────

def _headers() -> dict[str, str]:
    """Build request headers, including auth token if available."""
    h: dict[str, str] = {"Accept": "application/vnd.github.v3+json"}
    if _GITHUB_TOKEN:
        h["Authorization"] = f"Bearer {_GITHUB_TOKEN}"
    return h


async def _get_json(client: httpx.AsyncClient, url: str) -> dict | list:
    """GET a GitHub API URL and return parsed JSON; raises on non-2xx."""
    resp = await client.get(url, headers=_headers())
    if resp.status_code == 404:
        raise ValueError("Repository not found — it may be private or misspelled.")
    if resp.status_code == 403 and "rate limit" in resp.text.lower():
        raise ValueError(
            "GitHub API rate limit reached. "
            "Try again later or configure a GITHUB_TOKEN on the server."
        )
    resp.raise_for_status()
    return resp.json()


# ── Public helpers ─────────────────────────────────────────────────────────────

async def fetch_repo_metadata(
    client: httpx.AsyncClient, owner: str, repo: str
) -> dict:
    """Fetch basic repo metadata (description, default branch, stars, etc.)."""
    data = await _get_json(client, f"{_GITHUB_API}/repos/{owner}/{repo}")
    return {
        "full_name": data.get("full_name", f"{owner}/{repo}"),
        "description": data.get("description") or "(no description)",
        "default_branch": data.get("default_branch", "main"),
        "language": data.get("language") or "Unknown",
        "stargazers_count": data.get("stargazers_count", 0),
        "forks_count": data.get("forks_count", 0),
        "topics": data.get("topics", []),
    }


async def fetch_repo_languages(
    client: httpx.AsyncClient, owner: str, repo: str
) -> dict[str, int]:
    """Fetch language breakdown (language → bytes)."""
    data = await _get_json(client, f"{_GITHUB_API}/repos/{owner}/{repo}/languages")
    return data  # type: ignore[return-value]


def _is_binary(path: str) -> bool:
    """Return True if the file path has a known binary extension."""
    lower = path.lower()
    return any(lower.endswith(ext) for ext in _BINARY_EXTENSIONS)


def _truncate_tree(tree_items: list[dict], max_items: int = 800) -> list[dict]:
    """
    For huge repos, truncate the tree to top-level + 2 levels deep.
    Returns the list sorted alphabetically.
    """
    if len(tree_items) <= max_items:
        return sorted(tree_items, key=lambda x: x.get("path", ""))

    filtered = [
        item for item in tree_items
        if item.get("path", "").count("/") <= 2
    ]
    return sorted(filtered[:max_items], key=lambda x: x.get("path", ""))


async def fetch_file_tree(
    client: httpx.AsyncClient, owner: str, repo: str, branch: str
) -> tuple[list[dict], bool]:
    """
    Fetch the recursive file tree for a repo branch.
    Returns (tree_items, was_truncated).
    Each item has 'path', 'type' ('blob' or 'tree'), and 'size'.
    """
    data = await _get_json(
        client,
        f"{_GITHUB_API}/repos/{owner}/{repo}/git/trees/{branch}?recursive=1",
    )
    raw_tree = data.get("tree", [])
    truncated = data.get("truncated", False) or len(raw_tree) > 800

    # Filter out binary files from the tree
    items = [
        {"path": item["path"], "type": item["type"], "size": item.get("size", 0)}
        for item in raw_tree
        if not _is_binary(item.get("path", ""))
    ]

    if truncated or len(items) > 800:
        items = _truncate_tree(items)
        truncated = True

    return items, truncated


async def fetch_file_content(
    client: httpx.AsyncClient, owner: str, repo: str, path: str
) -> str:
    """
    Fetch a single file's content (base64-decoded, truncated to MAX_FILE_CHARS).
    Returns empty string on error (binary file, too large, etc.).
    """
    try:
        data = await _get_json(
            client,
            f"{_GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
        )
        # GitHub returns base64 for files, but may return list for directories
        if isinstance(data, list):
            return ""

        encoding = data.get("encoding", "")
        content = data.get("content", "")

        if encoding == "base64" and content:
            decoded = base64.b64decode(content).decode("utf-8", errors="replace")
            return decoded[:MAX_FILE_CHARS]

        return ""
    except Exception as e:
        logger.warning("Failed to fetch %s: %s", path, e)
        return ""


async def fetch_files_parallel(
    client: httpx.AsyncClient, owner: str, repo: str, paths: list[str]
) -> dict[str, str]:
    """
    Fetch multiple files in parallel.
    Returns {path: content} for files that were successfully fetched.
    Filters out binary paths before fetching.
    """
    # Remove binary files
    clean_paths = [p for p in paths if not _is_binary(p)]

    tasks = [fetch_file_content(client, owner, repo, p) for p in clean_paths]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    contents: dict[str, str] = {}
    for path, result in zip(clean_paths, results):
        if isinstance(result, str) and result:
            contents[path] = result
        elif isinstance(result, Exception):
            logger.warning("Error fetching %s: %s", path, result)

    return contents


def format_tree_for_llm(tree_items: list[dict]) -> str:
    """
    Format the file tree into a readable string for the LLM prompt.
    Shows files and directories with indentation.
    """
    lines: list[str] = []
    for item in tree_items:
        path = item["path"]
        item_type = item["type"]
        size = item.get("size", 0)

        if item_type == "tree":
            lines.append(f"📁 {path}/")
        else:
            # Show size in KB for readability
            size_kb = size / 1024
            if size_kb >= 1:
                lines.append(f"   {path}  ({size_kb:.1f} KB)")
            else:
                lines.append(f"   {path}  ({size} B)")

    return "\n".join(lines)
