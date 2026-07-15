# Phase 15: Development Roadmap

This document outlines the agile execution plan for FinPilot AI. The project is broken down into 4 Sprints to ensure rapid delivery of the core Minimum Viable Product (MVP).

## Sprint 1: Foundation & Authentication
- Initialize the monorepo folder structure (React + FastAPI).
- Setup Docker orchestration (`docker-compose.yml`) for PostgreSQL, Redis, and backend.
- Implement the SQLAlchemy Database schema (Users, Transactions, Goals).
- Develop Auth endpoints (`POST /auth/login`) with JWT and bcrypt.
- Setup the basic React frontend (Vite, Tailwind, React Router).

## Sprint 2: Data Ingestion & Dashboard
- Develop the CSV Parser Engine in FastAPI with hash-based deduplication.
- Implement `POST /transactions/upload` and enforce the Zero-Retention Policy.
- Develop the "Safe to Spend" financial calculation logic.
- Build the React Dashboard UI (Metrics Cards, Transaction Data Table).
- Connect Dashboard UI to `GET /dashboard/summary` and `GET /transactions`.

## Sprint 3: AI Chat Integration (The Core Feature)
- Integrate the OpenAI API into the backend `AI Context Manager`.
- Implement Redis Rate Limiting on chat endpoints (Max 20/hr).
- Develop the Secure Prompting system to prevent mathematical hallucinations.
- Build the React Chat UI interface (Chat Window, Message Bubbles).
- Implement explicit Goal saving (AI long-term memory).

## Sprint 4: Polish, Security & Deployment
- Finalize the "Explore / Sandbox" Mode with dummy data.
- Conduct a Security Audit (verify OWASP mitigations like XSS/SQLi).
- Deploy PostgreSQL and Redis to a managed service (e.g., Supabase, Render).
- Deploy FastAPI backend (Render) and React frontend (Vercel).
- End-to-end user testing.

---
**Status:** Phase 15 Completed. PLANNING PHASE IS 100% COMPLETE!
