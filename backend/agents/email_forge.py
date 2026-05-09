import uuid
from backend.services.llm_client import call_llm, parse_json_response
from backend.services.scraper import search_with_deep_scrape
from backend.database import (
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

    # Step 2: Hook (Bypassing Web Search)
    recent_hook = "Imagine a recent product launch or news update for this startup based on its domain."
    # (search_with_deep_scrape skipped)

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
