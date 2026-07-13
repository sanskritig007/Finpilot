# Phase 11: API Design

This document details the RESTful API contract for FinPilot AI. All endpoints will be served by FastAPI under the `/api/v1` prefix and will use JSON (except for file uploads).

## 1. Authentication Endpoints

### 1.1 Login / Signup
- **Endpoint:** `POST /api/v1/auth/login`
- **Description:** Authenticates user via email/password or OAuth. Creates account if it doesn't exist.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "auth_provider": "email"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5c...",
    "token_type": "bearer"
  }
  ```

## 2. Transactions & Data Ingestion

### 2.1 Upload CSV Statement
- **Endpoint:** `POST /api/v1/transactions/upload`
- **Description:** Accepts a `.csv` file via multipart form data, parses it, and bulk-inserts transactions.
- **Headers:** `Authorization: Bearer <token>`
- **Request:** `multipart/form-data` (Field: `file`)
- **Response (201 Created):**
  ```json
  {
    "message": "Upload successful",
    "total_imported": 45,
    "duplicates_skipped": 5,
    "invalid_rows_skipped": 0
  }
  ```

### 2.2 Get Transactions
- **Endpoint:** `GET /api/v1/transactions`
- **Description:** Retrieves paginated transactions for the dashboard data table.
- **Query Params:** `?page=1&limit=50&category=Food`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "date": "2023-10-01",
        "amount": 250.00,
        "type": "expense",
        "category": "Food",
        "description": "Starbucks"
      }
    ],
    "total_pages": 4,
    "current_page": 1
  }
  ```

## 3. Dashboard Metrics

### 3.1 Get Dashboard Summary
- **Endpoint:** `GET /api/v1/dashboard/summary`
- **Description:** Calculates Total Balance and the highly critical "Safe to Spend" metric.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "total_balance": 15000.00,
    "active_goals_locked": 5000.00,
    "upcoming_fixed_expenses": 2000.00,
    "safe_to_spend": 8000.00
  }
  ```

## 4. AI Chat

### 4.1 Process Chat Query
- **Endpoint:** `POST /api/v1/ai/chat`
- **Description:** Sends a user query to the AI. Backend fetches relevant DB context, runs "Function Calling" if math is needed, and returns the response. Rate limited via Redis.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "message": "How much did I spend on food this month?"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "role": "assistant",
    "content": "You spent ₹4,500 on food this month. That's 10% lower than last month! Want me to set a goal to lower it further next month?"
  }
  ```

---
**Status:** Phase 11 Completed.
