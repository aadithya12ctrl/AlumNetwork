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

    # Step 2: Context (Bypassing Web Search)
    domain = startup.get("domain", "")
    description = startup.get("description", "A startup in the " + domain + " space.")
    context = f"Domain: {domain}\nDescription: {description}"

    # Step 3: LLM generates project brief
    system_prompt = """You are an Elite Technical Architect and Hiring Manager at a Tier-1 Venture Capital firm.
Your goal is to design a 'Proof of Work' project brief that a student can build to bypass the resume filter and get a direct interview at a specific startup.

The brief must be EXTREMELY DETAILED and technically rigorous. It should not just be a 'todo list' but a mini-architecture document.

Return JSON with exactly these fields:
- project_title: A punchy, professional name for the project.
- problem_statement: A deep dive into a specific technical or business problem the startup currently faces (based on their domain and stage).
- technical_challenge: Why this is hard. Mention specific constraints like latency, concurrency, data consistency, or specialized algorithms.
- what_to_build: A modular breakdown of the system. Describe the Core Engine, the API/Interface layer, and the Data/Persistence layer.
- architectural_decisions: 2-3 specific technical choices the student must make (e.g., 'Why use Redis over a traditional DB for this module?').
- tech_stack: A curated array of industry-standard tools relevant to this startup (e.g., Rust for infra, Next.js for fintech, PyTorch for AI).
- key_features: 4-5 high-impact features that demonstrate both coding skill and domain empathy.
- evaluation_metrics: How will a senior engineer at that startup judge this? (e.g., 'Must handle 500 requests/sec', '95% test coverage on core logic').
- why_this_impresses: A strategic explanation of how this project solves a 'pain point' for the startup's engineering team.
- readme_template: A professional Markdown README outline with sections for 'Architecture', 'Setup', and 'Trade-offs'.
- estimated_hours: A realistic estimate (typically 40-60 hours of deep work)."""

    user_prompt = f"""Target Startup: {startup['name']}
{context}
Venture Stage: {startup.get('stage', 'early-stage')}

Task:
Generate a 'Build to Apply' project brief for an engineering student. 
The project should be a 'Vertical Slice' of the startup's own product or a specialized tool that their internal team would find valuable.

Think about:
1. If they are in {domain}, what is their biggest technical bottleneck?
2. How can the student demonstrate 'Domain Empathy' (understanding their users)?
3. What 'Senior' concepts can be baked in? (Observability, Rate Limiting, Schema Migrations, etc.)

Generate the full JSON package."""

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
        **brief,
        "validators": validators,
    }
