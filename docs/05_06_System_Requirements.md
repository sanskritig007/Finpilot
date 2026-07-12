# Phase 5 & 6: System Requirements

This document outlines the strict engineering rules (Functional and Non-Functional) that the system must follow. This ensures the codebase is secure, scalable, and professional.

## Phase 5: Functional Requirements (FR)

### FR1: Authentication & Authorization
- **FR 1.1:** The system SHALL hash all user passwords using `bcrypt` with a minimum salt round of 10 before storing them in the PostgreSQL database.
- **FR 1.2:** The system SHALL generate a JSON Web Token (JWT) upon successful login, with a strict expiration time of 1 hour.
- **FR 1.3:** The system SHALL support OAuth 2.0 (Google) and map the authenticated email to the internal user profile securely.

### FR2: Data Ingestion (CSV Processing)
- **FR 2.1:** The system SHALL parse uploaded `.csv` files and validate headers against standard banking templates.
- **FR 2.2:** The system SHALL automatically ignore entirely blank rows or malformed rows without crashing the import process.
- **FR 2.3:** The system SHALL provide a fallback mapping endpoint if automatic parsing confidence falls below 90%.

### FR3: AI Chat & Function Calling
- **FR 3.1:** The AI module SHALL NOT perform mathematical calculations. Instead, it SHALL use "Function Calling" (or specific backend tools) to trigger backend calculation endpoints, ensuring 100% math accuracy.
- **FR 3.2:** The system SHALL inject a strict System Prompt limiting the AI to personal finance topics. If a user asks a non-finance question, the AI SHALL return a predefined refusal string.
- **FR 3.3:** The AI SHALL explicitly ask for a boolean confirmation before writing any "Goal" to the Long-Term Memory (Database).

### FR4: Financial Logic & Memory
- **FR 4.1:** The system SHALL calculate the "Safe to Spend" metric as: `(Total Bank Balance) - (Sum of Active Savings Goals) - (Sum of upcoming recurring expenses)`.
- **FR 4.2:** User goals SHALL be stored in a dedicated PostgreSQL table linked via Foreign Key to the User ID.

---

## Phase 6: Non-Functional Requirements (NFR)

### NFR1: Security & Privacy (Day-1 Priority)
- **NFR 1.1:** The system SHALL use SQLAlchemy ORM to prevent SQL Injection attacks.
- **NFR 1.2:** The frontend SHALL sanitize all user inputs to prevent Cross-Site Scripting (XSS).
- **NFR 1.3:** The system SHALL NEVER expose the entire transaction history to the LLM API. Only the relevant transactions retrieved via database querying or RAG SHALL be sent in the prompt context.
- **NFR 1.4:** The system SHALL provide a "Delete Account" endpoint that hard-deletes the user's profile and cascades deletion to all their transactions and goals (GDPR/DPDP compliance).

### NFR2: Performance & Scalability
- **NFR 2.1:** The API SHALL return Dashboard data in under 2 seconds for accounts with up to 10,000 transactions.
- **NFR 2.2:** Database queries involving transactions SHALL use indexing on `user_id` and `date` columns to ensure rapid retrieval.
- **NFR 2.3:** The FastAPI backend SHALL remain completely stateless, allowing horizontal scaling via Docker containers. Session state and rate limiting SHALL be handled by Redis.

### NFR3: Maintainability & Code Quality
- **NFR 3.1:** The backend SHALL follow Clean Architecture principles (Separation of Routes, Controllers, Services, and Repositories).
- **NFR 3.2:** The codebase SHALL maintain a minimum of 80% test coverage using `pytest`.

---
**Status:** Phases 5 & 6 Completed.
