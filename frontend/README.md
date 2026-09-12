# FinPilot AI — Frontend Client Studio

<div align="center">

[![React Version](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](#)
[![Vite](https://img.shields.io/badge/Vite-8.1.5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
[![Design System](https://img.shields.io/badge/Design-Apple%20Human%20Interface-000000?style=for-the-badge&logo=apple&logoColor=white)](#)
[![Bundle Size](https://img.shields.io/badge/Bundle-~400kB%20(Gzip%20113kB)-emerald?style=for-the-badge)](#)

<p align="center">
  <strong>The web client for FinPilot AI — an Apple-inspired, ultra-responsive personal finance dashboard engineered with React 19, native Fetch streaming, and client-side statement processing.</strong>
</p>

</div>

---

## 🎨 Design Philosophy: Apple Human Interface

The FinPilot frontend strictly adheres to modern Cupertino industrial design guidelines:

* **Monochromatic Slate Canvas:** Background tones (`#101012`, `#161617`, `#1d1d1f`) eliminate eye fatigue and reduce visual clutter.
* **Curated Action Blue:** `#0066cc` (hover `#0071e3`) acts as the sole primary interactive hue.
* **Negative Letter-Spacing:** `tracking-[-0.035em]` applied across hero typography and numeric ledgers for a compact, editorial appearance.
* **Edge-to-Edge Frosted Overlays:** `backdrop-blur-xl` glass headers with `border-white/[0.08]` borders.
* **Chassis Curvature:** `rounded-[22px]` studio cards and `rounded-full` pill badges.
* **Tactile Micro-Interactions:** `active:scale-[0.96]` dynamic press states.

---

## 🧩 Feature Component Architecture

```
frontend/src/
├── core/
│   └── api.js                       # Central Axios instance with JWT interceptors & token injection
├── features/
│   ├── accounts/
│   │   ├── NetWorthCard.jsx         # Consolidated Net Worth, 4-pillar assets/liabilities & credit utilization
│   │   └── AccountsManagerModal.jsx # Apple Wallet style multi-account ledger & card manager
│   ├── analytics/
│   │   └── CapitalAllocationCard.jsx# 50/30/20 macro budget distribution & daily spend velocity gauge
│   ├── auth/
│   │   ├── AuthContext.jsx          # Session state, JWT storage, sandbox bootstrap & logout
│   │   ├── AuthView.jsx             # Minimalist auth gateway with toggleable sign-in / registration
│   │   └── DemoTourModal.jsx        # 4-slide interactive product walkthrough & onboarding
│   ├── chat/
│   │   └── ChatWidget.jsx           # Floating Gemini AI assistant with native streaming fetch
│   ├── commitments/
│   │   ├── CommitmentsList.jsx      # Recurring bills list with automated cycle detection
│   │   └── AddCommitmentModal.jsx   # Modal for provisioning manual rent, EMI, or subscription bills
│   ├── dashboard/
│   │   ├── DashboardView.jsx        # Main cockpit layout & sub-navigation header
│   │   ├── AICoachCard.jsx          # AI insights editorial tile
│   │   └── SettingsModal.jsx        # Account preferences, balance calibration & data reset
│   ├── goals/
│   │   ├── GoalsList.jsx            # Savings vaults with dynamic monthly recommendation
│   │   └── AddGoalModal.jsx         # Target amount & date goal provisioning modal
│   ├── notifications/
│   │   ├── NotificationCenter.jsx   # Frosted notification bell popover with 1-click settlement
│   │   └── UpcomingBillBanner.jsx   # Urgent 3-day bill radar notification banner
│   ├── simulator/
│   │   └── WhatIfSimulatorModal.jsx # "Can I Afford This?" cash vs EMI purchase stress tester
│   └── transactions/
│       ├── TransactionList.jsx      # Searchable, filterable double-entry transaction ledger
│       ├── AddTransactionModal.jsx  # Single manual transaction entry
│       └── UploadModal.jsx          # Bank statement CSV parser with client-side column mapper
├── App.jsx                          # Root router & authentication gatekeeper
├── index.css                        # Design tokens, Apple typography, custom animations
└── main.jsx                         # Application entrypoint
```

---

## 🚀 Key Client Capabilities

### 1. "Can I Afford This?" What-If Simulator (`WhatIfSimulatorModal.jsx`)
* Allows users to input planned purchases (e.g., ₹85,000 for a laptop) with upfront cash or 3–24 month No-Cost EMI options.
* Stress-tests post-purchase liquidity against emergency runway and forecasts exact completion delays on active goal vaults.

### 2. Multi-Account & Net Worth Hub (`NetWorthCard.jsx` & `AccountsManagerModal.jsx`)
* Consolidates Bank Accounts, Demat Portfolios, Mutual Funds, Credit Cards, and Personal/Home Loans.
* Computes real-time **Credit Card Utilization Ratio** with color-coded risk status badges ($\le 30\%$ Optimal, $30-50\%$ Moderate, $>50\%$ High Risk).

### 3. 50/30/20 Capital Allocation & Velocity (`CapitalAllocationCard.jsx`)
* Classifies expenses into **Needs (50%)**, **Wants (30%)**, and **Investments/Savings (20%)**.
* Monitors daily cash burn rate against safe monthly budget thresholds to prevent month-end overspending.

### 4. Native SSE Streaming Chat (`ChatWidget.jsx`)
* Built with native `fetch` and `ReadableStreamDefaultReader` for real-time word-by-word Gemini streaming.
* Zero external heavy streaming dependencies (keeps overall bundle under 400kB).

### 5. Universal CSV Ingestion (`UploadModal.jsx`)
* Client-side CSV header mapper compatible with statements from any major bank (HDFC, ICICI, SBI, Axis, etc.).
* Computes deterministic SHA-256 hashes per row to prevent duplicate transaction entries.

### 6. Interactive Demo Tour & Ephemeral Sandbox (`DemoTourModal.jsx`)
* 4-step visual onboarding tour explaining Safe-to-Spend, Smart Goals, and AI queries.
* 1-click **Sandbox Mode** allowing instant testing without creating a real account.

---

## 🛠️ Development & Build Commands

### Install Dependencies
```bash
npm install
```

### Start Development Server (Vite HMR)
```bash
npm run dev
```
> Client running locally at: `http://localhost:5173`

### Production Build
```bash
npm run build
```
> Compiles static assets to `dist/` with optimized chunk splitting and CSS minification in `< 350ms`.

### Preview Production Build
```bash
npm run preview
```

---

## ⚙️ Environment Configuration

By default, Vite proxies backend requests to `http://localhost:8000/api/v1`. To point to a remote backend API, create a `.env` file in the `frontend/` root:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 📄 License
FinPilot Frontend is open-source software released under the **MIT License**.
