import uuid
import calendar
from datetime import date
from decimal import Decimal
from typing import Dict, Any, List, Union
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.fixed_commitment import FixedCommitment
from app.services import finance_logic

NEEDS_KEYWORDS = {
    "housing", "rent", "utilities", "bills", "electricity", "water", "gas",
    "groceries", "grocery", "healthcare", "medical", "pharmacy", "education",
    "insurance", "debt & loans", "emi", "loan", "fuel", "commute", "transportation"
}

def get_spending_analytics(db: Session, user_id: Union[str, uuid.UUID]) -> Dict[str, Any]:
    """
    Computes Apple-grade 50/30/20 Capital Allocation Breakdown
    and Real-Time Daily Spending Velocity Metrics.
    """
    if isinstance(user_id, str):
        try:
            user_id = uuid.UUID(user_id)
        except Exception:
            pass

    today = date.today()
    start_of_month = date(today.year, today.month, 1)
    _, max_day = calendar.monthrange(today.year, today.month)
    end_of_month = date(today.year, today.month, max_day)

    days_passed = max(1, today.day)
    days_remaining = max(1, max_day - today.day)

    # 1. Fetch current month's expense transactions
    expenses = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == 'expense',
        Transaction.date >= start_of_month,
        Transaction.date <= end_of_month
    ).all()

    # 2. Categorize MTD Transactions into Needs vs Wants
    needs_tx_total = Decimal('0.00')
    wants_tx_total = Decimal('0.00')
    cat_sums: Dict[str, Decimal] = {}

    for tx in expenses:
        amt = tx.amount
        cat = (tx.category or "General").strip().title()
        cat_lower = cat.lower()
        cat_sums[cat] = cat_sums.get(cat, Decimal('0.00')) + amt

        if any(kw in cat_lower for kw in NEEDS_KEYWORDS):
            needs_tx_total += amt
        else:
            wants_tx_total += amt

    # 3. Incorporate Fixed Commitments (Needs) and Locked Goals (Savings)
    commitments = db.query(FixedCommitment).filter(
        FixedCommitment.user_id == user_id,
        FixedCommitment.status == 'active'
    ).all()
    fixed_commitments_total = sum((c.amount for c in commitments), Decimal('0.00'))

    needs_amount = max(needs_tx_total, fixed_commitments_total)
    wants_amount = wants_tx_total
    savings_amount = finance_logic.get_locked_goals_amount(db, user_id)

    total_pool = needs_amount + wants_amount + savings_amount

    if total_pool <= Decimal('0.00'):
        needs_pct = 50.0
        wants_pct = 30.0
        savings_pct = 20.0
    else:
        needs_pct = round(float((needs_amount / total_pool) * 100), 1)
        wants_pct = round(float((wants_amount / total_pool) * 100), 1)
        savings_pct = max(0.0, round(100.0 - needs_pct - wants_pct, 1))

    # 4. Daily Spending Velocity Calculation
    total_spent_mtd = sum((tx.amount for tx in expenses), Decimal('0.00'))
    current_daily_pace = total_spent_mtd / Decimal(str(days_passed))

    safe_to_spend = finance_logic.get_safe_to_spend(db, user_id)
    target_safe_daily_pace = max(Decimal('0.00'), safe_to_spend / Decimal(str(days_remaining)))
    projected_month_end_spend = total_spent_mtd + (current_daily_pace * Decimal(str(days_remaining)))

    if safe_to_spend <= Decimal('0.00') or (target_safe_daily_pace > 0 and current_daily_pace > target_safe_daily_pace * Decimal('1.35')):
        velocity_status = "rapid_burn"
        velocity_message = f"Burn rate is high (₹{current_daily_pace.quantize(Decimal('0.01'))}/day). Safe target is ₹{target_safe_daily_pace.quantize(Decimal('0.01'))}/day."
    elif target_safe_daily_pace > 0 and current_daily_pace > target_safe_daily_pace * Decimal('1.10'):
        velocity_status = "elevated"
        velocity_message = f"Slightly elevated daily burn. Moderating discretionary spend will preserve your safety cushion."
    else:
        velocity_status = "on_target"
        velocity_message = f"Pacing comfortably within safe daily limits (₹{current_daily_pace.quantize(Decimal('0.01'))}/day)."

    # 5. Top Categories Breakdown
    sorted_cats = sorted(cat_sums.items(), key=lambda item: item[1], reverse=True)[:4]
    top_categories = []
    for cat_name, cat_amt in sorted_cats:
        cat_pct = round(float((cat_amt / total_spent_mtd) * 100), 1) if total_spent_mtd > 0 else 0.0
        top_categories.append({
            "category": cat_name,
            "amount": cat_amt,
            "percentage": cat_pct
        })

    return {
        "allocation": {
            "needs_amount": needs_amount,
            "needs_percent": needs_pct,
            "wants_amount": wants_amount,
            "wants_percent": wants_pct,
            "savings_amount": savings_amount,
            "savings_percent": savings_pct,
            "total_pool": total_pool
        },
        "velocity": {
            "current_daily_pace": current_daily_pace,
            "target_safe_daily_pace": target_safe_daily_pace,
            "days_passed": days_passed,
            "days_remaining": days_remaining,
            "total_spent_mtd": total_spent_mtd,
            "projected_month_end_spend": projected_month_end_spend,
            "velocity_status": velocity_status,
            "velocity_message": velocity_message
        },
        "top_categories": top_categories
    }
