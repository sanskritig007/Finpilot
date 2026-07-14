# Phase 12: Folder Structure

This document outlines the directory structure for FinPilot AI. We use a Monorepo approach with distinct frontend and backend directories. 

- **Backend:** Strictly follows Clean Architecture to separate business logic (Services) from API routing (Controllers) and Database queries (Repositories).
- **Frontend:** Uses a Feature-Based structure, which is much easier to scale than grouping by file type.

## 1. High-Level Monorepo Structure
```text
finpilot-ai/
├── frontend/           # React.js SPA (Vite)
├── backend/            # FastAPI Python Application
├── docs/               # Architecture & Planning documents (Phases 1-15)
├── docker-compose.yml  # Local dev orchestration (Postgres, Redis, API, UI)
└── README.md           # Project overview and setup instructions
```

## 2. Backend (FastAPI + Clean Architecture)
The backend separates concerns to ensure that swapping a database or changing an external API doesn't break the entire app.

```text
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── core/                   # App-wide settings and security
│   │   ├── config.py           # Environment variables (Pydantic Settings)
│   │   └── security.py         # JWT and password hashing logic
│   ├── api/                    # Routers (API Endpoints)
│   │   ├── v1/
│   │   │   ├── auth.py         # POST /login
│   │   │   ├── transactions.py # POST /upload
│   │   │   └── chat.py         # POST /chat
│   ├── services/               # Business Logic (The "Brain")
│   │   ├── csv_parser.py       # Logic to read, deduplicate, and validate CSVs
│   │   ├── ai_manager.py       # Interacts with OpenAI & Function Calling
│   │   └── finance_logic.py    # Calculates "Safe to Spend"
│   ├── models/                 # SQLAlchemy ORM Models (Database Tables)
│   │   ├── user.py
│   │   ├── transaction.py
│   │   └── goal.py
│   ├── schemas/                # Pydantic Models (Request/Response Validation)
│   │   ├── user_schema.py
│   │   └── transaction_schema.py
│   └── db/                     # Database Connection & Migrations
│       ├── session.py          # SQLAlchemy session maker
│       └── alembic/            # Database migration scripts
├── tests/                      # Pytest unit & integration tests
├── requirements.txt            # Python dependencies
└── Dockerfile                  # Container definition
```

## 3. Frontend (React.js + Tailwind CSS)
The frontend keeps components, state, and API calls related to a specific feature grouped together.

```text
frontend/
├── src/
│   ├── App.jsx                 # Root component and Routing
│   ├── main.jsx                # React DOM render
│   ├── core/                   # Global app configurations
│   │   ├── api.js              # Axios instance with JWT interceptors
│   │   └── store.js            # Global state (e.g., Zustand)
│   ├── features/               # Feature-based modules
│   │   ├── auth/               # Login & Signup UI
│   │   │   ├── LoginView.jsx
│   │   │   └── authApi.js
│   │   ├── dashboard/          # Dashboard & Metrics UI
│   │   │   ├── DashboardView.jsx
│   │   │   ├── SafeToSpendCard.jsx
│   │   │   └── dashboardApi.js
│   │   ├── transactions/       # CSV Upload & Data Table UI
│   │   │   ├── UploadModal.jsx
│   │   │   └── TransactionList.jsx
│   │   └── chat/               # AI Chat UI
│   │       ├── ChatWindow.jsx
│   │       └── MessageBubble.jsx
│   ├── shared/                 # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   └── Spinner.jsx
│   └── assets/                 # Images, icons, global CSS
├── package.json                # Node dependencies
├── tailwind.config.js          # Tailwind styling tokens
└── vite.config.js              # Bundler configuration
```

---
**Status:** Phase 12 Completed.
