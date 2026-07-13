# Phase 9: System Design (Architecture)

This document outlines the High-Level Architecture (HLA) for FinPilot AI. It demonstrates how the frontend, backend, databases, and external LLM communicate securely and efficiently.

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    %% Client Layer
    Client[React + Tailwind CSS<br/>Frontend Client]
    
    %% API Gateway
    Gateway[Reverse Proxy / CDN<br/>e.g., Vercel/Nginx]
    
    %% Backend Layer
    subgraph Backend [FastAPI Application (Dockerized)]
        API[FastAPI Router / Controllers]
        Auth[Auth Service<br/>JWT/OAuth]
        Logic[Business Logic / Services]
        Parser[CSV Parser Engine]
        AI_Manager[AI Context Manager<br/>Function Calling]
    end
    
    %% Data Layer
    subgraph Data Storage
        PG[(PostgreSQL<br/>Transactions & Goals)]
        Redis[(Redis<br/>Sessions & Rate Limits)]
    end
    
    %% External Services
    LLM[OpenAI API<br/>LLM Service]
    
    %% Connections
    Client <-->|HTTPS / REST| Gateway
    Gateway <-->|Forward Request| API
    
    API --> Auth
    API --> Logic
    API --> Parser
    API --> AI_Manager
    
    Logic <--> PG
    Parser -->|Bulk Insert| PG
    Auth <--> Redis
    AI_Manager <-->|Check Limit| Redis
    
    AI_Manager <-->|Secure Prompting| LLM
```

## 2. Component Responsibilities

### 2.1 Frontend (React.js)
- **Role:** The Presentation Layer.
- **Responsibilities:** Renders the Dashboard, handles CSV file uploads (via `multipart/form-data`), maintains client-side routing, and manages the interactive AI chat UI.

### 2.2 Backend API (FastAPI - Python)
- **Role:** The Core Application Logic (Stateless).
- **Responsibilities:**
  - **Auth Service:** Issues and validates JWTs for secure access.
  - **CSV Parser Engine:** Reads the file in-memory, deduplicates via hashing (Phase 8), maps columns, and bulk-inserts to the database. Appends Zero-Retention policy.
  - **AI Context Manager:** Orchestrates the LLM. It fetches *only* relevant transactions from the DB, constructs a secure prompt, and handles "Function Calling" so the LLM can query the database safely without writing SQL.

### 2.3 Data Layer
- **PostgreSQL:** The primary relational database. Stores Users, Transactions, and Savings Goals. Ensures ACID compliance for financial data.
- **Redis:** In-memory data store. Used exclusively for Rate Limiting the AI API (e.g., 20 requests/hour) and short-lived caching of the dashboard "Safe to Spend" metric to ensure sub-2-second load times.

## 3. Data Flow Example: AI Chat Request
1. User types *"How much did I spend on food?"* in React.
2. React sends a `POST /api/chat` request with the JWT token in the Authorization header.
3. FastAPI validates the token and checks Redis to ensure the user hasn't exceeded their rate limit.
4. FastAPI queries PostgreSQL for the user's categorized food transactions.
5. FastAPI constructs a secure payload: `[System Prompt] + [Transactions JSON Context] + [User Query]`.
6. FastAPI sends the payload to the OpenAI API.
7. OpenAI responds with the financial insight.
8. FastAPI streams/returns the response back to the React client.

---
**Status:** Phase 9 Completed.
