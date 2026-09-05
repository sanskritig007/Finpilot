# FinPilot AI — Intelligent Personal Finance Studio

<div align="center">

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald?style=for-the-badge&logo=github-actions&logoColor=white)](#)
[![API Version](https://img.shields.io/badge/API-v1.0.0_Enterprise-blue?style=for-the-badge&logo=fastapi&logoColor=white)](#)
[![Test Suite](https://img.shields.io/badge/Tests-16%2F16%20Passed-success?style=for-the-badge&logo=python&logoColor=white)](#)
[![Design Language](https://img.shields.io/badge/Design-Apple%20Aesthetic-black?style=for-the-badge&logo=apple&logoColor=white)](#)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Redis-blueviolet?style=for-the-badge&logo=postgresql&logoColor=white)](#)

<p align="center">
  <strong>An enterprise-grade, privacy-first personal finance platform engineered with deterministic mathematical computation, autonomous subscription discovery, financial runway forecasting, and contextual GenAI advisory.</strong>
</p>

[Architecture](#-system-architecture) • [Engineering Pillars](#-core-engineering-innovations) • [Design System](#-apple-design-language) • [API Reference](#-api-endpoints) • [Quick Start](#-quick-start) • [Quality Gate](#-automated-testing--quality-gate)

</div>

---

## 🧭 Executive Overview

FinPilot is engineered to eliminate the uncertainty in personal cash flow management. Unlike traditional expense trackers that merely record past historical expenditures or generic AI wrappers that hallucinate calculations, FinPilot combines **strict double-entry relational integrity**, **deterministic algorithmic forecasting**, and **context-aware LLM advisory**.

### Key Value Propositions
* **100% Deterministic Safe-to-Spend:** Calculates live discretionary spending limits by locking monthly savings goals and auto-reserving upcoming recurring obligations.
* **Autonomous Recurring Commitment Radar:** Identifies repeating subscriptions (Netflix, Spotify, Rent, EMIs, WiFi) without manual user intervention using temporal interval clustering.
* **Survival Runway Engine:** Models monthly fixed + discretionary cash burn to compute the exact liquid survival runway in months.
* **Apple Human Interface Aesthetic:** Designed with museum-grade typography, negative tracking, frosted sub-navigation, and a unified monochromatic Action Blue CTA hierarchy.
* **Strict Guardrails & Zero Hallucination:** Financial advisory is backed by verified relational ledger states, strictly refusing off-topic queries.

---

## 🏗️ System Architecture

FinPilot is designed as a decoupled, microservices-ready monorepo consisting of an asynchronous **FastAPI backend** and a high-performance **Vite React frontend**, backed by **PostgreSQL** and **Redis**.

```mermaid
flowchart TB
    subgraph Client["Frontend Client (React 19 / Vite / Tailwind)"]
        UI[Apple Design UI Layer]
        State[Auth & Session Context]
        WS[Chat & Notification Center]
    end

    subgraph Gateway["API Gateway (FastAPI)"]
        Router[API v1 Routers]
        AuthGuard[JWT & Redis Token Denylist]
        RateLimiter[Sliding Window Rate Limiter]
    end

    subgraph CoreEngine["Financial Computation Engine"]
        SafeSpend["Safe-to-Spend Calculator"]
        Runway["Runway & Burn Modeling"]
        Detector["Recurring Pattern Detector"]
        Categorizer["Hybrid ML Categorizer"]
    end

    subgraph DataStore["Data & Persistence Layer"]
        PG[(PostgreSQL Relational DB)]
        Redis[(Redis Cache & Session Store)]
    end

    subgraph AI["GenAI Advisory Layer"]
        Gemini["Google Gemini 2.5 Engine"]
        Guardrails["Financial Domain Guardrails"]
    end

    UI -->|JWT Bearer Request| Router
    Router --> AuthGuard
    AuthGuard --> Redis
    Router --> RateLimiter
    Router --> CoreEngine
    CoreEngine --> PG
    CoreEngine --> AI
    AI --> Guardrails
    Guardrails --> Gemini
```

---

## 💎 Core Engineering Innovations

### 1. Deterministic Safe-to-Spend Computation
Traditional apps display total bank balance, leading to deceptive purchasing comfort. FinPilot executes a deterministic ledger formula across accounts, active goals, and cycle commitments:

$$\text{Safe To Spend} = \text{Total Liquid Balance} - \sum \text{Locked Goal Contributions} - \sum \text{Unpaid Upcoming Commitments}$$

* **Goal Locking:** Amortizes long-term savings goals into exact monthly allocations based on maturity dates.
* **Cycle Cushioning:** Upcoming fixed commitments are reserved until settled by matching transactions in the current billing cycle.

---

### 2. Autonomous Recurring Commitment Discovery
FinPilot features an automated subscription and bill detection algorithm ([commitment_service.py](file:///Users/sanskritigoswami/Developer/Finpilot/backend/app/services/commitment_service.py)) that scans expense transactions for periodic cycles:

* **Merchant Normalization:** Regex filters strip transaction IDs, locations, and terminal codes (e.g. `NETFLIX MUMBAI #492` $\to$ `Netflix`).
* **Temporal Interval Clustering:** Analyzes timestamps between consecutive transactions for a 25–35 day interval ($\Delta t \approx 30\text{d}$).
* **Amount Variance Threshold:** Validates transaction amounts within a $\pm 10\%$ variance limit ($\frac{|A_1 - A_2|}{\max(A_1, A_2)} \le 0.10$).
* **Cycle Tracking:** Automatically annotates commitments as `Settled`, `Due in X days`, `Due Today`, or `Overdue`.

---

### 3. Financial Runway & Burn Rate Engine
Models liquidity duration under zero-income scenarios:

$$\text{Monthly Burn Rate} = \text{Monthly Fixed Obligations} + \text{Avg. 90-Day Discretionary Spend}$$

$$\text{Runway (Months)} = \frac{\text{Total Liquid Capital}}{\text{Monthly Burn Rate}}$$

* **Health Classification:**
  * 🟢 **Healthy:** $\ge 3.0\text{ months}$
  * 🟡 **Caution:** $1.5\text{ to }3.0\text{ months}$
  * 🔴 **Critical:** $< 1.5\text{ months}$

---

### 4. Transaction Idempotency & SHA-256 Deduplication
To prevent duplicate records from multiple bank CSV uploads or concurrent clicks, every transaction generates a deterministic cryptographic hash:

$$\text{Hash} = \text{SHA256}(\text{user\_id} \mathbin{\Vert} \text{date} \mathbin{\Vert} \text{amount} \mathbin{\Vert} \text{description} \mathbin{\Vert} \text{type})$$

Database collisions trigger a silent skip or idempotent update, guaranteeing zero data pollution.

---

### 5. Hybrid Two-Tier Categorization Engine
1. **Tier-1 Fast Heuristics ($<1\text{ms}$):** Normalized keyword regex matching for hundreds of common merchants (Swiggy, Zomato, Uber, Netflix, Amazon, etc.).
2. **Tier-2 LLM Fallback:** Unrecognized or unstructured transaction narratives invoke Gemini with strict category schemas.
3. **User Override Persistence:** Manual user adjustments override algorithmic guesses permanently.

---

### 6. Notification Center & Real-Time Bill Radar
* **Top-Level Radar Banner:** Displays an urgent notification when bills are due in $\le 3\text{ days}$ or overdue, showing the exact amount reserved from Safe-to-Spend.
* **Apple Frosted Notification Popover:** Header bell icon with an unread badge counter and 1-click **"Mark Settled"** capability.

---

## 🎨 Apple Design Language

FinPilot adheres strictly to Apple's modern web aesthetic:

| Design Element | Implementation Standard |
| :--- | :--- |
| **Color Philosophy** | Monochromatic canvas (`#101012`, `#161617`, `#1d1d1f`) with a single Action Blue accent (`#0066cc`, hover `#0071e3`). Zero rainbow gradients. |
| **Typography** | Apple SF Pro font stack with negative letter-spacing (`tracking-[-0.035em]` on heroes, `-0.015em` on UI labels). |
| **Elevation & Glass** | Edge-to-edge frosted glass sub-nav (`backdrop-blur-xl bg-[#101012]/80`) with delicate `border-white/[0.08]`. |
| **Chassis Geometry** | Studio cards with `rounded-[22px]` and `rounded-[18px]` utility containers; pill buttons with `rounded-full`. |
| **Micro-Interactions** | Tactile press states (`active:scale-[0.96] transition-transform duration-100`). |

---

## 🔌 API Endpoints

### Authentication & Session (`/api/v1/auth`)
* `POST /register` — Register user account with bcrypt password hashing.
* `POST /login` — Authenticate and issue JWT access token.
* `POST /sandbox` — Create ephemeral demo sandbox session with seed data.
* `POST /logout` — Revoke token and append to Redis denylist.

### Financial Summary (`/api/v1/dashboard`)
* `GET /summary` — Retrieve aggregated balance, locked goals, unpaid bills, safe-to-spend, and runway metrics.
* `POST /opening-balance` — Calibrate starting liquid checking balance.
* `GET /insights` — Generate structured Gemini AI budget insights and coaching tips.

### Fixed Commitments (`/api/v1/commitments`)
* `GET /` — List all fixed obligations with live due date annotations.
* `POST /` — Create manual recurring commitment (Rent, EMI, Utilities).
* `DELETE /{id}` — Delete commitment.
* `POST /detect` — Trigger automated recurring transaction scan on historical ledger.

### Transactions & CSV Ingestion (`/api/v1/transactions`)
* `GET /` — Paginated transaction list with category filters.
* `POST /` — Create single manual income/expense entry.
* `POST /upload` — Ingest parsed bank CSV records with SHA-256 deduplication.
* `DELETE /{id}` — Delete transaction record.

### Savings Goals (`/api/v1/goals`)
* `GET /` — Fetch active and completed savings vaults.
* `POST /` — Establish a new savings target with maturity date.
* `PUT /{id}` — Deposit/withdraw capital into goal vault.
* `DELETE /{id}` — Cancel/remove vault.

---

## 🚀 Quick Start

### Prerequisites
* **Docker Desktop** (running)
* **Python 3.9+**
* **Node.js 18+**

### 1. Clone & Configure Environment
```bash
git clone https://github.com/sanskritig007/Finpilot.git
cd Finpilot
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finpilot
REDIS_URL=redis://localhost:6379/0
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_jwt_secret_key_32_chars_min
```

### 2. Start Infrastructure (PostgreSQL & Redis)
```bash
docker compose up -d
```

### 3. Launch Backend API
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
> Backend API Swagger Docs live at: `http://localhost:8000/docs`

### 4. Launch Frontend Studio
```bash
cd frontend
npm install
npm run dev
```
> Frontend Application live at: `http://localhost:5173`

---

## 🧪 Automated Testing & Quality Gate

FinPilot maintains an automated test suite verifying financial calculation precision, duplicate prevention, tenant isolation, and recurring detection.

### Run Backend Unit Tests
```bash
cd backend
PYTHONPATH=. ./venv/bin/python -m unittest discover tests
```

#### Test Matrix Coverage
```text
test_commitments.py
  ├── test_recurring_detection_algorithm           [PASSED]
  ├── test_upcoming_fixed_expenses_and_safe_to_spend [PASSED]
  ├── test_paid_commitment_deduction_in_cycle     [PASSED]
  └── test_financial_runway_calculation            [PASSED]
test_manual_transactions.py
  ├── test_create_manual_expense                   [PASSED]
  ├── test_create_manual_income                    [PASSED]
  ├── test_duplicate_transaction_validation        [PASSED]
  └── test_user_isolation                          [PASSED]
test_categorization.py                             [PASSED]
test_csv_mapping.py                                [PASSED]
test_insights.py                                   [PASSED]
test_sandbox.py                                    [PASSED]

Ran 16 tests in 0.334s — OK (100% Passing)
```

### Run Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 🗺️ Engineering Roadmap

- [x] **Phase 1: Core Ledger & Auth** (PostgreSQL schema, JWT authentication, Redis denylist).
- [x] **Phase 2: Universal Statement Ingestion** (Client-side CSV header mapper, SHA-256 idempotency).
- [x] **Phase 3: GenAI Advisory & Guardrails** (Gemini 2.5 Flash, structured JSON coaching, context injection).
- [x] **Phase 4: Apple Design Language Revamp** (Studio cards, frosted sub-nav, negative typography tracking).
- [x] **Phase 5: Fixed Commitments & Runway Engine** (Recurring bill auto-detector, runway modeling, Safe-to-Spend reservation).
- [x] **Phase 6: In-App Notification Center & Bill Radar** (Upcoming bill radar banner, frosted popover, quick settlement).
- [ ] **Phase 7: "Can I Afford This?" What-If Simulator** (Cash flow stress testing, goal delay forecasting, EMI analysis).
- [ ] **Phase 8: Multi-Account & Net Worth Aggregator** (Bank accounts, investments, and credit card liability manager).

---

## 📄 License
FinPilot AI is released under the **MIT License**.
