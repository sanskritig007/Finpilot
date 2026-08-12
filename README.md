# FinPilot AI

FinPilot AI is an intelligent, AI-powered personal finance assistant designed to help users track expenses, set savings goals, and understand their financial health with long-term memory and secure analytics. 

This repository is organized as a monorepo containing a stateless FastAPI backend and a Vite React frontend.

---

## Tech Stack

- **Backend:** FastAPI (Python), SQLAlchemy ORM, Alembic (Migrations), Redis (Session Cache/Rate Limiting), PostgreSQL (Relational DB)
- **Frontend:** React.js, Tailwind CSS (v4), Axios, Lucide React, Vite (Bundler)
- **Infrastructure:** Docker & Docker Compose

---

## Local Setup Instructions

### Prerequisites
Make sure you have the following installed on your machine:
1. [Docker Desktop](https://www.docker.com/products/docker-desktop/) (must be running)
2. Python 3.9+
3. Node.js (v18+)

---

### Step 1: Clone and Infrastructure Setup
1. Clone the repository and navigate to the project directory:
   ```bash
   cd Finpilot
   ```
2. Start the database and cache services using Docker:
   ```bash
   docker compose up -d
   ```
   *This starts PostgreSQL on port `5432` and Redis on port `6379`.*

---

### Step 2: Backend Setup & Migrations
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the database migrations to create the tables:
   ```bash
   alembic upgrade head
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend will run at `http://localhost:8000`. You can access the auto-generated Swagger API documentation at `http://localhost:8000/docs`.*

---

### Step 3: Frontend Setup
1. Open a new terminal window/tab and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The frontend will run at `http://localhost:5173`.*

---

## Directory Layout

```text
Finpilot/
├── backend/            # FastAPI Python Application
│   ├── app/            # Source Code (Clean Architecture)
│   │   ├── api/        # Routers & Endpoints
│   │   ├── core/       # Settings & Security
│   │   ├── db/         # Database Sessions & Alembic Migrations
│   │   ├── models/     # SQLAlchemy Database Models
│   │   ├── schemas/    # Pydantic Input/Output Schemas
│   │   └── services/   # Business Logic
│   └── requirements.txt
├── frontend/           # React.js SPA (Vite)
│   ├── src/
│   │   ├── core/       # Axios API Config & Global State
│   │   └── features/   # Feature-based Views & Context (Auth, Dashboard)
│   └── tailwind.config.js
├── docs/               # Product Discovery & System Architecture Docs
├── docker-compose.yml  # Local database & cache orchestration
└── README.md           # This setup guide
```

---

## Running Tests

To run the backend unit tests for manual transaction flows and logic validations:
```bash
cd backend
PYTHONPATH=. venv/bin/python -m unittest tests/test_manual_transactions.py
```

---

## Progress Roadmap

- [x] **Sprint 1: Foundation & Authentication** (Vite + FastAPI setup, Postgres + Redis setup, JWT authentication, Redis JWT logout denylist, and Account models).
- [x] **Sprint 2: Data Ingestion & Dashboard** (CSV statement upload, parsed in-memory deduplication, metrics aggregation).
- [x] **Sprint 3: AI Chat Integration** (Google Gemini model integration, context-aware prompt engineering, rate limits).
- [x] **Sprint 4: Savings Goals CRUD** (Target date goals creation, progressive fund management, dynamic dashboard safe-to-spend subtraction).
- [x] **Sprint 5: Settings Panel & Cash Logs** (AI memory resetting, GDPR account deletions, manual expense logging, double-entry goal savings, budget exceeded alerts).
