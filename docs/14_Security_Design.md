# Phase 14: Security Design

Because FinPilot AI handles sensitive financial data, Security and Privacy are treated as Tier-1 features. This document outlines how the system mitigates standard OWASP Top 10 vulnerabilities, LLM-specific threats, and enforces strict data privacy.

## 1. Authentication & Authorization Security
- **JWT (JSON Web Tokens):** 
  - All protected endpoints require a valid JWT passed in the `Authorization: Bearer` header.
  - Tokens have a strict 1-hour expiration.
  - The JWT secret is injected via environment variables (`.env`) and never hardcoded in the repository.
- **Password Hashing:**
  - Raw passwords are NEVER stored. They are hashed using `bcrypt` with a minimum salt round of 10.
- **Horizontal Privilege Escalation Protection:**
  - API endpoints strictly validate that the `user_id` inside the JWT matches the `user_id` of the resource being requested (e.g., a user cannot query another user's transactions by changing the ID in the URL).

## 2. OWASP Top 10 Mitigations
- **SQL Injection (SQLi):** 
  - Mitigated by strictly using SQLAlchemy ORM for all database interactions. No raw SQL strings are concatenated or executed.
- **Cross-Site Scripting (XSS):** 
  - Mitigated by React.js automatically escaping dynamic content. Any manual DOM manipulation (e.g., `dangerouslySetInnerHTML`) is strictly prohibited.
- **Cross-Site Request Forgery (CSRF):** 
  - Mitigated by using Bearer Tokens (JWT) instead of session cookies for API authentication.
- **Rate Limiting (DDoS & Brute Force Protection):** 
  - Redis limits `POST /api/v1/auth/login` and `POST /api/v1/ai/chat` endpoints to prevent password brute-forcing and OpenAI API billing exhaustion.

## 3. Data Privacy & Encryption
- **Data in Transit:** 
  - All communication between Client, Gateway, and Backend happens strictly over HTTPS (TLS 1.2+).
- **Zero-Retention Policy for Files:** 
  - Uploaded `.csv` bank statements are parsed entirely in-memory on the backend and immediately discarded. No physical files are stored on disk.
- **Right to be Forgotten (GDPR/DPDP Principle):** 
  - A user can trigger a "Hard Delete" of their account, cascading to permanently wipe all transactions, goals, and history from the PostgreSQL database.

## 4. LLM Security (OWASP for LLMs)
- **Prompt Injection Prevention:** 
  - System prompts are hardcoded on the backend and immutably prepended to the user's message. 
  - The AI is given explicit instructions to refuse queries that attempt to manipulate its core directive (e.g., "Ignore all previous instructions...").
- **Overreliance on AI (Math Hallucinations):** 
  - The LLM is restricted from performing mathematical aggregations. Financial logic (e.g., Total Spend) is computed via PostgreSQL/FastAPI and provided to the LLM purely as context strings.
- **Data Leakage (Data Minimization):** 
  - Instead of sending the entire transaction history to OpenAI, the backend filters and sends *only* the specific transactions relevant to the user's query (e.g., only "Food" transactions for the current month).

---
**Status:** Phase 14 Completed.
