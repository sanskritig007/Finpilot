from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from app.models.transaction import Transaction
from app.models.goal import Goal
from app.models.account import Account

def get_total_balance(db: Session, user_id: str) -> Decimal:
    """Calculate the total bank balance across all user accounts plus transaction flows."""
    # 1. Sum up all account starting balances
    account_sum = db.query(func.sum(Account.current_balance)).filter(Account.user_id == user_id).scalar() or Decimal('0.00')
    
    # 2. Calculate net flow from transactions (income - expense)
    # Note: we only sum incomes and subtract expenses. We skip transfers.
    income_sum = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.user_id == user_id)\
        .filter(Transaction.type == 'income').scalar() or Decimal('0.00')
        
    expense_sum = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.user_id == user_id)\
        .filter(Transaction.type == 'expense').scalar() or Decimal('0.00')
        
    return account_sum + income_sum - expense_sum

def get_locked_goals_amount(db: Session, user_id: str) -> Decimal:
    """Calculate the sum of target amounts for all active savings goals."""
    active_goals_sum = db.query(func.sum(Goal.target_amount))\
        .filter(Goal.user_id == user_id)\
        .filter(Goal.status == 'active').scalar() or Decimal('0.00')
    return active_goals_sum

def get_upcoming_fixed_expenses(db: Session, user_id: str) -> Decimal:
    """Calculate upcoming fixed expenses. (Stubbed to 0.00 for Sprint 2)."""
    # Will be implemented when the recurring_expenses table is added.
    return Decimal('0.00')

def get_safe_to_spend(db: Session, user_id: str) -> Decimal:
    """Calculate Safe to Spend: Total Balance - Active Goals - Fixed Expenses."""
    total_balance = get_total_balance(db, user_id)
    goals_locked = get_locked_goals_amount(db, user_id)
    fixed_expenses = get_upcoming_fixed_expenses(db, user_id)
    
    return total_balance - goals_locked - fixed_expenses
