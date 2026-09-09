# FinPilot AI — Intelligent Personal Finance Studio

<div align="center">

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald?style=for-the-badge&logo=github-actions&logoColor=white)](#)
[![API Version](https://img.shields.io/badge/API-v1.0.0_Enterprise-blue?style=for-the-badge&logo=fastapi&logoColor=white)](#)
[![Test Suite](https://img.shields.io/badge/Tests-27%2F27%20Passed-success?style=for-the-badge&logo=python&logoColor=white)](#)
[![Design Language](https://img.shields.io/badge/Design-Apple%20Aesthetic-black?style=for-the-badge&logo=apple&logoColor=white)](#)
[![AI Model](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-orange?style=for-the-badge&logo=google&logoColor=white)](#)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Redis-blueviolet?style=for-the-badge&logo=postgresql&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=for-the-badge)](#)

<p align="center">
  <strong>An enterprise-grade, privacy-first personal finance operating system engineered with deterministic double-entry calculations, autonomous subscription discovery, purchase stress-testing, multi-account net worth aggregation, and resilient GenAI advisory.</strong>
</p>

[Executive Overview](#-executive-overview) • [System Architecture](#-system-architecture) • [Engineering Innovations](#-core-engineering-innovations) • [Design System](#-apple-design-language) • [API Reference](#-api-endpoints) • [Quick Start](#-quick-start) • [Test Suite](#-automated-testing--quality-gate)

</div>

---

## 🧭 Executive Overview

Most budgeting applications suffer from two fundamental flaws:
1. **Deceptive Total Balance:** They display bank balance as available money, ignoring upcoming recurring obligations (rent, subscriptions, EMIs) and long-term goal savings.
2. **AI Hallucinations:** Generic LLM budgeting bots frequently fabricate calculations, miscalculate tax rates, and drift off-topic.

**FinPilot AI** eliminates these points of failure by combining a **deterministic relational mathematical engine** with **contextual LLM advisory and strict domain guardrails**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE FINPILOT PARADIGM                                  │
├────────────────────────────────┬───────────────────────────────────────────────────────┤
│ Traditional Expense Trackers   │ FinPilot Intelligent Studio                           │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ • Raw bank balance             │ • Deterministic "Safe-to-Spend" discretionary cushion  │
│ • Manual transaction logging   │ • SHA-256 deduplicated universal CSV statement parser │
│ • Static monthly budgets       │ • "Can I Afford This?" What-If cash & EMI simulator   │
│ • Single-account view          │ • Consolidated Net Worth & Credit Card liability hub  │
│ • Generic LLM chat wrappers    │ • Resilient AI fallback queue with zero hallucination  │
└────────────────────────────────┴───────────────────────────────────────────────────────┘
```

---

## 🏗️ System Architecture

FinPilot is engineered as a high-performance decoupled monorepo featuring an asynchronous **FastAPI** backend, an ultra-fast **React 19 + Vite** frontend, **PostgreSQL** relational storage, and **Redis** for stateful token revocation.

```mermaid
flowchart TB
    subgraph Client["Frontend Client (React 19 / Vite / Tailwind)"]
        UI[Apple Design UI Layer]
        State[Auth & Session Context]
        Cards[Net Worth & Capital Allocation]
        Sim[What-If Purchase Simulator]
        Chat[Native Streaming AI Advisor]
    end

    subgraph Gateway["API Gateway (FastAPI)"]
        Router[Versioned API Routers /api/v1]
        AuthGuard[JWT & Redis Token Denylist]
        CORS[Strict CORS Middleware]
    end

    subgraph CoreEngine["Deterministic Financial Computation Engines"]
        SafeSpend["Safe-to-Spend Engine"]
        Runway["Runway & 90-Day Burn Modeler"]
        NetWorth["Net Worth & Credit Utilization"]
        Alloc["50/30/20 Capital Velocity Engine"]
        Detector["Temporal Commitment Detector"]
        WhatIf["What-If Stress Test Engine"]
    end

    subgraph DataStore["Persistence & Caching"]
        PG[(PostgreSQL 16 Engine)]
        Redis[(Redis 7 Token Denylist)]
    end

    subgraph AI["Resilient GenAI Fallback Queue"]
        G25[Gemini 2.5 Flash Primary]
        G20[Gemini 2.0 Flash Fallback]
        G15[Gemini 1.5 Flash Fallback]
        Local[Deterministic Finance Chat Fallback]
    end

    UI -->|JWT Bearer Request| Router
    Router --> AuthGuard
    AuthGuard --> Redis
    Router --> CoreEngine
    CoreEngine --> PG
    CoreEngine --> AI
    G25 -.->|429 Quota| G20
    G20 -.->|Fallback| G15
    G15 -.->|Offline| Local
```

---

## 💎 Core Engineering Innovations

### 1. Deterministic Safe-to-Spend Computation
FinPilot computes live discretionary spending power using verified relational ledger states:

$$\text{Safe To Spend} = \text{Total Liquid Capital} - \sum \text{Locked Monthly Goal Allocations} - \sum \text{Unpaid Upcoming Commitments}$$

* **Goal Locking:** Linearly amortizes active goals into exact monthly allocations based on target maturity dates.
* **Cycle Cushioning:** Upcoming recurring obligations are reserved from discretionary balance until settled by corresponding transactions within the billing cycle.

---

### 2. Autonomous Recurring Commitment Radar
FinPilot's temporal clustering engine ([commitment_service.py](file:///Users/sanskritigoswami/Developer/Finpilot/backend/app/services/commitment_service.py)) scans historical expense transactions to detect recurring bills without user input:

* **Merchant Normalization:** Sanitizes vendor names by removing terminal codes, numeric suffixes, and payment gateway hashes (e.g. `NETFLIX MUMBAI #492` $\to$ `Netflix`).
* **Temporal Interval Clustering:** Flags transactions repeating within 25–35 day intervals ($\Delta t \approx 30\text{d}$).
* **Amount Tolerance Threshold:** Validates repeating transactions within $\pm 10\%$ variance ($\frac{|A_1 - A_2|}{\max(A_1, A_2)} \le 0.10$).
* **Life Cycle Status:** Tracks real-time states (`Settled this cycle`, `Due in X days`, `Due Today`, `Overdue`).

---

### 3. Financial Runway & Cash Burn Modeling
Calculates survival duration under sudden zero-income conditions:

$$\text{Monthly Burn Rate} = \text{Monthly Fixed Commitments} + \text{Avg. 90-Day Discretionary Spend}$$

$$\text{Runway (Months)} = \frac{\text{Total Liquid Capital}}{\text{Monthly Burn Rate}}$$

| Runway Status | Duration Threshold | System Behavior |
| :--- | :--- | :--- |
| 🟢 **Healthy** | $\ge 3.0\text{ months}$ | Standard discretionary allowance |
| 🟡 **Caution** | $1.5\text{ to }3.0\text{ months}$ | Banner warning; recommends postponing luxury spend |
| 🔴 **Critical** | $< 1.5\text{ months}$ | Safe-to-spend restricted to critical necessities |

---

### 4. "Can I Afford This?" What-If Purchase Simulator
A stress-testing engine ([simulation_service.py](file:///Users/sanskritigoswami/Developer/Finpilot/backend/app/services/simulation_service.py)) evaluating prospective one-time or EMI purchases:

* **Upfront vs EMI Analysis:** Computes post-purchase liquidity, revised runway, and Safe-to-Spend impact.
* **Goal Delay Forecasting:** Determines if a purchase forces active savings vaults to extend past target dates:
  $$\Delta \text{Goal Delay} = \left\lceil \frac{\text{Purchase Impact}}{\text{Monthly Goal Allocation}} \right\rceil \text{months}$$
* **Deterministic Risk Verdicts:** Outputs structured risk ratings (`Safe to Proceed`, `Proceed with Caution`, `High Risk — Postpone Purchase`).

---

### 5. Multi-Account & Consolidated Net Worth Aggregator
Aggregates checking, savings, investment portfolios, credit cards, and loans into a unified net worth ledger ([networth_service.py](file:///Users/sanskritigoswami/Developer/Finpilot/backend/app/services/networth_service.py)):

$$\text{Total Assets} = \sum(\text{Checking} + \text{Savings} + \text{Cash}) + \sum(\text{Equities} + \text{Mutual Funds} + \text{FDs})$$

$$\text{Total Liabilities} = \sum(\text{Credit Card Dues}) + \sum(\text{Term Loans})$$

$$\text{Net Worth} = \text{Total Assets} - \text{Total Liabilities}$$

* **Credit Card Utilization Ratio:**
  $$\text{Credit Utilization} = \frac{\sum(\text{Credit Card Outstandings})}{\sum(\text{Credit Card Limits})} \times 100$$
  * $\le 30\%$ $\to$ **Optimal / Healthy** (Emerald)
  * $30\% - 50\%$ $\to$ **Moderate** (Amber)
  * $> 50\%$ $\to$ **High Risk** (Rose)

---

### 6. 50/30/20 Capital Allocation & Spending Velocity
Implements classic macro budgeting with live transaction velocity monitoring ([analytics_service.py](file:///Users/sanskritigoswami/Developer/Finpilot/backend/app/services/analytics_service.py)):

* **Needs (50%):** Housing, Utilities, Groceries, Healthcare, Debt service.
* **Wants (30%):** Dining, Entertainment, Travel, Shopping.
* **Investments & Savings (20%):** Mutual Funds, Equities, Goal Vault deposits.
* **Daily Spending Velocity:** Tracks actual daily spend rate against optimal target velocity to prevent month-end budget exhaustion.

---

### 7. Resilient Multi-Model GenAI Architecture
The AI advisory pipeline ([ai_service.py](file:///Users/sanskritigoswami/Developer/Finpilot/backend/app/services/ai_service.py)) utilizes a multi-model fallback queue with local deterministic failover:

1. Primary: `gemini-2.5-flash`
2. Fallback 1: `gemini-2.0-flash`
3. Fallback 2: `gemini-1.5-flash`
4. Fallback 3: `gemini-1.5-pro`
5. Final Offline Failover: `_local_deterministic_finance_chat` (Generates instant mathematical responses when API quotas are depleted).

---

## 🎨 Apple Design Language

FinPilot adheres strictly to Apple's modern web aesthetic standards:

| Aesthetic Dimension | Specification Standard |
| :--- | :--- |
| **Color Philosophy** | Monochromatic canvas (`#101012`, `#161617`, `#1d1d1f`) with a single Action Blue accent (`#0066cc`, hover `#0071e3`). Zero visual rainbow clutter. |
| **Typography** | Apple SF Pro typography stack with negative letter-spacing (`tracking-[-0.035em]` on hero metrics, `-0.015em` on UI tags). |
| **Frosted Glass** | Edge-to-edge backdrop-blur sub-navigation (`backdrop-blur-xl bg-[#101012]/80`) with micro-borders (`border-white/[0.08]`). |
| **Chassis Geometry** | Studio cards with `rounded-[22px]` and `rounded-[18px]` utility containers; pills with `rounded-full`. |
| **Micro-Interactions** | Tactile press states (`active:scale-[0.96] transition-transform duration-100`). |

---

## 🔌 API Endpoints

### 🔐 Authentication & Session (`/api/v1/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Register user account with bcrypt password hashing |
| `POST` | `/login` | Authenticate and issue signed JWT access token |
| `POST` | `/sandbox` | Create ephemeral demo sandbox session with pre-populated ledger |
| `POST` | `/logout` | Revoke JWT token and append signature to Redis denylist |

### 📊 Dashboard & Insights (`/api/v1/dashboard`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/summary` | Retrieve aggregated balance, locked goals, unpaid bills, safe-to-spend, and runway |
| `POST` | `/opening-balance` | Calibrate base liquid checking balance |
| `GET` | `/insights` | Generate structured Gemini AI budget insights and coaching tips |

### 💳 Accounts & Net Worth (`/api/v1/accounts`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List all connected accounts (checking, savings, investments, credit cards, loans) |
| `POST` | `/` | Provision new account with custom balance or credit limit |
| `GET` | `/summary` | Retrieve real-time Net Worth breakdown and credit card utilization |
| `PUT` | `/{id}` | Update account balances, credit limits, or primary status |
| `DELETE` | `/{id}` | Remove connected account |

### 🔮 What-If Purchase Simulator (`/api/v1/simulator`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/evaluate` | Stress-test upfront cash or EMI purchase against runway and goals |

### 📅 Fixed Commitments & Bill Radar (`/api/v1/commitments`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List all fixed obligations with live due date annotations |
| `POST` | `/` | Create manual recurring commitment (Rent, EMI, Utilities) |
| `POST` | `/detect` | Trigger automated recurring pattern detector on historical ledger |
| `DELETE` | `/{id}` | Remove commitment |

### 📈 50/30/20 Capital Allocation (`/api/v1/analytics`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/capital-allocation` | Compute 50/30/20 distribution, spending velocity, and category breakdowns |

### 🧾 Transactions & CSV Ingestion (`/api/v1/transactions`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Paginated transaction list with category and date filters |
| `POST` | `/` | Create single manual income or expense entry |
| `POST` | `/upload` | Ingest parsed bank CSV records with SHA-256 deduplication |
| `DELETE` | `/{id}` | Delete transaction record |

### 🎯 Savings Goals (`/api/v1/goals`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Fetch active and completed savings target vaults |
| `POST` | `/` | Establish new savings target with maturity date |
| `PUT` | `/{id}` | Deposit or withdraw capital into goal vault |
| `DELETE` | `/{id}` | Remove savings vault |

---

## ⚡ Getting Started

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

### 2. Start PostgreSQL & Redis Services
```bash
docker compose up -d
```

### 3. Start Backend API Server
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
> Swagger Interactive Documentation: `http://localhost:8000/docs`

### 4. Start Frontend Studio
```bash
cd frontend
npm install
npm run dev
```
> Application UI: `http://localhost:5173`

---

## 🧪 Automated Testing & Quality Gate

FinPilot maintains an end-to-end automated test suite verifying deterministic calculation precision, deduplication, user tenant isolation, and threshold accuracy.

### Execute Backend Unit Tests
```bash
cd backend
PYTHONPATH=. ./venv/bin/python -m unittest discover tests
```

#### Test Suite Matrix
```text
test_accounts.py
  ├── test_default_account_auto_provisioning         [PASSED]
  ├── test_create_and_primary_toggle                [PASSED]
  ├── test_deterministic_net_worth_calculation      [PASSED]
  ├── test_credit_card_utilization_thresholds       [PASSED]
  └── test_account_update_and_delete                [PASSED]
test_commitments.py
  ├── test_recurring_detection_algorithm             [PASSED]
  ├── test_upcoming_fixed_expenses_and_safe_to_spend   [PASSED]
  ├── test_paid_commitment_deduction_in_cycle       [PASSED]
  └── test_financial_runway_calculation              [PASSED]
test_simulator.py
  ├── test_simulator_affordable_scenario            [PASSED]
  ├── test_simulator_unaffordable_scenario          [PASSED]
  └── test_simulator_emi_scenario                   [PASSED]
test_manual_transactions.py
  ├── test_create_manual_expense                     [PASSED]
  ├── test_create_manual_income                      [PASSED]
  ├── test_duplicate_transaction_validation          [PASSED]
  └── test_user_isolation                            [PASSED]
test_categorization.py                               [PASSED]
test_csv_mapping.py                                  [PASSED]
test_insights.py                                     [PASSED]
test_sandbox.py                                      [PASSED]

Ran 27 tests in 0.386s — OK (100% Passing)
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
- [x] **Phase 7: "Can I Afford This?" What-If Simulator** (Cash flow stress testing, goal delay forecasting, EMI analysis).
- [x] **Phase 8: Multi-Account & Net Worth Aggregator** (Bank accounts, investments, and credit card liability manager).

---

## 📄 License

FinPilot AI is open-source software licensed under the **MIT License**.
