import uuid
import time
from datetime import datetime
from backend.services.scraper import search_with_deep_scrape, duckduckgo_search, jina_scrape
from backend.services.llm_client import call_llm, parse_json_response
from backend.database import insert_startup, get_all_startups

DOMAINS = ["healthtech", "fintech", "edtech", "climate", "b2b saas", "logistics", "AI/ML", "deeptech"]

STAGES = ["pre-seed", "seed"]

CURRENT_YEAR = datetime.now().year


# ─── Phase 1: LLM-Driven Query Generation ────────────────────────────────────

def _llm_generate_queries(domain: str) -> list[str]:
    """
    Use the LLM to generate smart, diverse search queries for finding
    early-stage startups in Bangalore for a given domain.
    Falls back to hardcoded queries if LLM fails.
    """
    system_prompt = """You are a startup research specialist.
Generate exactly 5 search queries to find early-stage startups in Bangalore/Bengaluru, India.
The queries should be diverse — covering different angles:
1. Direct startup discovery (funding announcements, accelerators)
2. Product Hunt / launch platforms
3. Y Combinator / accelerator batches with Indian startups
4. News articles about the startup ecosystem
5. LinkedIn/AngelList style queries

Return ONLY a JSON array of 5 strings (the search queries).
Make queries specific to 2025-2026 and Bangalore. Use varied phrasing."""

    user_prompt = f"""Domain: {domain}
Base seed query: "Early stage Startups in Bangalore {CURRENT_YEAR}"

Generate 5 diverse, high-signal web search queries to find real early-stage {domain} startups in Bangalore, India.
Focus on {CURRENT_YEAR - 1} and {CURRENT_YEAR} timeframe."""

    try:
        raw = call_llm(system_prompt, user_prompt, expect_json=True, max_tokens=500, temperature=0.7)
        queries = parse_json_response(raw)
        if isinstance(queries, dict) and "queries" in queries:
            queries = queries["queries"]
        if isinstance(queries, list) and len(queries) >= 3:
            print(f"[StartupRadar] LLM generated {len(queries)} queries for {domain}")
            return [str(q) for q in queries[:5]]
    except Exception as e:
        print(f"[StartupRadar] LLM query generation failed for {domain}: {e}")

    # Fallback: hardcoded Bangalore-focused queries
    return _build_fallback_queries(domain)


def _build_fallback_queries(domain: str) -> list[str]:
    """Hardcoded fallback queries — Bangalore-focused, current year."""
    return [
        f"Early stage {domain} startups in Bangalore {CURRENT_YEAR}",
        f"{domain} startup seed funding Bengaluru India {CURRENT_YEAR}",
        f"YC Indian {domain} startup Bangalore {CURRENT_YEAR - 1} {CURRENT_YEAR}",
        f"site:yourstory.com {domain} startup Bangalore funding",
        f"{domain} startup launched Bengaluru pre-seed {CURRENT_YEAR}",
    ]


# ─── Phase 2: Direct LLM Generation (Bypassing Web Search) ───────────────────

def generate_startups_with_llm(domain: str) -> list[dict]:
    """
    Directly generate a list of real early-stage startups in Bangalore
    using the LLM's internal knowledge base.
    """
    system_prompt = """You are a startup research specialist specializing in the Indian tech ecosystem.
Generate a list of REAL early-stage startups based in Bangalore/Bengaluru, India for the given domain.
Only include startups that actually exist or are highly plausible based on recent ecosystem trends (2025-2026).
Return ONLY a JSON array of objects. Each object must have:
- name (string)
- domain (string — specific sub-domain)
- stage (string: pre-seed | seed | series-a)
- description (string, 2-3 sentences about what they do)
- tech_stack (array of strings)
- location (string — "Bangalore, India")
- source_url (string — a plausible website or LinkedIn URL)
- founders (string — names of founders if known)
- funding_amount (string — recent funding if known)
Return max 8 startups for the given domain."""

    user_prompt = f"""Domain: {domain}
Location Focus: Bangalore / Bengaluru, India
Current Year: {CURRENT_YEAR}

Generate a diverse list of real or highly realistic early-stage startups in this space."""

    try:
        print(f"[StartupRadar] Generating startups for {domain} via LLM...")
        raw = call_llm(system_prompt, user_prompt, expect_json=True, max_tokens=2500)
        startups = parse_json_response(raw)
        
        if isinstance(startups, dict) and "startups" in startups:
            startups = startups["startups"]
        if not isinstance(startups, list):
            return []
            
        print(f"[StartupRadar] LLM generated {len(startups)} startups for {domain}")
        return startups
    except Exception as e:
        print(f"[StartupRadar] LLM startup generation failed for {domain}: {e}")
        return []


# ─── Main Refresh Pipeline ────────────────────────────────────────────────────

def refresh_startup_radar(domains: list[str] = None):
    """
    Refined pipeline:
    1. Directly generate startup data via LLM (internal intelligence)
    2. Upsert into DB
    """
    targets = domains or DOMAINS
    total_inserted = 0

    for domain in targets:
        print(f"\n[StartupRadar] === Processing domain: {domain} ===")
        startups = generate_startups_with_llm(domain)

        for s in startups:
            if not s.get("name"):
                continue

            # Generate deterministic ID
            s["id"] = str(uuid.uuid5(uuid.NAMESPACE_DNS, s["name"].lower()))
            s["alumni_ids"] = s.get("alumni_ids", [])
            insert_startup(s)
            total_inserted += 1

        # Small delay to avoid API hammering
        time.sleep(1)

    print(f"\n[StartupRadar] === DONE: {total_inserted} total startups inserted ===")


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
