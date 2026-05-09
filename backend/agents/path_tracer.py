import uuid
from backend.services.llm_client import call_llm, parse_json_response
from backend.database import get_alumni_by_id, get_all_startups, insert_path_trace


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
