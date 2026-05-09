import os
import json
import hashlib
import time
import httpx
import warnings
from duckduckgo_search import DDGS

# Suppress the "package renamed to ddgs" warning (must be aggressive for bg threads)
warnings.filterwarnings("ignore", category=RuntimeWarning)
warnings.filterwarnings("ignore", message=".*renamed.*ddgs.*")

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

JINA_BASE = "https://r.jina.ai/"

# Default cache expiry: 24 hours
DEFAULT_MAX_AGE_HOURS = 24


def _cache_key(query: str) -> str:
    return hashlib.md5(query.encode()).hexdigest()


def _load_cache(key: str, max_age_hours: float = DEFAULT_MAX_AGE_HOURS) -> dict | None:
    """Load cached result if it exists and is not expired.
    Returns None if cache miss, expired, or contains empty results."""
    path = os.path.join(CACHE_DIR, f"{key}.json")
    if not os.path.exists(path):
        return None

    try:
        with open(path, "r") as f:
            data = json.load(f)
    except (json.JSONDecodeError, IOError):
        return None

    # Check timestamp-based expiry
    cached_at = data.get("_cached_at", 0)
    if cached_at > 0:
        age_hours = (time.time() - cached_at) / 3600
        if age_hours > max_age_hours:
            print(f"[Cache] Expired ({age_hours:.1f}h > {max_age_hours}h), refetching")
            return None

    # Skip cache if results are empty (stale poison)
    if "results" in data and len(data.get("results", [])) == 0:
        print(f"[Cache] Skipping empty cached results for {key}")
        return None

    if "content" in data and len(data.get("content", "")) == 0:
        return None

    return data


def _save_cache(key: str, data: dict):
    """Save result to cache with timestamp."""
    data["_cached_at"] = time.time()
    path = os.path.join(CACHE_DIR, f"{key}.json")
    with open(path, "w") as f:
        json.dump(data, f)


def duckduckgo_search(query: str, max_results: int = 5, force_fresh: bool = False) -> list[dict]:
    """
    Search DuckDuckGo for free. Returns list of {title, href, body} dicts.
    Results cached to disk by MD5 hash of query.
    """
    key = _cache_key(query)

    if not force_fresh:
        cached = _load_cache(key)
        if cached:
            return cached.get("results", [])

    results = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append({
                    "title": r.get("title", ""),
                    "href": r.get("href", ""),
                    "body": r.get("body", ""),
                })
        print(f"[DDG] '{query}' -> {len(results)} results")
    except Exception as e:
        print(f"[DDG] Search failed for '{query}': {e}")

    # Only cache if we got results (don't poison the cache with empties)
    if results:
        _save_cache(key, {"results": results})
    else:
        print(f"[DDG] WARNING: No results for '{query}' -- not caching")

    return results


def jina_scrape(url: str, force_fresh: bool = False) -> str:
    """
    Deep-scrape a URL using Jina AI Reader.
    Fetches https://r.jina.ai/<url> which returns full page as clean markdown.
    Free, no API key required.
    Only used on the top result — rest use DDG snippets (shallow but fast).
    """
    key = _cache_key(f"jina:{url}")

    if not force_fresh:
        cached = _load_cache(key)
        if cached:
            return cached.get("content", "")

    try:
        resp = httpx.get(
            f"{JINA_BASE}{url}",
            headers={"Accept": "text/plain"},
            timeout=20.0,
            follow_redirects=True,
        )
        content = resp.text[:8000]  # Prune to 8k chars to save tokens
        if content:
            _save_cache(key, {"content": content})
        print(f"[Jina] Scraped {url} -> {len(content)} chars")
        return content
    except Exception as e:
        print(f"[Jina] Scrape failed for {url}: {e}")
        return ""


def search_with_deep_scrape(query: str, max_results: int = 4, force_fresh: bool = False) -> dict:
    """
    Full pipeline:
    1. DuckDuckGo search (all results get snippets)
    2. Top result gets Jina deep scrape
    3. Returns combined evidence dict
    """
    results = duckduckgo_search(query, max_results=max_results, force_fresh=force_fresh)

    deep_content = ""
    if results:
        top_url = results[0].get("href", "")
        if top_url:
            deep_content = jina_scrape(top_url, force_fresh=force_fresh)

    snippets = "\n\n".join(
        f"Source: {r['href']}\n{r['body']}" for r in results
    )

    return {
        "query": query,
        "snippets": snippets,
        "deep_content": deep_content,
        "sources": [r["href"] for r in results],
    }
