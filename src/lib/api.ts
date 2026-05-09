import { Alumni, Event, Startup } from '../types';

export const fetchAlumni = async (filters?: { domain?: string; company?: string; open_to_refer?: boolean }): Promise<Alumni[]> => {
  const params = new URLSearchParams();
  if (filters?.domain) params.append('domain', filters.domain);
  if (filters?.company) params.append('company', filters.company);
  if (filters?.open_to_refer) params.append('open_to_refer', 'true');
  
  const res = await fetch(`/api/alumni?${params.toString()}`);
  const data = await res.json();
  return data.alumni.map((a: any) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    company: a.company,
    batchYear: a.batch_year.toString(),
    domain: JSON.parse(a.skills || '[]'),
    isOpenToRefer: a.open_to_refer === 1,
    avatarInitials: a.avatar_initials,
  }));
};

export const fetchEvents = async (): Promise<Event[]> => {
  const res = await fetch('/api/events');
  const data = await res.json();
  return data.events.map((e: any) => ({
    id: e.id,
    title: e.title,
    date: e.date,
    day: e.day,
    type: e.event_type || 'Event',
    speaker: e.alumni_speaker || 'TBD',
  }));
};

export const fetchStartups = async (filters?: { domain?: string; stage?: string }): Promise<Startup[]> => {
  const params = new URLSearchParams();
  if (filters?.domain) params.append('domain', filters.domain);
  if (filters?.stage) params.append('stage', filters.stage);
  
  const res = await fetch(`/api/startups?${params.toString()}`);
  const data = await res.json();
  return data.startups.map((s: any) => ({
    id: s.id,
    name: s.name,
    stage: s.stage || 'Seed',
    domain: s.domain || 'Tech',
    techStack: JSON.parse(s.tech_stack || '[]'),
    alumniConnections: s.alumni_connections || 0,
  }));
};

export const generateProject = async (studentId: string, startupId: string) => {
  const res = await fetch('/api/build-to-apply/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, startup_id: startupId }),
  });
  return res.json();
};

export const requestValidation = async (projectId: string, alumniId: string) => {
  const res = await fetch('/api/build-to-apply/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, alumni_id: alumniId }),
  });
  return res.json();
};

export const forgeColdEmail = async (studentId: string, startupId: string, projectId?: string, tone?: string) => {
  const res = await fetch('/api/cold-email/forge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, startup_id: startupId, project_id: projectId, tone }),
  });
  return res.json();
};

export const traceAlumniPath = async (studentId: string, alumniId: string) => {
  const res = await fetch('/api/path/trace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, alumni_id: alumniId }),
  });
  return res.json();
};

export const analyzeSkillBridge = async (studentId: string, company: string) => {
  const res = await fetch('/api/skill-bridge/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, company }),
  });
  return res.json();
};
