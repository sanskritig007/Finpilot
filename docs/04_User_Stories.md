# Phase 4: User Stories & Acceptance Criteria

This document translates the Product Requirements (PRD) into actionable development tasks from the perspective of the end-user.

## Epic 1: Onboarding & Authentication
**US 1.1: Google OAuth Signup**
- **Story:** As a new user, I want to sign up using my Google account so that I can access the platform quickly without creating a new password.
- **Acceptance Criteria:**
  - "Sign in with Google" button is present.
  - Successfully creates a user profile in the database upon first login.
  - Generates a secure JWT token for API authentication.

**US 1.2: Standard Email Registration**
- **Story:** As a privacy-conscious user, I want to register using my email and a secure password so that my account is not linked to third-party providers.
- **Acceptance Criteria:**
  - Password must be hashed (e.g., bcrypt) before database storage.
  - Basic password strength validation is enforced.

## Epic 2: The "Explore" Sandbox Mode
**US 2.1: Guest Access**
- **Story:** As a prospective user, I want to explore a demo version of the app without signing up so that I can see its value first.
- **Acceptance Criteria:**
  - Clicking "Explore Demo" redirects to a sandbox dashboard.
  - Sandbox is pre-populated with 50-100 dummy transactions.
  - State changes in the sandbox are strictly local and reset upon refresh.

## Epic 3: Data Ingestion (Transactions)
**US 3.1: CSV Upload**
- **Story:** As an authenticated user, I want to upload my bank's CSV statement so that the system can analyze my financial history.
- **Acceptance Criteria:**
  - Only `.csv` file format is accepted.
  - Implements a maximum file size limit (e.g., 5MB).
  - Progress indicator displays during upload and processing.

**US 3.2: CSV Column Mapping Fallback**
- **Story:** As a user uploading an unrecognized CSV format, I want to manually map the columns (Date, Amount, Info) so that my transactions are parsed correctly.
- **Acceptance Criteria:**
  - UI displays a dropdown above the first 3 rows of the CSV to map standard fields.
  - Saves mapping preferences linked to the user's account for future uploads.

**US 3.3: Manual Expense Entry**
- **Story:** As a user, I want to manually log a single cash transaction from the UI so that unrecorded expenses are still tracked.
- **Acceptance Criteria:**
  - Simple modal capturing Date, Amount, Description, and Category.

## Epic 4: Dashboard & Analytics
**US 4.1: "Safe to Spend" Metric**
- **Story:** As a user, I want to see a "Safe to Spend" number on my dashboard so that I know exactly how much I can spend today without breaking my goals.
- **Acceptance Criteria:**
  - Metric strictly calculates: `(Total Balance) - (Active Savings Goals) - (Upcoming Fixed Expenses)`.

**US 4.2: Transactions Data Table**
- **Story:** As a user, I want to see a list of my transactions sorted by date so that I can review my spending.
- **Acceptance Criteria:**
  - Includes pagination or infinite scroll for performance.
  - Allows manual editing of the auto-assigned category.

## Epic 5: AI Chat & Long-Term Memory
**US 5.1: Context-Aware Chat**
- **Story:** As a user, I want to ask the AI questions about my spending (e.g., "How much did I spend on food this month?") so that I get immediate insights.
- **Acceptance Criteria:**
  - AI responds within 5-8 seconds.
  - Backend performs the math; AI only formats the final answer (Preventing hallucinations).

**US 5.2: Explicit Memory (Goal Setting)**
- **Story:** As a user, I want to tell the AI to remember a savings goal conversationally so that it tracks my progress.
- **Acceptance Criteria:**
  - AI asks for confirmation before saving the goal.
  - Confirmed goals are saved in the PostgreSQL database and immediately reflect in the "Safe to Spend" calculation.

---
**Status:** Phase 4 Completed.
