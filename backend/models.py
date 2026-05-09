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
