# Phase 10: Database Design

This document details the PostgreSQL relational database schema for FinPilot AI. Using SQLAlchemy ORM, these tables are designed to ensure data integrity, fast query performance, and secure foreign-key relationships.

## 1. Entity-Relationship (ER) Overview

- A **User** can have many **Transactions** (1-to-Many).
- A **User** can have many **Goals** (1-to-Many).
- Deleting a User cascades and automatically deletes all associated Transactions and Goals (Zero-Retention & GDPR Compliance).

## 2. Table Definitions

### 2.1 Table: `users`
Stores authentication and profile data.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique user identifier |
| `email` | VARCHAR(255) | Unique, Not Null, Indexed | Used for login |
| `password_hash` | VARCHAR(255) | Not Null | Bcrypt hashed password |
| `auth_provider` | VARCHAR(50) | Default: 'email' | e.g., 'email' or 'google' |
| `created_at` | TIMESTAMP | Default: NOW() | Account creation time |

### 2.2 Table: `transactions`
Stores all parsed financial transactions securely.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique transaction ID |
| `user_id` | UUID | Foreign Key (`users.id`) ON DELETE CASCADE, Indexed | Owner of the transaction |
| `date` | DATE | Not Null, Indexed | Date of transaction |
| `amount` | DECIMAL(12,2) | Not Null | Numeric value (e.g., 5000.00) |
| `type` | VARCHAR(20) | Not Null | 'expense', 'income', 'transfer', 'refund' |
| `category` | VARCHAR(100)| Default: 'Uncategorized' | E.g., 'Food', 'Rent' |
| `description` | TEXT | Not Null | Raw bank description |
| `transaction_hash` | VARCHAR(64) | Unique per user | Used to prevent duplicate CSV row inserts |
| `created_at` | TIMESTAMP | Default: NOW() | When it was imported |

### 2.3 Table: `goals`
Stores explicit savings goals confirmed via the AI chat or UI.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique goal ID |
| `user_id` | UUID | Foreign Key (`users.id`) ON DELETE CASCADE | Owner of the goal |
| `name` | VARCHAR(150)| Not Null | E.g., "Goa Trip", "New Phone" |
| `target_amount` | DECIMAL(12,2) | Not Null | Total amount to save |
| `current_amount` | DECIMAL(12,2) | Default: 0.00 | Amount saved so far |
| `target_date` | DATE | Nullable | Optional deadline |
| `status` | VARCHAR(20) | Default: 'active' | 'active', 'completed', 'cancelled' |
| `created_at` | TIMESTAMP | Default: NOW() | Goal creation time |

## 3. Database Indexes (Performance Tuning)
To meet the PRD non-functional requirement of sub-2-second response times for datasets up to 10,000 rows, the following indexes are mandatory:
1. `idx_user_transactions_date`: Composite index on `transactions(user_id, date)` for lightning-fast monthly dashboard aggregations.
2. `idx_user_email`: Index on `users(email)` for fast login lookups.
3. `idx_transaction_hash`: Index to rapidly check if an uploaded CSV row already exists during batch imports.

---
**Status:** Phase 10 Completed.
