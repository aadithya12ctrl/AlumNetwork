export type UserRole = 'student' | 'alumni';

export type Alumni = {
  id: string;
  name: string;
  role: string;
  company: string;
  batchYear: string;
  domain: string[];
  isOpenToRefer: boolean;
  avatarInitials: string;
};

export type Event = {
  id: string;
  title: string;
  date: string;
  day: number;
  type: string;
  speaker: string;
};

export type Startup = {
  id: string;
  name: string;
  stage: string;
  domain: string;
  techStack: string[];
  alumniConnections: number;
};
