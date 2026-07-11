# Phase 1: Product Discovery

## 1. Product Vision
FinPilot AI is an intelligent, AI-powered Personal Finance Assistant. Unlike standard expense trackers, it acts as a proactive financial companion with long-term memory, designed to help users manage their money, track expenses, and achieve financial goals through conversational AI and smart insights.

## 2. Target Audience
- **Primary:** College students managing pocket money, saving for shopping/vacations, and aiming to minimize reliance on asking for money from home.
- **Secondary:** Working professionals looking to optimize savings, invest, and (in the future) clear debt.

## 3. Core Capabilities & Scope
- **Currency:** INR (₹) focused from Day 1. Future scope will include multi-currency support.
- **Long-Term Memory:** The AI will explicitly remember user instructions and goals. For example, if the user says, "I want to save ₹5,000 from my salary this month," the AI will remember this and actively suggest areas where they can cut back to achieve this goal.
- **Goal Setting (Hybrid Approach):** 
  - **Explicit:** Users can set goals manually via a dedicated "Goals" UI form.
  - **Conversational:** The AI detects intent in chat (e.g., "I want to save for a new phone") and asks for user confirmation before saving it as an active goal.
- **Data Ingestion & Transactions:**
  - **MVP:** CSV Upload (primary method for historical data) and Manual UI entry (for cash/daily unrecorded expenses).
  - **Future Scope:** Conversational transaction entry (e.g., "I spent ₹250 on coffee") with AI asking for confirmation before saving.
- **CSV Processing & Edge Cases:** 
  - The system will first attempt to automatically detect and map common bank CSV formats.
  - If automatic detection fails or confidence is low, a fallback column-mapping UI will be presented to the user (Date, Amount, Description, Category).
  - The user's manual mapping preferences will be saved for future uploads from that specific bank.

## 4. Status
**Phase 1: Completed.** 
Proceeding to Phase 2: Software Requirements Specification (SRS).
