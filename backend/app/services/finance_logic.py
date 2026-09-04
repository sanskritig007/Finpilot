"""Core financial computation engine — balance aggregation, goal locking, fixed obligations, and safe-to-spend calculations."""
from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.transaction import Transaction
from app.models.goal import Goal
from app.models.account import Account
from app.models.fixed_commitment import FixedCommitment

def get_total_balance(db: Session, user_id: str) -> Decimal:
    """Calculate the total bank balance across all user accounts plus transaction flows."""
    # 1. Sum up all account starting balances
    account_sum = db.query(func.sum(Account.current_balance)).filter(Account.user_id == user_id).scalar() or Decimal('0.00')
    
    # 2. Calculate net flow from transactions (income - expense)
    income_sum = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.user_id == user_id)\
        .filter(Transaction.type == 'income').scalar() or Decimal('0.00')
        
    expense_sum = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.user_id == user_id)\
        .filter(Transaction.type == 'expense').scalar() or Decimal('0.00')
        
    return account_sum + income_sum - expense_sum

def get_locked_goals_amount(db: Session, user_id: str) -> Decimal:
    """Calculate the sum of recommended per-month savings for all active savings goals."""
    active_goals = db.query(Goal).filter(
        Goal.user_id == user_id,
        Goal.status == 'active'
    ).all()
    
    total_monthly_locked = Decimal('0.00')
    today = date.today()
    
    for goal in active_goals:
        remaining = goal.target_amount - goal.current_amount
        if remaining <= 0:
            continue
            
        if goal.target_date:
            months = (goal.target_date.year - today.year) * 12 + (goal.target_date.month - today.month)
            if months <= 0:
                months = 1
        else:
            months = 1
            
        monthly_share = remaining / Decimal(str(months))
        total_monthly_locked += monthly_share
        
    return total_monthly_locked

def get_upcoming_fixed_expenses(db: Session, user_id: str) -> Decimal:
    """
    Calculate unpaid upcoming fixed obligations for the current billing cycle.
    Excludes commitments already settled in the current calendar month.
    """
    from app.services.commitment_service import get_commitments_with_status
    commitments = get_commitments_with_status(db, user_id)
    
    unpaid_total = Decimal('0.00')
    for c in commitments:
        if c.get("status") == "active" and not c.get("is_paid_this_month"):
            unpaid_total += Decimal(str(c.get("amount", 0)))
            
    return unpaid_total

def get_financial_runway(db: Session, user_id: str) -> Dict[str, Any]:
    """
    Calculate user's Financial Runway (months of survival without income)
    based on current total balance, fixed monthly obligations, and recent discretionary burn rate.
    """
    total_balance = get_total_balance(db, user_id)
    
    # 1. Total monthly active fixed commitments
    active_commitments = db.query(FixedCommitment).filter(
        FixedCommitment.user_id == user_id,
        FixedCommitment.status == 'active'
    ).all()
    
    monthly_fixed = Decimal('0.00')
    for c in active_commitments:
        if c.frequency == 'yearly':
            monthly_fixed += c.amount / Decimal('12')
        elif c.frequency == 'weekly':
            monthly_fixed += c.amount * Decimal('4.33')
        else:
            monthly_fixed += c.amount

    # 2. Average discretionary burn over past 90 days
    ninety_days_ago = date.today() - timedelta(days=90)
    recent_expenses = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.type == 'expense',
        Transaction.date >= ninety_days_ago
    ).scalar() or Decimal('0.00')
    
    # Monthly average of non-fixed spend
    avg_total_monthly_spend = recent_expenses / Decimal('3.0')
    avg_discretionary = max(Decimal('0.00'), avg_total_monthly_spend - monthly_fixed)
    
    monthly_burn = monthly_fixed + avg_discretionary
    
    if monthly_burn <= Decimal('0.00'):
        if total_balance > Decimal('0.00'):
            return {
                "runway_months": 99.0,
                "monthly_burn": Decimal('0.00'),
                "runway_status": "healthy"
            }
        else:
            return {
                "runway_months": 0.0,
                "monthly_burn": Decimal('0.00'),
                "runway_status": "critical"
            }
            
    runway_val = float(total_balance / monthly_burn)
    runway_months = max(0.0, round(runway_val, 1))
    
    if runway_months >= 3.0:
        status = "healthy"
    elif runway_months >= 1.5:
        status = "caution"
    else:
        status = "critical"
        
    return {
        "runway_months": runway_months,
        "monthly_burn": monthly_burn,
        "runway_status": status
    }

def get_safe_to_spend(db: Session, user_id: str) -> Decimal:
    """Calculate Safe to Spend: Total Balance - Active Goals - Fixed Expenses."""
    total_balance = get_total_balance(db, user_id)
    goals_locked = get_locked_goals_amount(db, user_id)
    fixed_expenses = get_upcoming_fixed_expenses(db, user_id)
    
    return total_balance - goals_locked - fixed_expenses
