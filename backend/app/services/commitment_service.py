import re
import calendar
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.fixed_commitment import FixedCommitment
from app.models.transaction import Transaction

def _normalize_name(name: str) -> str:
    """Normalize merchant or description text for cluster matching."""
    if not name:
        return "recurring_expense"
    # Remove numbers, special symbols, trailing IDs, and extra whitespace
    cleaned = re.sub(r'[\d#\-_*@/\\|]', ' ', name)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip().title()
    return cleaned if len(cleaned) >= 3 else name.strip().title()

def detect_recurring_commitments(db: Session, user_id: str) -> List[FixedCommitment]:
    """
    Intelligent Recurring Detection Algorithm:
    Scans expense transactions to automatically identify repeating patterns 
    (Rent, Subscriptions, EMIs, Utilities) based on periodic intervals (~25-35 days) 
    and amount matching.
    """
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == 'expense'
    ).order_by(Transaction.date.asc()).all()

    if len(transactions) < 2:
        return []

    # Group transactions by normalized description/merchant
    grouped: Dict[str, List[Transaction]] = {}
    for tx in transactions:
        norm_name = _normalize_name(tx.description or tx.category or "Expense")
        if norm_name not in grouped:
            grouped[norm_name] = []
        grouped[norm_name].append(tx)

    existing_commitments = db.query(FixedCommitment).filter(
        FixedCommitment.user_id == user_id
    ).all()
    existing_names = {c.name.lower(): c for c in existing_commitments}

    new_commitments = []

    for group_name, tx_list in grouped.items():
        if len(tx_list) < 2:
            continue

        # Look for periodic matches between consecutive or near-consecutive transactions
        is_recurring = False
        sample_due_day = tx_list[-1].date.day
        sample_amount = tx_list[-1].amount
        sample_category = tx_list[-1].category or "Subscriptions"

        for i in range(len(tx_list) - 1):
            for j in range(i + 1, min(i + 4, len(tx_list))):
                tx1 = tx_list[i]
                tx2 = tx_list[j]
                
                day_diff = abs((tx2.date - tx1.date).days)
                
                # Check for ~monthly period (25 to 35 days) or same day of month
                is_monthly_period = 25 <= day_diff <= 35
                
                # Amount tolerance within 10%
                max_amt = max(tx1.amount, tx2.amount)
                min_amt = min(tx1.amount, tx2.amount)
                amount_match = max_amt > 0 and ((max_amt - min_amt) / max_amt) <= Decimal('0.10')

                if is_monthly_period and amount_match:
                    is_recurring = True
                    sample_due_day = tx2.date.day
                    sample_amount = tx2.amount
                    sample_category = tx2.category or sample_category
                    break
            if is_recurring:
                break

        if is_recurring:
            # Check if this commitment already exists for the user
            clean_name = group_name
            if clean_name.lower() not in existing_names:
                # Guess smart category if generic
                category = sample_category
                lower_name = clean_name.lower()
                if any(k in lower_name for k in ["rent", "house", "flat", "pg", "society"]):
                    category = "Housing"
                elif any(k in lower_name for k in ["emi", "loan", "card", "bank"]):
                    category = "Debt & Loans"
                elif any(k in lower_name for k in ["wifi", "broadband", "electric", "bill", "water", "gas"]):
                    category = "Utilities"
                elif any(k in lower_name for k in ["netflix", "spotify", "prime", "apple", "gym", "hotstar", "youtube"]):
                    category = "Subscriptions"

                commitment = FixedCommitment(
                    user_id=user_id,
                    name=clean_name,
                    amount=sample_amount,
                    category=category,
                    frequency="monthly",
                    due_day=min(max(sample_due_day, 1), 28), # safe clamp
                    auto_detected=True,
                    status="active"
                )
                db.add(commitment)
                new_commitments.append(commitment)
                existing_names[clean_name.lower()] = commitment

    if new_commitments:
        db.commit()
        for c in new_commitments:
            db.refresh(c)

    return new_commitments

def get_commitments_with_status(db: Session, user_id: str) -> List[Dict[str, Any]]:
    """
    Fetch all user commitments and annotate each with live cycle status:
    - is_paid_this_month
    - days_until_due
    - next_due_date
    """
    commitments = db.query(FixedCommitment).filter(
        FixedCommitment.user_id == user_id
    ).order_by(FixedCommitment.due_day.asc()).all()

    today = date.today()
    start_of_month = date(today.year, today.month, 1)
    _, last_day = calendar.monthrange(today.year, today.month)
    end_of_month = date(today.year, today.month, last_day)

    # Fetch all expense transactions for the current month once
    current_month_expenses = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == 'expense',
        Transaction.date >= start_of_month,
        Transaction.date <= end_of_month
    ).all()

    results = []

    for c in commitments:
        # Check if already paid this month
        is_paid = False
        c_name_clean = _normalize_name(c.name).lower()

        for tx in current_month_expenses:
            tx_desc = (tx.description or "").lower()
            tx_cat = (tx.category or "").lower()
            
            # Check name or category matching and amount within 15%
            name_match = c_name_clean in tx_desc or tx_desc in c_name_clean or (c.category.lower() == tx_cat and len(tx_desc) > 0)
            max_amt = max(c.amount, tx.amount)
            min_amt = min(c.amount, tx.amount)
            amt_match = max_amt > 0 and ((max_amt - min_amt) / max_amt) <= Decimal('0.15')

            if name_match and amt_match:
                is_paid = True
                break

        # Calculate next due date
        clamped_due_day = min(c.due_day, last_day)
        this_month_due_date = date(today.year, today.month, clamped_due_day)

        if is_paid:
            # Next due is next month
            next_month = today.month + 1 if today.month < 12 else 1
            next_year = today.year if today.month < 12 else today.year + 1
            _, next_month_max_day = calendar.monthrange(next_year, next_month)
            next_due_date = date(next_year, next_month, min(c.due_day, next_month_max_day))
            days_until_due = (next_due_date - today).days
        else:
            next_due_date = this_month_due_date
            days_until_due = (this_month_due_date - today).days

        results.append({
            "id": c.id,
            "user_id": c.user_id,
            "name": c.name,
            "amount": c.amount,
            "category": c.category,
            "frequency": c.frequency,
            "due_day": c.due_day,
            "auto_detected": c.auto_detected,
            "status": c.status,
            "created_at": c.created_at,
            "is_paid_this_month": is_paid,
            "days_until_due": days_until_due,
            "next_due_date": next_due_date
        })

    return results
