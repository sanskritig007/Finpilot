# Phase 13: Sequence Diagrams

This document illustrates the step-by-step logic and communication flow for the two most critical operational sequences in FinPilot AI. These diagrams ensure developers understand exactly how data moves through the system.

## 1. CSV Upload & Ingestion Flow

This sequence demonstrates how a `.csv` file goes from the user's browser, gets parsed, deduplicated via hashes, and saved into the database while strictly adhering to the Zero-Retention policy.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant React UI
    participant FastAPI
    participant CSV_Parser
    participant PostgreSQL
    
    User->>React UI: Selects CSV and clicks "Upload"
    React UI->>FastAPI: POST /transactions/upload (multipart/form-data, JWT)
    FastAPI->>FastAPI: Validate JWT Authentication
    FastAPI->>CSV_Parser: Pass file stream (In-Memory)
    
    loop For each row in CSV
        CSV_Parser->>CSV_Parser: Map columns & format date/amount
        CSV_Parser->>CSV_Parser: Generate SHA-256 Hash (Date+Amount+Desc)
    end
    
    CSV_Parser->>PostgreSQL: SELECT existing transaction hashes for this user
    PostgreSQL-->>CSV_Parser: Return existing hashes
    CSV_Parser->>CSV_Parser: Filter out duplicates (Overlapping rows)
    
    CSV_Parser->>PostgreSQL: Bulk INSERT new valid transactions
    PostgreSQL-->>CSV_Parser: Return success (Rows inserted)
    
    CSV_Parser->>CSV_Parser: Execute Zero-Retention Policy (Delete memory stream)
    FastAPI-->>React UI: 201 Created (Success & skipped count details)
    React UI-->>User: Show Success Toast & Refresh Dashboard UI
```

## 2. AI Chat & Secure Context Retrieval Flow

This sequence demonstrates how the AI interacts with the user, fetches financial context securely from the database, checks rate limits, and prevents hallucination by handling logic securely on the backend.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant React UI
    participant Redis
    participant FastAPI
    participant PostgreSQL
    participant OpenAI_LLM
    
    User->>React UI: Asks "How much did I spend on Food this month?"
    React UI->>FastAPI: POST /ai/chat { message } (with JWT)
    
    FastAPI->>Redis: Check Rate Limit for User ID
    alt Limit Exceeded
        Redis-->>FastAPI: Block (429 Too Many Requests)
        FastAPI-->>React UI: Error "Rate limit exceeded. Please wait."
    else Limit OK
        Redis-->>FastAPI: Increment limit counter
        
        FastAPI->>PostgreSQL: Query recent transactions & active goals
        PostgreSQL-->>FastAPI: Return database results as JSON context
        
        FastAPI->>FastAPI: Construct secure payload (System Prompt + JSON Context + User Query)
        FastAPI->>OpenAI_LLM: Send Payload via API
        
        OpenAI_LLM-->>FastAPI: Return AI response / insight
        FastAPI-->>React UI: 200 OK (Chat Message Data)
        React UI-->>User: Display AI message in chat window
    end
```

---
**Status:** Phase 13 Completed.
