# Phase 2: Software Requirements Specification (SRS)

## 1. Introduction
### 1.1 Purpose
This document outlines the software requirements for **FinPilot AI**. Following an MVP-first philosophy, the immediate goal is to build a robust, end-to-end working system focusing on core functionality, deferring "nice-to-have" features for later iterations.

### 1.2 Scope
FinPilot AI is an AI-powered personal finance assistant. The software will handle user authentication, ingest financial data (primarily via CSV), store user goals/memories, and provide a conversational AI interface that is strictly restricted to personal finance advice.

## 2. Overall Description
### 2.1 User Characteristics
- **College Students:** Require a simple UI, "Safe to Spend" tracking, and straightforward goal management.
- **Working Professionals:** Require accurate transaction categorization, secure data handling, and savings optimization.

### 2.2 Operating Environment (Tech Stack)
- **Frontend (Client):** React.js + Tailwind CSS
- **Backend API:** FastAPI (Python)
- **Database:** PostgreSQL (Relational Data)
- **Cache/Session:** Redis
- **Hosting/Deployment:** Dockerized containers deployed on Render/Vercel.

### 2.3 Design & Implementation Constraints
- **Security Constraint:** Financial data is highly sensitive. Strict data boundaries must be maintained between the application database and the OpenAI API (e.g., anonymizing data or only sending relevant context).
- **LLM Constraint (Guardrails):** The AI must use strict system prompts to prevent hallucinations and off-topic conversations (e.g., refusing to answer non-finance questions).
- **MVP Constraint:** Focus strictly on the core loop: Auth -> Data Upload -> AI Chat -> Dashboard. Advanced features like email notifications, multi-currency, and automated bank syncing are deliberately excluded from the initial release.

## 3. High-Level System Features
*(Note: Atomic functional requirements and non-functional metrics will be detailed in Phase 5 and Phase 6 respectively, as per the engineering lifecycle).*
- **Authentication:** Dual support for Email/Password and Google OAuth.
- **Data Ingestion:** CSV Upload with a fallback column-mapping UI. Manual entry for unrecorded cash transactions.
- **Dashboard:** Dual-metric display showing both 'Total Bank Balance' and the AI-calculated 'Safe to Spend' amount.
- **AI Chat & Memory:** Context-aware LLM integration capable of saving explicit user goals and retrieving past financial context.
- **Notifications:** In-app subtle notifications (bell icon) only.

## 4. Assumptions and Dependencies
- Users will have access to standard CSV exports from their respective banks.
- The external LLM API (e.g., OpenAI) will maintain high availability and acceptable latency for chat interactions.
- The system assumes INR (₹) as the default currency for all calculations.

---
**Status:** Phase 2 Completed.
