# FinPilot AI

[![System Status](https://img.shields.io/badge/System-Online-emerald?style=flat-square)](#)
[![API Version](https://img.shields.io/badge/API-v1.0-blue?style=flat-square)](#)
[![Quality Gate](https://img.shields.io/badge/Quality%20Gate-Passed-success?style=flat-square)](#)

FinPilot AI is a premium, AI-powered personal finance assistant designed with engineering excellence. It provides users with automated transaction ingestion, dynamic safe-to-spend forecasting, strict AI guardrails, and real-time category predictions—engineered to mimic production-grade systems in top-tier product-based companies.

---

## 🏗️ System Architecture

The monorepo splits into a stateless **FastAPI backend** and a modular **Vite React frontend**. Below is the architectural request flow:

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (React/Vite)
    participant API as Gateway (FastAPI)
    participant Redis as Session Cache (Redis)
    participant DB as Relational DB (PostgreSQL)
    participant Gemini as GenAI (Gemini-2.5-Flash)

    User->>API: HTTP Request (JWT Bearer Token)
    API->>Redis: Validate Session (Denylist Check)
    Redis-->>API: Session Valid
    
    rect rgb(20, 20, 40)
        note right of API: Request Handling
        alt GET /dashboard/insights
            API->>DB: Fetch Transactions & active goals
            DB-->>API: Return transaction records
            API->>Gemini: Request structured JSON insights
            Gemini-->>API: Return parsed insights JSON
            API-->>User: Return 200 OK (Insights payload)
        else POST /transactions/upload
            API->>DB: Parse CSV (Check SHA-256 Duplication)
            DB-->>API: Bulk Insert non-duplicate records
            API-->>User: Return 201 Created (Metrics)
        end
    end
```

---

## 🛠️ Tech Stack & Design Rationales

*   **FastAPI (Python 3.9+):** Chosen for its asynchronous capacity, high performance (on par with Go/NodeJS), and automatic OpenAPI documentation generation.
*   **PostgreSQL:** Selected as the primary ACID-compliant relational datastore ensuring transactional integrity for double-entry records.
*   **Redis:** Serves as a high-speed token denylist check layer, caching sessions for immediate auth verification.
*   **React 19 & Tailwind CSS v4:** Offers a lightweight rendering tree, utilizing custom glassmorphic variables and smooth transitions without layout shifts.
*   **Vite:** Sub-second hot-module reloading (HMR) and optimized rollup production bundles.
*   **Gemini 2.5 Flash:** Selected for low latency, structured JSON response capability, and low token execution cost.

---

## 💎 Core Engineering Pillars

### 1. Universal CSV Schema Mapper
Handles diverse bank statement structures dynamically. The client parses headers locally inside the browser using a `FileReader` stream, maps columns (Date, Description, Amount, Credit/Debit) via an intuitive UI overlay, and passes mappings to the API to execute matching indexing.

### 2. Transaction Idempotency & Deduplication
To prevent duplicate logs, every transaction generates a deterministic SHA-256 hash derived from the `user_id`, `date`, `amount`, `description`, and `type`. The backend performs a pre-write collision check, guaranteeing duplicate statements are skipped safely.

### 3. AI Smart Auto-Categorization (Hybrid Engine)
Implements a dual-layer categorization system:
1.  **Fast Heuristics:** Match regular expressions against common local/global keywords (e.g. Swiggy, Zomato, Starbucks, Netflix) in $<1\text{ms}$.
2.  **LLM Fallback:** Ambiguous payees invoke the AI categorizer to map them dynamically.
3.  **Manual Override:** If the user manually edits the category select dropdown, auto-guesses stand down.

### 4. Strict Chat Guardrails & Safety Controls
Restricts the conversational assistant strictly to personal budgeting queries. Irrelevant GK, coding, or chit-chat queries trigger a standard refusal response, preventing token leakage and maintaining professional focus.

### 5. Interactive Features Tour
Clicking "Explore Demo" on the login portal launches a premium slideshow guiding the user through the platform's features in detail, explaining how to utilize the AI insights, and prompting them to register a free account to persist their financial data.

---

## 🚀 Getting Started

### Prerequisites
*   Docker Desktop (running)
*   Python 3.9+
*   Node.js (v18+)

### Environment Setup
Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finpilot
REDIS_URL=redis://localhost:6379/0
GEMINI_API_KEY=your_gemini_key_here
SECRET_KEY=your_jwt_secret_key
```

### Steps to Launch Locally

1.  **Orchestrate Databases:**
    ```bash
    docker compose up -d
    ```
2.  **Backend Services:**
    ```bash
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    alembic upgrade head
    uvicorn app.main:app --reload
    ```
3.  **Frontend Application:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

---

## 🧪 Quality Gate & Testing

FinPilot enforces strict code quality using static analysis and automated test suites.

### Running Backend Tests
Execute the integration and unit tests covering manual logs, deduplication, sandbox mode, CSV mapping, and AI insights:
```bash
cd backend
PYTHONPATH=. venv/bin/python -m unittest discover tests
```

### Running Frontend Linters
Verify JavaScript code quality instantly using `oxlint` (10x faster than ESLint):
```bash
cd frontend
npm run lint
```

---

## 📅 Roadmap & Milestones

- [x] **Sprint 1: System Foundation** (FastAPI structure, PostgreSQL relations, JWT Auth with Redis Denylist).
- [x] **Sprint 2: Statement Ingestion** (CSV parsing, SHA-256 deduplication algorithms).
- [x] **Sprint 3: AI Chat Integration** (Google Gemini API context bindings, streaming support).
- [x] **Sprint 4: Vault & Budget Forecasts** (Savings Goals progressive locks, Safe-to-Spend calculations).
- [x] **Sprint 5: Cash Logs & Alerts** (Double-entry transaction allocations, budget exceeded notifications).
- [x] **Sprint 6: Universal Mapping, Auto-Categorization & Coach Insights** (Universal CSV column mappings, real-time category guessing, AI Advisor Coach, strict chat guardrails, and product slideshow).
