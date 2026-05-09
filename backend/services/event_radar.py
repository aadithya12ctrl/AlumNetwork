import uuid
import time
from datetime import datetime
from backend.services.scraper import search_with_deep_scrape, duckduckgo_search, jina_scrape
from backend.services.llm_client import call_llm, parse_json_response
from backend.database import insert_event, get_all_events

CURRENT_YEAR = datetime.now().year
CURRENT_MONTH = datetime.now().strftime("%B")  # e.g., "May"
CURRENT_MONTH_NUM = datetime.now().month


# ─── Phase 1: LLM-Driven Query Generation ────────────────────────────────────

def _llm_generate_event_queries() -> list[str]:
    """
    Use the LLM to generate smart, diverse search queries for finding
    tech events in Bengaluru for the current month.
    Falls back to hardcoded queries if LLM fails.
    """
    system_prompt = """You are a tech event discovery specialist for Bengaluru, India.
Generate exactly 5 search queries to find upcoming tech events, meetups, hackathons, 
conferences, and workshops happening in Bengaluru/Bangalore.
The queries should be diverse — covering different angles:
1. General tech events and meetups
2. Startup/VC events and demo days
3. Hackathons and coding competitions
4. Developer conferences and workshops
5. Platform-specific (Meetup.com, Eventbrite, Luma, insider.in, townscript.com)

Return ONLY a JSON array of 5 strings (the search queries).
Make queries specific to the current month and year."""

    user_prompt = f"""Base seed query: "Tech Events in Bengaluru {CURRENT_MONTH} {CURRENT_YEAR}"

Generate 5 diverse search queries to find real tech events happening in Bengaluru 
in {CURRENT_MONTH} {CURRENT_YEAR} and the next 1-2 months.
Include queries for hackathons, startup events, developer meetups, AI/ML conferences, etc."""

    try:
        raw = call_llm(system_prompt, user_prompt, expect_json=True, max_tokens=500, temperature=0.7)
        queries = parse_json_response(raw)
        if isinstance(queries, dict) and "queries" in queries:
            queries = queries["queries"]
        if isinstance(queries, list) and len(queries) >= 3:
            print(f"[EventRadar] LLM generated {len(queries)} event search queries")
            return [str(q) for q in queries[:5]]
    except Exception as e:
        print(f"[EventRadar] LLM query generation failed: {e}")

    # Fallback
    return _build_fallback_event_queries()


def _build_fallback_event_queries() -> list[str]:
    """Hardcoded fallback queries for Bengaluru tech events."""
    return [
        f"Tech Events in Bengaluru {CURRENT_MONTH} {CURRENT_YEAR}",
        f"Hackathon Bangalore {CURRENT_MONTH} {CURRENT_YEAR}",
        f"Developer meetup Bengaluru {CURRENT_YEAR} upcoming",
        f"site:meetup.com Bangalore tech {CURRENT_MONTH} {CURRENT_YEAR}",
        f"startup event demo day Bengaluru {CURRENT_MONTH} {CURRENT_YEAR}",
    ]


# ─── Phase 2: Direct LLM Generation (Bypassing Web Search) ───────────────────

def generate_events_with_llm() -> list[dict]:
    """
    Directly generate a list of upcoming tech events in Bengaluru
    using the LLM's internal knowledge base.
    """
    system_prompt = f"""You are a tech event specialist for Bengaluru, India.
Generate a list of REAL or highly probable tech events happening in Bengaluru for {CURRENT_MONTH} {CURRENT_YEAR} and the next 2 months.
Include workshops, hackathons, conferences, meetups, and startup demo days.
Return ONLY a JSON array. Each item must have:
- title (string)
- event_type (string: Workshop | Hackathon | Conference | Meetup | Talk | Demo Day | Webinar)
- description (string, 1-2 sentences)
- date (string — formatted as "MMM DD" e.g. "MAY 15")
- day (integer — day of month)
- alumni_speaker (string — speaker name if known, else "TBD")
- location (string — e.g., "Koramangala", "Indiranagar", "HSR Layout", or a specific hotel/venue)
- registration_url (string — a plausible registration link)
Return max 15 events."""

    user_prompt = f"""Location: Bengaluru, India
Current Time: {CURRENT_MONTH} {CURRENT_YEAR}

Generate a comprehensive list of tech events for this period."""

    try:
        print(f"[EventRadar] Generating events for Bengaluru via LLM...")
        raw = call_llm(system_prompt, user_prompt, expect_json=True, max_tokens=2500)
        events = parse_json_response(raw)
        
        if isinstance(events, dict) and "events" in events:
            events = events["events"]
        if not isinstance(events, list):
            return []
            
        print(f"[EventRadar] LLM generated {len(events)} events")
        return events
    except Exception as e:
        print(f"[EventRadar] LLM event generation failed: {e}")
        return []


# ─── Main Refresh Pipeline ────────────────────────────────────────────────────

def refresh_event_radar():
    """
    Refined event discovery pipeline:
    1. Directly generate event data via LLM
    2. Upsert into DB
    """
    print(f"\n[EventRadar] === Discovering tech events in Bengaluru ({CURRENT_MONTH} {CURRENT_YEAR}) ===")

    events = generate_events_with_llm()
    inserted = 0

    for e in events:
        if not e.get("title"):
            continue

        # Generate deterministic ID
        e["id"] = str(uuid.uuid5(uuid.NAMESPACE_DNS, e["title"].lower()))

        # Ensure required fields
        e.setdefault("event_type", "Event")
        e.setdefault("description", "")
        e.setdefault("date", f"{CURRENT_MONTH[:3].upper()} TBD")
        e.setdefault("day", 1)
        e.setdefault("alumni_speaker", "TBD")

        insert_event(e)
        inserted += 1

    print(f"[EventRadar] === DONE: {inserted} events inserted ===\n")
    return inserted
