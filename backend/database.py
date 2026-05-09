import sqlite3
import os
import json
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
# Use absolute path for DB to handle different working directories (local vs monorepo deploy)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.getenv("SQLITE_DB", os.path.join(BASE_DIR, "alumnetwork.db"))

# Ensure the directory exists
db_dir = os.path.dirname(DB_PATH)
if db_dir:
    os.makedirs(db_dir, exist_ok=True)


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
            avatar_initials TEXT,
            on_campus_hire INTEGER DEFAULT 0,
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
            day INTEGER,
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
            alumni_connections INTEGER DEFAULT 0,
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
    _seed_mock_data()


def _seed_mock_data():
    """Seed the database with mock data from constants if tables are empty."""
    from backend.constants import MOCK_ALUMNI, MOCK_EVENTS, MOCK_STARTUPS

    conn = get_connection()

    # Only seed if alumni table is empty
    count = conn.execute("SELECT COUNT(*) FROM alumni").fetchone()[0]
    if count == 0:
        for a in MOCK_ALUMNI:
            conn.execute("""
                INSERT OR IGNORE INTO alumni
                (id, name, batch_year, domain, company, role, skills, open_to_refer, verified, avatar_initials)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                a["id"], a["name"], int(a["batchYear"]),
                ", ".join(a["domain"]), a["company"], a["role"],
                json.dumps(a["domain"]),
                1 if a["isOpenToRefer"] else 0,
                1,
                a["avatarInitials"]
            ))

    # Seed events
    count = conn.execute("SELECT COUNT(*) FROM events").fetchone()[0]
    if count == 0:
        for e in MOCK_EVENTS:
            conn.execute("""
                INSERT OR IGNORE INTO events (id, title, event_type, date, day, alumni_speaker)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (e["id"], e["title"], e["type"], e["date"], e["day"], e["speaker"]))

    # Seed startups
    count = conn.execute("SELECT COUNT(*) FROM startups").fetchone()[0]
    if count == 0:
        for s in MOCK_STARTUPS:
            conn.execute("""
                INSERT OR IGNORE INTO startups
                (id, name, domain, stage, tech_stack, alumni_ids, alumni_connections)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                s["id"], s["name"], s["domain"], s["stage"],
                json.dumps(s["techStack"]),
                json.dumps([]),
                s["alumniConnections"]
            ))

    conn.commit()
    conn.close()


# ─── Alumni helpers ────────────────────────────────────────────────────────────

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


# ─── Startup helpers ───────────────────────────────────────────────────────────

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


# ─── Event helpers ─────────────────────────────────────────────────────────────

def get_all_events():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM events ORDER BY day ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def insert_event(event: dict):
    conn = get_connection()
    conn.execute("""
        INSERT OR REPLACE INTO events
        (id, title, event_type, description, date, day, alumni_speaker)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        event["id"], event["title"], event.get("event_type"),
        event.get("description"), event.get("date"),
        event.get("day"), event.get("alumni_speaker")
    ))
    conn.commit()
    conn.close()


# ─── Project helpers ───────────────────────────────────────────────────────────

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


# ─── Cold email helpers ────────────────────────────────────────────────────────

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


# ─── Path trace helpers ────────────────────────────────────────────────────────

def insert_path_trace(trace: dict):
    conn = get_connection()
    conn.execute("""
        INSERT INTO path_traces
        (id, student_id, alumni_id, compatibility, suggested_startups)
        VALUES (?, ?, ?, ?, ?)
    """, (
        trace["id"], trace["student_id"], trace["alumni_id"],
        trace.get("compatibility", 0),
        json.dumps(trace.get("suggested_startups", []))
    ))
    conn.commit()
    conn.close()


# ─── Skill bridge helpers ──────────────────────────────────────────────────────

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
