"""
Mock seed data for the AlumNetwork prototype.
Mirrors the frontend constants.ts so the backend DB matches the UI.
"""

MOCK_ALUMNI = [
    {
        "id": "1",
        "name": "Eleanor Vance",
        "role": "Senior Kernel Engineer",
        "company": "Nvidia",
        "batchYear": "2016",
        "domain": ["OS Internals", "C/C++", "GPU Arch"],
        "isOpenToRefer": True,
        "avatarInitials": "EV",
    },
    {
        "id": "2",
        "name": "Julian Blackwood",
        "role": "Distributed Systems Lead",
        "company": "Cloudflare",
        "batchYear": "2018",
        "domain": ["Networking", "Rust", "Wasm"],
        "isOpenToRefer": False,
        "avatarInitials": "JB",
    },
    {
        "id": "3",
        "name": "Clara Montrose",
        "role": "MLOps Architect",
        "company": "Vertex AI",
        "batchYear": "2014",
        "domain": ["Scalability", "K8s", "TensorFlow"],
        "isOpenToRefer": True,
        "avatarInitials": "CM",
    },
    {
        "id": "4",
        "name": "Arthur Pym",
        "role": "Security Researcher",
        "company": "Vault Systems",
        "batchYear": "2020",
        "domain": ["Cryptography", "Reverse Engineering"],
        "isOpenToRefer": True,
        "avatarInitials": "AP",
    },
]

MOCK_EVENTS = [
    {
        "id": "e1",
        "title": "Advanced System Design Workshop",
        "date": "OCT 12",
        "day": 12,
        "type": "Workshop",
        "speaker": "Julian Blackwood",
    },
    {
        "id": "e2",
        "title": "Hacker House: 48h Debug-a-thon",
        "date": "OCT 24",
        "day": 24,
        "type": "Hackathon",
        "speaker": "Multiple",
    },
    {
        "id": "e3",
        "title": "Navigating FAANG vs HFTs",
        "date": "NOV 05",
        "day": 5,
        "type": "Talk",
        "speaker": "Arthur Pym",
    },
]

MOCK_STARTUPS = [
    {
        "id": "s1",
        "name": "Nocturne Robotics",
        "stage": "Series A",
        "domain": "Computer Vision",
        "techStack": ["C++", "CUDA", "Python"],
        "alumniConnections": 4,
    },
    {
        "id": "s2",
        "name": "Aether Cloud",
        "stage": "Seed",
        "domain": "Serverless Infrastructure",
        "techStack": ["Rust", "Go", "K8s"],
        "alumniConnections": 2,
    },
    {
        "id": "s3",
        "name": "Cipher Guard",
        "stage": "Late Stage",
        "domain": "Post-Quantum Crypto",
        "techStack": ["C", "Assembly", "Haskell"],
        "alumniConnections": 7,
    },
]
