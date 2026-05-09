# AlumNetwork — Backend Implementation

> Full backend specification and implementation guide.
> Stack: FastAPI · SQLite · DuckDuckGo Search · Jina AI Reader · AICredits LLM API · Python 3.12

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Environment Setup](#environment-setup)
4. [requirements.txt](#requirementstxt)
5. [Database Schema](#database-schema)
6. [database.py](#databasepy)
7. [models.py](#modelspy)
8. [LLM Client](#llm-client--servicesllm_clientpy)
9. [Web Scraper](#web-scraper--servicesscraper-strategy)
10. [Startup Radar Service](#startup-radar-service--servicesstartup_radarpy)
11. [Agents](#agents)
    - [Project Generator](#1-project-generator--agentsproject_generatorpy)
    - [Cold Email Forge](#2-cold-email-forge--agentsemail_forgepy)
    - [Path Tracer](#3-path-tracer--agentspath_tracerpy)
    - [Skill Bridge](#4-skill-bridge--agentsskill_bridgepy)
12. [main.py — FastAPI Routes](#mainpy--fastapi-routes)
13. [API Reference](#api-reference)
14. [Running the Server](#running-the-server)

---

## Architecture Overview

```
Browser (React Frontend)
         │
         │  REST API (JSON)
         ▼
FastAPI Server (:8000)
         │
         ├── SQLite (session + alumni + startup persistence)
         │
         ├── services/
         │     ├── llm_client.py      ← AICredits API (Llama 3 8B)
         │     ├── scraper.py         ← DuckDuckGo Search + Jina AI Reader
         │     ├── startup_radar.py   ← Aggregates startups from DDG + Jina
         │     └── cache.py           ← MD5 disk cache for search results
         │
         └── agents/
               ├── project_generator.py  ← Build to Apply
               ├── email_forge.py        ← Cold Email Forge
               ├── path_tracer.py        ← Copy Their Path
               └── skill_bridge.py       ← On-Campus vs Off-Campus
```

### Key design principles borrowed from BluffBuster

1. **Free web scraping pipeline** — DuckDuckGo Search (no API key needed) for discovery, Jina AI Reader (`r.jina.ai/<url>`) for full-page markdown extraction. Zero cost.
2. **MD5 disk cache** — all search results are cached by query hash to avoid redundant scrapes across requests.
3. **Batch LLM calls** — instead of one LLM call per item, all items are sent in a single mega-prompt with `[ID: X]` tags for deterministic mapping.
4. **Provider-agnostic LLM client** — any OpenAI-compatible API works by swapping `.env` values.
5. **Multi-strategy JSON parsing** — direct parse → markdown block extraction → brace matching → bracket matching, with fallbacks at every step.

---

## Project Structure

```
alumnetwork/
├── backend/
│   ├── main.py                   # FastAPI app, all routes, CORS
│   ├── database.py               # SQLite init, all DB helpers
│   ├── models.py                 # Pydantic request/response models
│   ├── constants.py              # Seed mock data for prototype demo
│   ├── .env                      # Environment variables
│   ├── requirements.txt
│   │
│   ├── services/
│   │   ├── llm_client.py         # LLM wrapper with retry + JSON fallback
│   │   ├── scraper.py            # DuckDuckGo + Jina AI scraping pipeline
│   │   ├── startup_radar.py      # Startup aggregation from web
│   │   └── cache.py              # MD5 disk-based search result cache
│   │
│   └── agents/
│       ├── project_generator.py  # Build to Apply — project brief + prompt
│       ├── email_forge.py        # Cold Email Forge — email generation
│       ├── path_tracer.py        # Copy Their Path — compatibility scoring
│       └── skill_bridge.py       # Skill Bridge — on vs off campus analysis
│
├── cache/                        # Auto-created, stores .json search caches
└── uploads/                      # Temporary file storage if needed
```

---

## Environment Setup

```env
# backend/.env

LLM_API_KEY=sk-live-02a2d375f09d2f74770fdf6c8efb3cb8c8472de52a7002d69bfdbdf716826007
LLM_BASE_URL=https://api.aicredits.in/v1
LLM_MODEL=meta-llama/llama-3-8b-instruct
EMBEDDING_MODEL=all-MiniLM-L6-v2
SQLITE_DB=backend/alumnetwork.db
```

---

## requirements.txt

```txt
fastapi==0.104.1
uvicorn==0.24.0
python-dotenv==1.0.0
httpx==0.27.0
duckduckgo-search==6.2.3
pydantic==2.5.0
aiofiles==23.2.1
python-multipart==0.0.9
```

---

## Database Schema

```sql
-- Alumni profiles
CREATE TABLE IF NOT EXISTS alumni (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    batch_year      INTEGER,
    domain          TEXT,
    company         TEXT,
    role            TEXT,
    location        TEXT,
    skills          TEXT,   -- JSON array
    open_to_refer   INTEGER DEFAULT 0,
    linkedin_url    TEXT,
    verified        INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Student profiles
CREATE TABLE IF NOT EXISTS students (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    branch          TEXT,
    current_year    INTEGER,
    cgpa            REAL,
    skills          TEXT,   -- JSON array
    target_domain   TEXT,
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Mentorship requests
CREATE TABLE IF NOT EXISTS mentor_requests (
    id              TEXT PRIMARY KEY,
    student_id      TEXT NOT NULL REFERENCES students(id),
    alumni_id       TEXT NOT NULL REFERENCES alumni(id),
    message         TEXT,
    status          TEXT DEFAULT 'pending',  -- pending | accepted | declined
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Events
CREATE TABLE IF NOT EXISTS events (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    event_type      TEXT,   -- talk | webinar | reunion | hackathon
    description     TEXT,
    date            TEXT,
    alumni_speaker  TEXT,
    rsvp_count      INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Startups (populated by Startup Radar scraper + manual entries)
CREATE TABLE IF NOT EXISTS startups (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    domain          TEXT,
    stage           TEXT,   -- pre-seed | seed | series-a
    description     TEXT,
    tech_stack      TEXT,   -- JSON array
    location        TEXT,
    source_url      TEXT,
    alumni_ids      TEXT,   -- JSON array of connected alumni IDs
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Build to Apply projects
CREATE TABLE IF NOT EXISTS projects (
    id              TEXT PRIMARY KEY,
    student_id      TEXT NOT NULL,
    startup_id      TEXT NOT NULL,
    project_title   TEXT,
    project_brief   TEXT,
    tech_stack      TEXT,   -- JSON array
    readme_template TEXT,
    validator_id    TEXT,   -- alumni who validated
    status          TEXT DEFAULT 'draft',  -- draft | submitted | validated
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Cold emails
CREATE TABLE IF NOT EXISTS cold_emails (
    id              TEXT PRIMARY KEY,
    student_id      TEXT NOT NULL,
    startup_id      TEXT NOT NULL,
    project_id      TEXT,
    subject         TEXT,
    body            TEXT,
    tone            TEXT DEFAULT 'conversational',
    validator_name  TEXT,
    validator_company TEXT,
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Path traces (Copy Their Path)
CREATE TABLE IF NOT EXISTS path_traces (
    id              TEXT PRIMARY KEY,
    student_id      TEXT NOT NULL,
    alumni_id       TEXT NOT NULL,
    compatibility   REAL,
    suggested_startups TEXT,  -- JSON array
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Skill bridge analyses
CREATE TABLE IF NOT EXISTS skill_bridge_analyses (
    id              TEXT PRIMARY KEY,
    student_id      TEXT NOT NULL,
    company         TEXT NOT NULL,
    on_campus_data  TEXT,   -- JSON
    off_campus_data TEXT,   -- JSON
    recommendation  TEXT,
    probability     REAL,
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## database.py

```python
import sqlite3
import os
import json
from dotenv import load_dotenv

load_dotenv()
DB_PATH = os.getenv("SQLITE_DB", "backend/alumnetwork.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS alumni (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            batch_year INTEGER,
            domain TEXT,
            company TEXT,
            role TEXT,
            location TEXT,
            skills TEXT,
            open_to_refer INTEGER DEFAULT 0,
            linkedin_url TEXT,
            verified INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            branch TEXT,
            current_year INTEGER,
            cgpa REAL,
            skills TEXT,
            target_domain TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS mentor_requests (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            alumni_id TEXT NOT NULL,
            message TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            event_type TEXT,
            description TEXT,
            date TEXT,
            alumni_speaker TEXT,
            rsvp_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS startups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            domain TEXT,
            stage TEXT,
            description TEXT,
            tech_stack TEXT,
            location TEXT,
            source_url TEXT,
            alumni_ids TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            startup_id TEXT NOT NULL,
            project_title TEXT,
            project_brief TEXT,
            tech_stack TEXT,
            readme_template TEXT,
            validator_id TEXT,
            status TEXT DEFAULT 'draft',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS cold_emails (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            startup_id TEXT NOT NULL,
            project_id TEXT,
            subject TEXT,
            body TEXT,
            tone TEXT DEFAULT 'conversational',
            validator_name TEXT,
            validator_company TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS path_traces (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            alumni_id TEXT NOT NULL,
            compatibility REAL,
            suggested_startups TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS skill_bridge_analyses (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            company TEXT NOT NULL,
            on_campus_data TEXT,
            off_campus_data TEXT,
            recommendation TEXT,
            probability REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()


# --- Alumni helpers ---

def get_all_alumni(domain=None, company=None, open_to_refer=None):
    conn = get_connection()
    query = "SELECT * FROM alumni WHERE 1=1"
    params = []
    if domain:
        query += " AND domain LIKE ?"
        params.append(f"%{domain}%")
    if company:
        query += " AND company LIKE ?"
        params.append(f"%{company}%")
    if open_to_refer:
        query += " AND open_to_refer = 1"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_alumni_by_id(alumni_id: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM alumni WHERE id = ?", (alumni_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_alumni_by_domain(domain: str):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM alumni WHERE domain LIKE ?", (f"%{domain}%",)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# --- Startup helpers ---

def get_all_startups(domain=None, stage=None):
    conn = get_connection()
    query = "SELECT * FROM startups WHERE 1=1"
    params = []
    if domain:
        query += " AND domain LIKE ?"
        params.append(f"%{domain}%")
    if stage:
        query += " AND stage = ?"
        params.append(stage)
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_startup_by_id(startup_id: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM startups WHERE id = ?", (startup_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def insert_startup(startup: dict):
    conn = get_connection()
    conn.execute("""
        INSERT OR REPLACE INTO startups
        (id, name, domain, stage, description, tech_stack, location, source_url, alumni_ids)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        startup["id"], startup["name"], startup.get("domain"),
        startup.get("stage"), startup.get("description"),
        json.dumps(startup.get("tech_stack", [])),
        startup.get("location"), startup.get("source_url"),
        json.dumps(startup.get("alumni_ids", []))
    ))
    conn.commit()
    conn.close()


# --- Project helpers ---

def insert_project(project: dict):
    conn = get_connection()
    conn.execute("""
        INSERT INTO projects
        (id, student_id, startup_id, project_title, project_brief, tech_stack, readme_template, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        project["id"], project["student_id"], project["startup_id"],
        project["project_title"], project["project_brief"],
        json.dumps(project.get("tech_stack", [])),
        project.get("readme_template"), "draft"
    ))
    conn.commit()
    conn.close()


def update_project_validator(project_id: str, validator_id: str):
    conn = get_connection()
    conn.execute(
        "UPDATE projects SET validator_id = ?, status = 'validated' WHERE id = ?",
        (validator_id, project_id)
    )
    conn.commit()
    conn.close()


# --- Cold email helpers ---

def insert_cold_email(email: dict):
    conn = get_connection()
    conn.execute("""
        INSERT INTO cold_emails
        (id, student_id, startup_id, project_id, subject, body, tone, validator_name, validator_company)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        email["id"], email["student_id"], email["startup_id"],
        email.get("project_id"), email["subject"], email["body"],
        email.get("tone", "conversational"),
        email.get("validator_name"), email.get("validator_company")
    ))
    conn.commit()
    conn.close()


# --- Skill bridge helpers ---

def insert_skill_bridge(analysis: dict):
    conn = get_connection()
    conn.execute("""
        INSERT INTO skill_bridge_analyses
        (id, student_id, company, on_campus_data, off_campus_data, recommendation, probability)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        analysis["id"], analysis["student_id"], analysis["company"],
        json.dumps(analysis.get("on_campus_data", {})),
        json.dumps(analysis.get("off_campus_data", {})),
        analysis.get("recommendation"),
        analysis.get("probability")
    ))
    conn.commit()
    conn.close()
```

---

## models.py

```python
from pydantic import BaseModel
from typing import Optional


class MentorRequestBody(BaseModel):
    student_id: str
    alumni_id: str
    message: Optional[str] = None


class ProjectGenerateBody(BaseModel):
    student_id: str
    startup_id: str


class EmailForgeBody(BaseModel):
    student_id: str
    startup_id: str
    project_id: Optional[str] = None
    tone: Optional[str] = "conversational"  # formal | conversational | bold


class PathTraceBody(BaseModel):
    student_id: str
    alumni_id: str


class SkillBridgeBody(BaseModel):
    student_id: str
    company: str


class ValidatorRequestBody(BaseModel):
    project_id: str
    alumni_id: str
```

---

## LLM Client — `services/llm_client.py`

Borrowed directly from BluffBuster's battle-tested implementation. Provider-agnostic, with exponential backoff on 429s, JSON-mode with graceful fallback, and multi-strategy JSON parsing.

```python
import os
import json
import time
import re
import httpx
from dotenv import load_dotenv

load_dotenv()

LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.aicredits.in/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "meta-llama/llama-3-8b-instruct")

MAX_RETRIES = 8
BASE_DELAY = 2.0


def call_llm(
    system_prompt: str,
    user_prompt: str,
    expect_json: bool = False,
    max_tokens: int = 2048,
    temperature: float = 0.3,
) -> str:
    """
    Call the LLM with exponential backoff and JSON-mode fallback.
    Returns raw string response.
    """
    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    if expect_json:
        payload["response_format"] = {"type": "json_object"}

    for attempt in range(MAX_RETRIES):
        try:
            response = httpx.post(
                f"{LLM_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60.0,
            )

            if response.status_code == 429:
                wait = BASE_DELAY * (2 ** attempt)
                print(f"[LLM] Rate limited. Waiting {wait}s (attempt {attempt + 1})")
                time.sleep(wait)
                continue

            if response.status_code == 400 and expect_json:
                # Provider doesn't support json_object mode — retry without it
                payload.pop("response_format", None)
                continue

            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

        except httpx.HTTPStatusError as e:
            if attempt == MAX_RETRIES - 1:
                raise
            time.sleep(BASE_DELAY * (2 ** attempt))
        except Exception as e:
            if attempt == MAX_RETRIES - 1:
                raise
            time.sleep(BASE_DELAY)

    raise RuntimeError("LLM call failed after all retries")


def parse_json_response(raw: str) -> dict | list:
    """
    Multi-strategy JSON parser — tries 4 strategies before raising.
    Strategy 1: Direct parse
    Strategy 2: Extract from markdown ```json blocks
    Strategy 3: Brace matching (find first { ... })
    Strategy 4: Bracket matching (find first [ ... ])
    """
    # Strategy 1: Direct
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Strategy 2: Markdown block
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Strategy 3: Brace match
    brace_match = re.search(r"\{[\s\S]*\}", raw)
    if brace_match:
        try:
            return json.loads(brace_match.group())
        except json.JSONDecodeError:
            pass

    # Strategy 4: Bracket match
    bracket_match = re.search(r"\[[\s\S]*\]", raw)
    if bracket_match:
        try:
            return json.loads(bracket_match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from LLM response:\n{raw[:500]}")
```

---

## Web Scraper — `services/scraper.py`

This is the core free scraping pipeline — identical strategy to BluffBuster's `web_search.py`. DuckDuckGo for search (no API key), Jina AI Reader (`r.jina.ai`) for full markdown extraction from the top result.

```python
import os
import json
import hashlib
import httpx
from duckduckgo_search import DDGS

CACHE_DIR = "cache"
os.makedirs(CACHE_DIR, exist_ok=True)

JINA_BASE = "https://r.jina.ai/"


def _cache_key(query: str) -> str:
    return hashlib.md5(query.encode()).hexdigest()


def _load_cache(key: str) -> dict | None:
    path = os.path.join(CACHE_DIR, f"{key}.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return None


def _save_cache(key: str, data: dict):
    path = os.path.join(CACHE_DIR, f"{key}.json")
    with open(path, "w") as f:
        json.dump(data, f)


def duckduckgo_search(query: str, max_results: int = 5) -> list[dict]:
    """
    Search DuckDuckGo for free. Returns list of {title, href, body} dicts.
    Results cached to disk by MD5 hash of query.
    """
    key = _cache_key(query)
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
    except Exception as e:
        print(f"[DDG] Search failed for '{query}': {e}")

    _save_cache(key, {"results": results})
    return results


def jina_scrape(url: str) -> str:
    """
    Deep-scrape a URL using Jina AI Reader.
    Fetches https://r.jina.ai/<url> which returns full page as clean markdown.
    Free, no API key required.
    Only used on the top result — rest use DDG snippets (shallow but fast).
    """
    key = _cache_key(f"jina:{url}")
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
        _save_cache(key, {"content": content})
        return content
    except Exception as e:
        print(f"[Jina] Scrape failed for {url}: {e}")
        return ""


def search_with_deep_scrape(query: str, max_results: int = 4) -> dict:
    """
    Full pipeline:
    1. DuckDuckGo search (all results get snippets)
    2. Top result gets Jina deep scrape
    3. Returns combined evidence dict
    """
    results = duckduckgo_search(query, max_results=max_results)

    deep_content = ""
    if results:
        top_url = results[0].get("href", "")
        if top_url:
            deep_content = jina_scrape(top_url)

    snippets = "\n\n".join(
        f"Source: {r['href']}\n{r['body']}" for r in results
    )

    return {
        "query": query,
        "snippets": snippets,
        "deep_content": deep_content,
        "sources": [r["href"] for r in results],
    }
```

---

## Startup Radar Service — `services/startup_radar.py`

Aggregates early-stage startups from the web for free using the same DuckDuckGo + Jina pipeline. Searches ProductHunt launches, YC batch announcements, and recent seed funding news by domain.

```python
import uuid
from services.scraper import search_with_deep_scrape
from services.llm_client import call_llm, parse_json_response
from database import insert_startup, get_all_startups

DOMAINS = ["healthtech", "fintech", "edtech", "climate", "b2b saas", "logistics"]

STAGES = ["pre-seed", "seed"]


def _build_search_queries(domain: str) -> list[str]:
    return [
        f"{domain} startup pre-seed seed funding 2024 2025",
        f"site:producthunt.com {domain} startup launched 2024",
        f"YC W25 S24 {domain} startup",
    ]


def scrape_startups_for_domain(domain: str) -> list[dict]:
    """
    For a given domain, run 3 DDG searches, deep scrape top result of first,
    then ask LLM to extract startup info as structured JSON.
    """
    all_evidence = ""
    for query in _build_search_queries(domain):
        evidence = search_with_deep_scrape(query, max_results=3)
        all_evidence += f"\n\n--- Query: {query} ---\n"
        all_evidence += evidence["snippets"]
        if evidence["deep_content"]:
            all_evidence += f"\n\nDeep page content:\n{evidence['deep_content'][:3000]}"

    system_prompt = """You are a startup data extractor. 
Given web search results, extract a list of early-stage startups.
Return ONLY a JSON array. Each item must have:
- name (string)
- domain (string)
- stage (string: pre-seed | seed | series-a)
- description (string, 1-2 sentences)
- tech_stack (array of strings)
- location (string)
- source_url (string)
If a field is unknown, use null. Return max 5 startups per domain."""

    user_prompt = f"""Domain: {domain}

Web Evidence:
{all_evidence[:6000]}

Extract up to 5 startups from this evidence as a JSON array."""

    try:
        raw = call_llm(system_prompt, user_prompt, expect_json=True, max_tokens=1500)
        startups = parse_json_response(raw)
        if isinstance(startups, dict) and "startups" in startups:
            startups = startups["startups"]
        if not isinstance(startups, list):
            return []
        return startups
    except Exception as e:
        print(f"[StartupRadar] LLM extraction failed for {domain}: {e}")
        return []


def refresh_startup_radar(domains: list[str] = None):
    """
    Scrape startups for each domain and upsert into DB.
    Called on server startup or via a manual refresh endpoint.
    """
    targets = domains or DOMAINS
    for domain in targets:
        print(f"[StartupRadar] Scraping domain: {domain}")
        startups = scrape_startups_for_domain(domain)
        for s in startups:
            if not s.get("name"):
                continue
            s["id"] = str(uuid.uuid5(uuid.NAMESPACE_DNS, s["name"].lower()))
            s["alumni_ids"] = []
            insert_startup(s)
        print(f"[StartupRadar] Inserted {len(startups)} startups for {domain}")


def get_startups_with_alumni_flags(domain=None, stage=None, alumni_list: list = None):
    """
    Fetch startups from DB and cross-reference with alumni companies
    to set the has_alumni_connection flag.
    """
    startups = get_all_startups(domain=domain, stage=stage)
    alumni_companies = set()
    if alumni_list:
        alumni_companies = {a["company"].lower() for a in alumni_list if a.get("company")}

    for s in startups:
        s["has_alumni_connection"] = (
            s.get("name", "").lower() in alumni_companies or
            any(aid in (s.get("alumni_ids") or []) for aid in [])
        )
    return startups
```

---

## Agents

---

### 1. Project Generator — `agents/project_generator.py`

Given a startup from the Radar, generates a tailored project brief using the startup's domain, description, and tech stack. Also surfaces domain-matched alumni validators from the DB.

```python
import uuid
from services.llm_client import call_llm, parse_json_response
from services.scraper import search_with_deep_scrape
from database import get_startup_by_id, get_alumni_by_domain, insert_project


def generate_project_brief(student_id: str, startup_id: str) -> dict:
    """
    Full Build to Apply pipeline:
    1. Fetch startup from DB
    2. Scrape additional context about the startup from the web
    3. LLM generates project brief tailored to that startup
    4. Fetch domain-matched alumni validators
    5. Store project in DB
    6. Return full package
    """

    # Step 1: Get startup
    startup = get_startup_by_id(startup_id)
    if not startup:
        raise ValueError(f"Startup {startup_id} not found")

    # Step 2: Web context about startup's problem space
    domain = startup.get("domain", "")
    evidence = search_with_deep_scrape(
        f"{startup['name']} {domain} problem solution product", max_results=3
    )
    web_context = evidence["snippets"][:2000]
    if evidence["deep_content"]:
        web_context += f"\n\nDeep content:\n{evidence['deep_content'][:1500]}"

    # Step 3: LLM generates project brief
    system_prompt = """You are a senior software engineer and career coach.
Given a startup's details, generate a specific, buildable project brief for a student
who wants to impress this startup with relevant proof of work.
Return JSON with:
- project_title (string)
- problem_statement (string, 2-3 sentences)
- what_to_build (string, detailed description)
- tech_stack (array of strings)
- key_features (array of strings, 3-5 features)
- why_this_impresses (string, why this project signals value to this startup)
- readme_template (string, a markdown README outline)
- estimated_hours (integer)"""

    user_prompt = f"""Startup: {startup['name']}
Domain: {domain}
Stage: {startup.get('stage', 'early-stage')}
Description: {startup.get('description', '')}

Web context about their space:
{web_context}

Generate a specific project brief a student can build in 1-2 weeks to impress this startup."""

    raw = call_llm(system_prompt, user_prompt, expect_json=True, max_tokens=2000)
    brief = parse_json_response(raw)

    # Step 4: Find domain-matched alumni validators
    validators = get_alumni_by_domain(domain)[:3]  # Top 3 matches

    # Step 5: Store project
    project_id = str(uuid.uuid4())
    project = {
        "id": project_id,
        "student_id": student_id,
        "startup_id": startup_id,
        "project_title": brief.get("project_title", ""),
        "project_brief": str(brief),
        "tech_stack": brief.get("tech_stack", []),
        "readme_template": brief.get("readme_template", ""),
    }
    insert_project(project)

    return {
        "project_id": project_id,
        "startup": startup,
        "brief": brief,
        "validators": validators,
    }
```

---

### 2. Cold Email Forge — `agents/email_forge.py`

Generates a hyper-personalized cold email using the student profile, startup info, project built, and alumni validator credibility. Scrapes recent news about the startup for a "why now" hook.

```python
import uuid
from services.llm_client import call_llm, parse_json_response
from services.scraper import search_with_deep_scrape
from database import (
    get_startup_by_id, get_alumni_by_id,
    insert_cold_email
)

TONES = {
    "formal": "Professional and polished. No contractions. Direct and respectful.",
    "conversational": "Warm, human, slightly casual. Like a smart person talking to a founder.",
    "bold": "Confident, punchy. Short sentences. Makes the founder feel they'd regret not replying.",
}


def forge_cold_email(
    student_id: str,
    startup_id: str,
    student_profile: dict,
    project_id: str = None,
    project_brief: dict = None,
    validator_id: str = None,
    tone: str = "conversational",
) -> dict:
    """
    Full Cold Email Forge pipeline:
    1. Fetch startup info
    2. Scrape recent news about startup for a 'why now' hook
    3. Fetch validator alumni info if provided
    4. LLM generates subject + body + 3 subject line variants
    5. Store in DB and return
    """

    # Step 1: Startup context
    startup = get_startup_by_id(startup_id)
    if not startup:
        raise ValueError(f"Startup {startup_id} not found")

    # Step 2: Recent news hook
    news = search_with_deep_scrape(
        f"{startup['name']} launch update funding news 2024 2025", max_results=2
    )
    recent_hook = news["snippets"][:1000]

    # Step 3: Validator info
    validator_name = None
    validator_company = None
    validator_context = ""
    if validator_id:
        validator = get_alumni_by_id(validator_id)
        if validator:
            validator_name = validator.get("name")
            validator_company = validator.get("company")
            validator_context = (
                f"The student's project was reviewed and endorsed by {validator_name}, "
                f"who works at {validator_company} in the {validator.get('domain', '')} space."
            )

    # Step 4: LLM generates email
    tone_instruction = TONES.get(tone, TONES["conversational"])

    system_prompt = f"""You are an expert cold email writer for students targeting startups.
Tone: {tone_instruction}
Write emails that are specific, not generic. Reference the startup's actual product.
Return JSON with:
- subject (string, the best subject line)
- body (string, the full email body)
- subject_variants (array of 2 alternative subject lines)
- why_this_works (string, 1 sentence explanation of the strategy)"""

    project_section = ""
    if project_brief:
        project_section = f"""
Project built for this startup:
Title: {project_brief.get('project_title', '')}
What it does: {project_brief.get('what_to_build', '')}
Tech stack: {', '.join(project_brief.get('tech_stack', []))}"""

    user_prompt = f"""Student: {student_profile.get('name', 'Student')}
Branch: {student_profile.get('branch', '')}
Skills: {', '.join(student_profile.get('skills', []))}
CGPA: {student_profile.get('cgpa', '')}

Target Startup: {startup['name']}
Domain: {startup.get('domain', '')}
Stage: {startup.get('stage', '')}
Description: {startup.get('description', '')}

Recent news / hook:
{recent_hook}
{project_section}

{validator_context}

Write a cold email from this student to the founder of {startup['name']}."""

    raw = call_llm(system_prompt, user_prompt, expect_json=True, max_tokens=1500)
    email_data = parse_json_response(raw)

    # Step 5: Store
    email_id = str(uuid.uuid4())
    insert_cold_email({
        "id": email_id,
        "student_id": student_id,
        "startup_id": startup_id,
        "project_id": project_id,
        "subject": email_data.get("subject", ""),
        "body": email_data.get("body", ""),
        "tone": tone,
        "validator_name": validator_name,
        "validator_company": validator_company,
    })

    return {
        "email_id": email_id,
        "subject": email_data.get("subject", ""),
        "body": email_data.get("body", ""),
        "subject_variants": email_data.get("subject_variants", []),
        "why_this_works": email_data.get("why_this_works", ""),
        "validator_name": validator_name,
        "validator_company": validator_company,
    }
```

---

### 3. Path Tracer — `agents/path_tracer.py`

Given an alumni and a student profile, generates a compatibility score and surfaces startups that match the alumni's early career trajectory.

```python
import uuid
from services.llm_client import call_llm, parse_json_response
from database import get_alumni_by_id, get_all_startups, insert_path_trace


def trace_path(student_id: str, alumni_id: str, student_profile: dict) -> dict:
    """
    Copy Their Path pipeline:
    1. Fetch alumni profile from DB
    2. LLM generates an enriched timeline from alumni profile data
    3. LLM scores student compatibility with this path
    4. Surface matching startups from Radar
    5. Store trace and return
    """

    # Step 1: Alumni
    alumni = get_alumni_by_id(alumni_id)
    if not alumni:
        raise ValueError(f"Alumni {alumni_id} not found")

    # Step 2 + 3: Timeline + compatibility
    system_prompt = """You are a career path analyst.
Given an alumni's profile and a student's profile, do two things:
1. Reconstruct the alumni's likely career timeline as milestone nodes
2. Score the student's compatibility with this path

Return JSON with:
- timeline (array of objects with: year, event, skills_gained, projects_built, node_type)
  node_type is one of: education | internship | job | promotion | startup
- compatibility_score (integer 0-100)
- compatibility_reasons (array of 3 strings explaining the score)
- gap_areas (array of strings — what the student is missing vs this path)"""

    user_prompt = f"""Alumni Profile:
Name: {alumni.get('name')}
Batch Year: {alumni.get('batch_year')}
Domain: {alumni.get('domain')}
Current Company: {alumni.get('company')}
Current Role: {alumni.get('role')}
Skills: {alumni.get('skills', '[]')}

Student Profile:
Branch: {student_profile.get('branch')}
Year: {student_profile.get('current_year')}
CGPA: {student_profile.get('cgpa')}
Skills: {', '.join(student_profile.get('skills', []))}
Target Domain: {student_profile.get('target_domain')}

Reconstruct the alumni's career timeline and score the student's compatibility."""

    raw = call_llm(system_prompt, user_prompt, expect_json=True, max_tokens=2000)
    result = parse_json_response(raw)

    # Step 4: Match startups to alumni's domain
    all_startups = get_all_startups(domain=alumni.get("domain"))
    suggested_startups = all_startups[:3]

    # Step 5: Store
    trace_id = str(uuid.uuid4())
    insert_path_trace({
        "id": trace_id,
        "student_id": student_id,
        "alumni_id": alumni_id,
        "compatibility": result.get("compatibility_score", 0),
        "suggested_startups": [s["id"] for s in suggested_startups],
    })

    return {
        "trace_id": trace_id,
        "alumni": alumni,
        "timeline": result.get("timeline", []),
        "compatibility_score": result.get("compatibility_score", 0),
        "compatibility_reasons": result.get("compatibility_reasons", []),
        "gap_areas": result.get("gap_areas", []),
        "suggested_startups": suggested_startups,
    }
```

---

### 4. Skill Bridge — `agents/skill_bridge.py`

Fetches real alumni data from the DB for a target company, splits by on-campus vs off-campus, and runs an LLM comparison. Returns the two comparison tables and a probability score for the student.

```python
import uuid
from services.llm_client import call_llm, parse_json_response
from services.scraper import search_with_deep_scrape
from database import get_all_alumni, insert_skill_bridge


def analyze_skill_bridge(student_id: str, company: str, student_profile: dict) -> dict:
    """
    Alumni Skill-Project Bridge pipeline:
    1. Fetch alumni who work at this company from DB
    2. Web-scrape hiring criteria for this company
    3. LLM generates on-campus vs off-campus comparison tables
    4. LLM scores the student's probability on each path
    5. Store and return
    """

    # Step 1: Alumni at this company
    company_alumni = get_all_alumni(company=company)

    on_campus = [a for a in company_alumni if a.get("on_campus_hire")]
    off_campus = [a for a in company_alumni if not a.get("on_campus_hire")]

    # Step 2: Scrape real hiring info
    evidence = search_with_deep_scrape(
        f"{company} hiring criteria internship CGPA DSA projects requirements", max_results=3
    )
    hiring_context = evidence["snippets"][:2000]
    if evidence["deep_content"]:
        hiring_context += f"\n\nDeep content:\n{evidence['deep_content'][:1500]}"

    # Step 3 + 4: LLM generates comparison + student probability
    system_prompt = """You are a placement analyst at a top engineering college.
Given alumni data and web evidence about a company's hiring, generate:
1. A structured comparison of on-campus vs off-campus hiring criteria
2. A probability score for the student on each path

Return JSON with:
- on_campus (object):
    avg_cgpa (float), dsa_level (string: Low|Medium|High),
    projects_needed (integer), interview_rounds (integer),
    success_rate (integer, percentage), time_to_offer_months (integer),
    key_factors (array of strings)
- off_campus (object):
    avg_cgpa (float), dsa_level (string), projects_needed (integer),
    skills_focus (string), success_rate (integer),
    time_to_offer_months (integer), key_factors (array of strings)
- student_on_campus_probability (integer, 0-100)
- student_off_campus_probability (integer, 0-100)
- recommendation (string: on_campus | off_campus)
- recommendation_reason (string, 2-3 sentences)
- alumni_on_campus (array of objects with name, cgpa, dsa_level, projects, outcome)
- alumni_off_campus (array of objects with name, cgpa, skills, projects, outcome)"""

    alumni_summary = "\n".join([
        f"- {a['name']}, CGPA: {a.get('cgpa', 'N/A')}, Role: {a.get('role')}"
        for a in company_alumni[:8]
    ]) or "No direct alumni data for this company in our DB."

    user_prompt = f"""Target Company: {company}

Alumni from this institution at {company}:
{alumni_summary}

Web evidence about {company}'s hiring:
{hiring_context}

Student Profile:
CGPA: {student_profile.get('cgpa')}
Skills: {', '.join(student_profile.get('skills', []))}
Branch: {student_profile.get('branch')}
Projects: {student_profile.get('projects', 'None listed')}

Generate the on-campus vs off-campus comparison and student probability scores."""

    raw = call_llm(system_prompt, user_prompt, expect_json=True, max_tokens=2000)
    result = parse_json_response(raw)

    # Step 5: Store
    analysis_id = str(uuid.uuid4())
    insert_skill_bridge({
        "id": analysis_id,
        "student_id": student_id,
        "company": company,
        "on_campus_data": result.get("on_campus", {}),
        "off_campus_data": result.get("off_campus", {}),
        "recommendation": result.get("recommendation"),
        "probability": result.get("student_off_campus_probability", 0),
    })

    return {
        "analysis_id": analysis_id,
        "company": company,
        "on_campus": result.get("on_campus", {}),
        "off_campus": result.get("off_campus", {}),
        "student_on_campus_probability": result.get("student_on_campus_probability", 0),
        "student_off_campus_probability": result.get("student_off_campus_probability", 0),
        "recommendation": result.get("recommendation"),
        "recommendation_reason": result.get("recommendation_reason", ""),
        "alumni_on_campus": result.get("alumni_on_campus", []),
        "alumni_off_campus": result.get("alumni_off_campus", []),
    }
```

---

## main.py — FastAPI Routes

```python
import uuid
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_all_alumni, get_alumni_by_id, get_all_startups
from models import (
    MentorRequestBody, ProjectGenerateBody, EmailForgeBody,
    PathTraceBody, SkillBridgeBody, ValidatorRequestBody
)
from agents.project_generator import generate_project_brief
from agents.email_forge import forge_cold_email
from agents.path_tracer import trace_path
from agents.skill_bridge import analyze_skill_bridge
from services.startup_radar import refresh_startup_radar


@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup: init DB and run a background startup radar refresh
    init_db()
    asyncio.create_task(asyncio.to_thread(refresh_startup_radar))
    yield


app = FastAPI(title="AlumNetwork API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Alumni ──────────────────────────────────────────────────────────────────

@app.get("/api/alumni")
def list_alumni(domain: str = None, company: str = None, open_to_refer: bool = False):
    alumni = get_all_alumni(domain=domain, company=company, open_to_refer=open_to_refer)
    return {"alumni": alumni, "count": len(alumni)}


@app.get("/api/alumni/{alumni_id}")
def get_alumni(alumni_id: str):
    alumni = get_alumni_by_id(alumni_id)
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")
    return alumni


# ─── Mentor Requests ─────────────────────────────────────────────────────────

@app.post("/api/mentor/request")
def request_mentor(body: MentorRequestBody):
    # In full implementation: store request + send notification email
    request_id = str(uuid.uuid4())
    return {
        "request_id": request_id,
        "status": "pending",
        "message": f"Mentor request sent to alumni {body.alumni_id}"
    }


# ─── Startup Radar ───────────────────────────────────────────────────────────

@app.get("/api/startups")
def list_startups(domain: str = None, stage: str = None):
    startups = get_all_startups(domain=domain, stage=stage)
    return {"startups": startups, "count": len(startups)}


@app.post("/api/startups/refresh")
def trigger_radar_refresh(background_tasks: BackgroundTasks, domains: list[str] = None):
    background_tasks.add_task(refresh_startup_radar, domains)
    return {"message": "Startup Radar refresh triggered in background"}


# ─── Build to Apply ──────────────────────────────────────────────────────────

@app.post("/api/build-to-apply/generate")
def generate_project(body: ProjectGenerateBody):
    # In full implementation: fetch real student profile from DB
    # Using mock student profile for prototype
    student_profile = {
        "id": body.student_id,
        "name": "Student",
        "branch": "Computer Science",
        "cgpa": 7.8,
        "skills": ["Python", "React", "Machine Learning"],
        "target_domain": "healthtech",
    }
    try:
        result = generate_project_brief(body.student_id, body.startup_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Project generation failed: {str(e)}")


@app.post("/api/build-to-apply/validate")
def request_validation(body: ValidatorRequestBody):
    from database import update_project_validator
    update_project_validator(body.project_id, body.alumni_id)
    return {
        "status": "validation_requested",
        "project_id": body.project_id,
        "validator_id": body.alumni_id,
    }


# ─── Cold Email Forge ─────────────────────────────────────────────────────────

@app.post("/api/cold-email/forge")
def forge_email(body: EmailForgeBody):
    student_profile = {
        "id": body.student_id,
        "name": "Student",
        "branch": "Computer Science",
        "cgpa": 7.8,
        "skills": ["Python", "React", "Machine Learning"],
    }
    try:
        result = forge_cold_email(
            student_id=body.student_id,
            startup_id=body.startup_id,
            student_profile=student_profile,
            project_id=body.project_id,
            tone=body.tone or "conversational",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email generation failed: {str(e)}")


# ─── Copy Their Path ──────────────────────────────────────────────────────────

@app.post("/api/path/trace")
def trace_alumni_path(body: PathTraceBody):
    student_profile = {
        "id": body.student_id,
        "branch": "Computer Science",
        "current_year": 3,
        "cgpa": 7.8,
        "skills": ["Python", "React"],
        "target_domain": "fintech",
    }
    try:
        result = trace_path(body.student_id, body.alumni_id, student_profile)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Path trace failed: {str(e)}")


# ─── Skill Bridge ─────────────────────────────────────────────────────────────

@app.post("/api/skill-bridge/analyze")
def skill_bridge(body: SkillBridgeBody):
    student_profile = {
        "id": body.student_id,
        "branch": "Computer Science",
        "cgpa": 7.8,
        "skills": ["Python", "React", "DSA - Medium"],
        "projects": "1 major project",
    }
    try:
        result = analyze_skill_bridge(body.student_id, body.company, student_profile)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skill bridge analysis failed: {str(e)}")


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "AlumNetwork API"}
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/alumni` | List all alumni. Query params: `domain`, `company`, `open_to_refer` |
| `GET` | `/api/alumni/{id}` | Get single alumni profile |
| `POST` | `/api/mentor/request` | Send a mentorship request |
| `GET` | `/api/startups` | List startups. Query params: `domain`, `stage` |
| `POST` | `/api/startups/refresh` | Trigger background Startup Radar re-scrape |
| `POST` | `/api/build-to-apply/generate` | Generate project brief for a startup |
| `POST` | `/api/build-to-apply/validate` | Request alumni validation for a project |
| `POST` | `/api/cold-email/forge` | Generate cold email |
| `POST` | `/api/path/trace` | Trace alumni career path + compatibility score |
| `POST` | `/api/skill-bridge/analyze` | On-campus vs off-campus comparison for a company |
| `GET` | `/health` | Health check |

---

## Running the Server

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run dev server
python -m uvicorn backend.main:app --reload --port 8000
```

Server starts at `http://localhost:8000`.

On startup it automatically:
1. Initialises the SQLite DB and creates all tables
2. Triggers a background Startup Radar scrape across all default domains

The frontend dev server should run separately at `http://localhost:3000`.

---

## Key Implementation Notes

**Why DuckDuckGo + Jina and not a paid search API:**
DuckDuckGo's `duckduckgo-search` Python library requires no API key and handles rate limiting gracefully. Jina AI Reader (`r.jina.ai/<url>`) is a free endpoint that returns any URL as clean markdown — no key, no account. Combined, they give a complete web intelligence pipeline at zero cost, which is how BluffBuster does all its claim verification.

**Why MD5 disk cache:**
The same startup or company gets queried multiple times across different students. Caching by query hash means the second student who asks about JPMC gets the scraped result instantly without hitting the network again.

**Why batch LLM calls with ID tags:**
Sending all items in one mega-prompt with `[ID: X]` markers is dramatically faster and cheaper than one LLM call per item. The multi-strategy JSON parser ensures the output is reliably extracted even if the model misbehaves.

**Why SQLite and not Postgres:**
Deployable with zero infrastructure — no separate DB server needed. For a hackathon demo this is correct. The schema is designed to migrate to Postgres trivially when needed.
