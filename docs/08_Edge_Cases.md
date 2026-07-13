# Phase 8: Edge Cases

This document details the critical edge cases FinPilot AI must handle to ensure data integrity and a seamless user experience. Handling these correctly is what separates a basic tutorial project from a production-grade application.

## 1. Data Ingestion & CSV Handling
- **Duplicate CSV Upload:** 
  - *Scenario:* User accidentally uploads the exact same file twice.
  - *Handling:* The system MUST hash each transaction (e.g., Date + Amount + Description) to create a unique identifier constraint. Duplicate hashes will be silently skipped without throwing an error.
- **Overlapping Dates (Partial Duplicates):** 
  - *Scenario:* User uploads Jan-Feb CSV, then later uploads Feb-March CSV.
  - *Handling:* Same hash-based deduplication as above ensures the overlapping February transactions aren't counted twice.
- **Missing or Invalid Data:** 
  - *Scenario:* A transaction row has a blank 'Amount' or an unparseable 'Date'.
  - *Handling:* The row is skipped, and the user is shown a summary alert post-upload: *"Imported 45 transactions. Skipped 2 due to invalid data."*
- **Multi-currency Strings:** 
  - *Scenario:* A bank statement contains entries like "$50.00" alongside "₹4000".
  - *Handling:* The MVP parser will strip non-numeric characters and assume the default currency (INR). Future versions will include forex conversion APIs.

## 2. Transaction Classification (The Hard Part)
- **Refunds vs. Income:** 
  - *Scenario:* User gets a ₹500 Amazon refund. It shows as a positive amount.
  - *Handling:* The AI categorizer must differentiate between "Income" (e.g., Salary) and "Refunds" based on the merchant description. Refunds should ideally offset the shopping expense category, not inflate total monthly income.
- **Internal Transfers & Credit Card Payments:** 
  - *Scenario:* User pays their credit card bill (₹10,000) from their bank account.
  - *Handling:* The system must classify this as an "Internal Transfer" or "Debt Repayment", NOT as a regular expense, to avoid skewing the "Safe to Spend" metric (since the actual expense happened when the card was swiped).
- **Cash Withdrawals:** 
  - *Scenario:* User withdraws ₹2,000 from an ATM.
  - *Handling:* Classified as "Transfer to Cash". If the user manually logs cash expenses later, those count against this balance.
- **Salary Detection:** 
  - *Scenario:* Identifying the exact day the user gets paid.
  - *Handling:* System looks for recurring large positive transactions near the start/end of the month and tags them as "Salary" automatically.

## 3. System & User State
- **Budget Exceeded:** 
  - *Scenario:* The "Safe to Spend" metric drops below 0.
  - *Handling:* The Dashboard UI turns red, and the AI proactively generates a gentle, non-judgmental insight/tip on how to recover.
- **Concurrent Uploads:** 
  - *Scenario:* User uploads two CSVs simultaneously in different browser tabs.
  - *Handling:* Database transactions with `UNIQUE` constraints (the hash) prevent race conditions from inserting duplicate rows.
- **Clearing AI Memory:** 
  - *Scenario:* User changes their financial goals completely and wants the AI to forget the old ones.
  - *Handling:* Provide a "Clear AI Context" button in the settings that soft-deletes past conversational goals from the LLM prompt context.

---
**Status:** Phase 8 Completed.
