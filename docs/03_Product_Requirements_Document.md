# Phase 3: Product Requirements Document (PRD)

## 1. Product Objective
To build FinPilot AI, a proactive, AI-powered personal finance assistant that helps college students and working professionals manage their money, track goals, and receive conversational insights without compromising privacy or relying on overly complex interfaces.

## 2. Core User Journeys

### 2.1 The "Explore" Flow (Guest/Sandbox Mode)
- **Goal:** Allow users to explore the application's value without friction (no immediate signup or data upload required).
- **Flow:** User lands on homepage -> Clicks "Explore Demo" -> Enters a sandbox environment with pre-populated dummy transaction data -> Interacts with the AI and views the dashboard -> Is prompted to sign up to upload their own data and save progress.

### 2.2 The Main Onboarding & Core Flow
- **Goal:** Achieve rapid "Time to Value" for new users.
- **Flow:** 
  1. User signs up (OAuth/Email).
  2. Uploads their bank CSV.
  3. System parses, automatically maps (or asks for manual mapping), and categorizes transactions.
  4. User lands on the Dashboard, sees 'Total Balance' and 'Safe to Spend'.
  5. User asks the AI a question or sets a savings goal.
  6. AI provides an insight and remembers the goal for future sessions.

## 3. Success Metrics (KPIs)
To consider the MVP successful, the system must achieve the following engineering and product benchmarks:

1. **CSV Import Reliability:** 
   - Successfully imports 95%+ of valid CSV files without crashing. 
   - Detects invalid/unsupported CSV formats and provides meaningful, user-friendly error messages.
2. **Transaction Categorization:** 
   - Automatically categorizes at least 85% of transactions correctly. 
   - Allows users to manually correct categories, remembering those corrections for future imports.
3. **AI Response Quality (Hallucination Prevention):** 
   - Answers common finance-related questions accurately using *only* the user's relevant transaction data. 
   - Avoids hallucinations by relying on backend database calculations instead of letting the LLM compute financial values directly.
4. **Performance & Response Time:** 
   - Dashboard loads within 2 seconds for datasets up to 10,000 transactions. 
   - AI chat responses are generated within 5–8 seconds under normal conditions.
5. **Financial Memory:** 
   - Successfully remembers user-confirmed goals, budgets, and preferences across sessions. 
   - *Never* stores inferred personal information without explicit user confirmation.
6. **Security & Privacy:** 
   - Users can export or permanently delete all their financial data at any time. 
   - Sensitive information is encrypted; only authenticated users can access their own data.
7. **Stability:** 
   - Handles invalid inputs, duplicate CSV uploads, and OpenAI API failures gracefully without system crashes.
8. **User Experience (Time to Value):** 
   - A first-time user can sign up, upload a CSV, view transactions, ask an AI question, set a budget, and receive insights **within 10 minutes** without any external guidance.

---
**Status:** Phase 3 Completed.
