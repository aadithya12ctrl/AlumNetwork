import uuid
from backend.services.llm_client import call_llm, parse_json_response
from backend.services.scraper import search_with_deep_scrape
from backend.database import get_all_alumni, insert_skill_bridge


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

    # Step 2: Context (Bypassing Web Search)
    hiring_context = f"Company: {company}. Use your internal knowledge of their typical engineering hiring bars (CGPA, DSA, Projects) for on-campus and off-campus placements in India."
    # (search_with_deep_scrape skipped)

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
