# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.dashboard_schema import DashboardSummary
from app.services import finance_logic

# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from decimal import Decimal as PydanticDecimal
from app.models.account import Account

class OpeningBalanceUpdate(BaseModel):
    amount: PydanticDecimal

router = APIRouter()

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve financial summary for metrics cards on the dashboard."""
    total_balance = finance_logic.get_total_balance(db, current_user.id)
    active_goals_locked = finance_logic.get_locked_goals_amount(db, current_user.id)
    upcoming_fixed_expenses = finance_logic.get_upcoming_fixed_expenses(db, current_user.id)
    safe_to_spend = finance_logic.get_safe_to_spend(db, current_user.id)
    
    return {
        "total_balance": total_balance,
        "active_goals_locked": active_goals_locked,
        "upcoming_fixed_expenses": upcoming_fixed_expenses,
        "safe_to_spend": safe_to_spend
    }

from sqlalchemy import func
from app.models.transaction import Transaction

@router.post("/opening-balance")
def set_opening_balance(
    payload: OpeningBalanceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set or update the starting bank balance for the user's account, adjusted for transaction flows."""
    # 1. Sum up all transaction incomes and expenses
    income_sum = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.user_id == current_user.id)\
        .filter(Transaction.type == 'income').scalar() or Decimal('0.00')
        
    expense_sum = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.user_id == current_user.id)\
        .filter(Transaction.type == 'expense').scalar() or Decimal('0.00')
        
    # Calculate opening balance such that:
    # opening_balance + income_sum - expense_sum = payload.amount
    adjusted_opening_balance = Decimal(str(payload.amount)) - income_sum + expense_sum

    account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if account:
        account.current_balance = adjusted_opening_balance
    else:
        account = Account(user_id=current_user.id, current_balance=adjusted_opening_balance, name="Main Account")
        db.add(account)
        
    db.commit()
    return {"message": "Balance updated", "current_balance": account.current_balance}
