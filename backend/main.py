import uuid
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from database import (
    init_db, get_all_alumni, get_alumni_by_id,
    get_all_startups, get_all_events, update_project_validator
)
from models import (
    MentorRequestBody, ProjectGenerateBody, EmailForgeBody,
    PathTraceBody, SkillBridgeBody, ValidatorRequestBody
)
from agents.project_generator import generate_project_brief
from agents.email_forge import forge_cold_email
from agents.path_tracer import trace_path
from agents.skill_bridge import analyze_skill_bridge
from services.startup_radar import refresh_startup_radar
from services.event_radar import refresh_event_radar


@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup: init DB and run background scrapes
    init_db()
    # Run startup radar refresh in background (non-blocking)
    asyncio.create_task(asyncio.to_thread(refresh_startup_radar))
    # Run event radar refresh in background (non-blocking)
    asyncio.create_task(asyncio.to_thread(refresh_event_radar))
    yield


app = FastAPI(title="AlumNetwork API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173", 
        "https://alumnetwork1.vercel.app",
        "*"
    ],
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


# ─── Events ──────────────────────────────────────────────────────────────────

@app.get("/api/events")
def list_events():
    events = get_all_events()
    return {"events": events, "count": len(events)}


@app.post("/api/events/refresh")
def trigger_event_refresh(background_tasks: BackgroundTasks):
    background_tasks.add_task(refresh_event_radar)
    return {"message": "Event Radar refresh triggered in background"}


# ─── Mentor Requests ─────────────────────────────────────────────────────────

@app.post("/api/mentor/request")
def request_mentor(body: MentorRequestBody):
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
