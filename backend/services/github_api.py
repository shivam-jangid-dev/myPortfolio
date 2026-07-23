"""
GitHub API client for the Repo Explainer.

Provides async helpers to fetch repo metadata, file trees, and file contents
from the GitHub REST API.  Uses an optional GITHUB_TOKEN for higher rate limits
(60 → 5,000 req/hr).

Two layers of data retrieval:
  Eager  — 6 endpoints always fetched in parallel on first analysis.
  On-demand — 5 endpoints fetched only when the LLM asks during follow-up Q&A.

A short-lived shared cache of raw GitHub responses avoids duplicate fetching
when multiple users analyse the same popular repo within minutes.
"""

import os
import re
import time
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

# ── On-demand endpoints (Phase 2) ─────────────────────────────────────────────
ON_DEMAND_ENDPOINTS = {
    "issues":        "https://api.github.com/repos/{owner}/{repo}/issues",
    "pull_requests": "https://api.github.com/repos/{owner}/{repo}/pulls",
    "releases":      "https://api.github.com/repos/{owner}/{repo}/releases",
    "file_content":  "https://api.github.com/repos/{owner}/{repo}/contents/{path}",
    "issue_detail":  "https://api.github.com/repos/{owner}/{repo}/issues/{number}",
}

# ── Shared repo cache ─────────────────────────────────────────────────────────
# Keyed by "owner/repo", stores raw eager-fetch results for reuse across
# sessions.  This is NOT per-user data — only raw GitHub API responses.
_repo_cache: dict[str, tuple[dict, float]] = {}
_REPO_CACHE_TTL = 600  # 10 minutes


def get_cached_repo(owner: str, repo: str) -> Optional[dict]:
    """Return cached eager-fetch results if still valid, else None."""
    key = f"{owner}/{repo}"
    entry = _repo_cache.get(key)
    if entry is None:
        return None
    data, ts = entry
    if time.time() - ts > _REPO_CACHE_TTL:
        _repo_cache.pop(key, None)
        return None
    return data


def set_repo_cache(owner: str, repo: str, data: dict) -> None:
    """Store eager-fetch results in the shared cache."""
    _repo_cache[f"{owner}/{repo}"] = (data, time.time())


def purge_expired_repo_cache() -> None:
    """Remove expired entries from the shared repo cache."""
    now = time.time()
    expired = [k for k, (_, ts) in _repo_cache.items() if now - ts > _REPO_CACHE_TTL]
    for k in expired:
        _repo_cache.pop(k, None)


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


# ── Eager-set fetchers (Phase 1 — always called) ──────────────────────────────

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
        "open_issues_count": data.get("open_issues_count", 0),
        "created_at": data.get("created_at", ""),
        "updated_at": data.get("updated_at", ""),
        "license": (data.get("license") or {}).get("spdx_id", "None"),
    }


async def fetch_repo_languages(
    client: httpx.AsyncClient, owner: str, repo: str
) -> dict[str, int]:
    """Fetch language breakdown (language → bytes)."""
    data = await _get_json(client, f"{_GITHUB_API}/repos/{owner}/{repo}/languages")
    return data  # type: ignore[return-value]


async def fetch_readme(
    client: httpx.AsyncClient, owner: str, repo: str
) -> str:
    """Fetch README.md content (base64-decoded, truncated). Returns '' on error."""
    try:
        data = await _get_json(
            client, f"{_GITHUB_API}/repos/{owner}/{repo}/contents/README.md"
        )
        if isinstance(data, list):
            return ""
        encoding = data.get("encoding", "")
        content = data.get("content", "")
        if encoding == "base64" and content:
            decoded = base64.b64decode(content).decode("utf-8", errors="replace")
            return decoded[:MAX_FILE_CHARS * 3]  # README gets a larger budget
        return ""
    except Exception as e:
        logger.warning("Failed to fetch README: %s", e)
        return ""


async def fetch_contributors(
    client: httpx.AsyncClient, owner: str, repo: str
) -> list[dict]:
    """Fetch top contributors (login + contributions count). Returns [] on error."""
    try:
        data = await _get_json(
            client, f"{_GITHUB_API}/repos/{owner}/{repo}/contributors"
        )
        if not isinstance(data, list):
            return []
        return [
            {"login": c.get("login", ""), "contributions": c.get("contributions", 0)}
            for c in data[:10]
        ]
    except Exception as e:
        logger.warning("Failed to fetch contributors: %s", e)
        return []


async def fetch_commits(
    client: httpx.AsyncClient, owner: str, repo: str
) -> list[dict]:
    """Fetch recent commits (message, author, date). Returns [] on error."""
    try:
        data = await _get_json(
            client, f"{_GITHUB_API}/repos/{owner}/{repo}/commits"
        )
        if not isinstance(data, list):
            return []
        commits = []
        for c in data[:10]:
            commit_data = c.get("commit", {})
            author = commit_data.get("author", {})
            commits.append({
                "message": (commit_data.get("message") or "")[:200],
                "author": author.get("name", "Unknown"),
                "date": author.get("date", ""),
            })
        return commits
    except Exception as e:
        logger.warning("Failed to fetch commits: %s", e)
        return []


def _is_binary(path: str) -> bool:
    """Return True if the file path has a known binary extension."""
    lower = path.lower()
    return any(lower.endswith(ext) for ext in _BINARY_EXTENSIONS)


def _truncate_tree(tree_items: list[dict], max_items: int = 400) -> list[dict]:
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
    try:
        data = await _get_json(
            client,
            f"{_GITHUB_API}/repos/{owner}/{repo}/git/trees/{branch}?recursive=1",
        )
    except (httpx.TimeoutException, httpx.HTTPStatusError) as e:
        logger.warning("Recursive tree fetch failed for %s/%s: %s. Falling back to root tree.", owner, repo, e)
        data = await _get_json(
            client,
            f"{_GITHUB_API}/repos/{owner}/{repo}/git/trees/{branch}",
        )

    raw_tree = data.get("tree", [])
    truncated = data.get("truncated", False) or len(raw_tree) > 400

    # Filter out binary files from the tree
    items = [
        {"path": item["path"], "type": item["type"], "size": item.get("size", 0)}
        for item in raw_tree
        if not _is_binary(item.get("path", ""))
    ]

    if truncated or len(items) > 400:
        items = _truncate_tree(items)
        truncated = True

    return items, truncated


# ── Aggregate eager fetch ──────────────────────────────────────────────────────

async def fetch_all_eager(
    client: httpx.AsyncClient, owner: str, repo: str
) -> dict:
    """
    Fetch all 6 eager-set endpoints in parallel.
    Returns a dict with keys: metadata, languages, tree_items, tree_truncated,
    readme, contributors, commits, tree_text.
    """
    # Metadata must come first because we need default_branch for the tree
    metadata = await fetch_repo_metadata(client, owner, repo)
    branch = metadata["default_branch"]

    # Now fire the remaining 5 in parallel
    languages_t, tree_t, readme_t, contributors_t, commits_t = await asyncio.gather(
        fetch_repo_languages(client, owner, repo),
        fetch_file_tree(client, owner, repo, branch),
        fetch_readme(client, owner, repo),
        fetch_contributors(client, owner, repo),
        fetch_commits(client, owner, repo),
    )

    tree_items, tree_truncated = tree_t
    tree_text = format_tree_for_llm(tree_items)
    if tree_truncated:
        tree_text = (
            "NOTE: This is a large repository. The tree below is truncated "
            "to the top 2 directory levels.\n\n" + tree_text
        )

    return {
        "metadata": metadata,
        "languages": languages_t,
        "tree_items": tree_items,
        "tree_truncated": tree_truncated,
        "tree_text": tree_text,
        "readme": readme_t,
        "contributors": contributors_t,
        "commits": commits_t,
    }


# ── File content helpers ──────────────────────────────────────────────────────

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


# ── On-demand fetcher (Phase 2) ───────────────────────────────────────────────

async def fetch_on_demand(
    client: httpx.AsyncClient,
    owner: str,
    repo: str,
    endpoint_key: str,
    params: Optional[dict] = None,
) -> str:
    """
    Fetch a single on-demand endpoint by key.
    Returns a formatted string suitable for inclusion in an LLM prompt.
    Returns an error message string on failure (never raises).
    """
    if endpoint_key not in ON_DEMAND_ENDPOINTS:
        return f"Unknown endpoint: {endpoint_key}"

    params = params or {}
    url_template = ON_DEMAND_ENDPOINTS[endpoint_key]

    try:
        url = url_template.format(owner=owner, repo=repo, **params)
    except KeyError as e:
        return f"Missing required parameter for {endpoint_key}: {e}"

    try:
        data = await _get_json(client, url)
    except Exception as e:
        return f"Failed to fetch {endpoint_key}: {e}"

    # Format the response based on the endpoint type
    return _format_on_demand(endpoint_key, data)


def _format_on_demand(endpoint_key: str, data: dict | list) -> str:
    """Format raw GitHub API response into LLM-readable text."""
    if endpoint_key == "issues":
        if not isinstance(data, list) or not data:
            return "No open issues found."
        lines = [f"Open issues ({len(data)} shown):"]
        for issue in data[:15]:
            labels = ", ".join(l.get("name", "") for l in issue.get("labels", []))
            label_str = f" [{labels}]" if labels else ""
            lines.append(
                f"  #{issue.get('number', '?')}: {issue.get('title', 'Untitled')}"
                f"{label_str} — {issue.get('state', 'open')}"
            )
        return "\n".join(lines)

    if endpoint_key == "pull_requests":
        if not isinstance(data, list) or not data:
            return "No open pull requests found."
        lines = [f"Open pull requests ({len(data)} shown):"]
        for pr in data[:15]:
            lines.append(
                f"  #{pr.get('number', '?')}: {pr.get('title', 'Untitled')}"
                f" — by {pr.get('user', {}).get('login', 'unknown')}"
            )
        return "\n".join(lines)

    if endpoint_key == "releases":
        if not isinstance(data, list) or not data:
            return "No releases found."
        lines = [f"Releases ({min(len(data), 10)} shown):"]
        for rel in data[:10]:
            lines.append(
                f"  {rel.get('tag_name', '?')}: {rel.get('name', 'Untitled')}"
                f" — {rel.get('published_at', 'unknown date')}"
            )
        return "\n".join(lines)

    if endpoint_key == "file_content":
        if isinstance(data, list):
            # It's a directory listing
            lines = ["Directory contents:"]
            for item in data[:30]:
                lines.append(f"  {item.get('type', '?')}: {item.get('name', '?')}")
            return "\n".join(lines)
        encoding = data.get("encoding", "")
        content = data.get("content", "")
        if encoding == "base64" and content:
            decoded = base64.b64decode(content).decode("utf-8", errors="replace")
            return decoded[:MAX_FILE_CHARS]
        return "Unable to decode file content."

    if endpoint_key == "issue_detail":
        title = data.get("title", "Untitled")
        body = (data.get("body") or "No description.")[:1500]
        state = data.get("state", "unknown")
        user = data.get("user", {}).get("login", "unknown")
        labels = ", ".join(l.get("name", "") for l in data.get("labels", []))
        return (
            f"Issue #{data.get('number', '?')}: {title}\n"
            f"State: {state} | Author: {user} | Labels: {labels or 'none'}\n\n"
            f"{body}"
        )

    # Fallback: dump a truncated JSON representation
    import json
    return json.dumps(data, indent=2, default=str)[:3000]


# ── Tree formatting ───────────────────────────────────────────────────────────

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
