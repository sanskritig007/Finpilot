from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.dashboard_schema import DashboardSummary
from app.services import finance_logic

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

@router.post("/opening-balance")
def set_opening_balance(
    payload: OpeningBalanceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set or update the starting bank balance for the user's account."""
    account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if account:
        account.current_balance = payload.amount
    else:
        account = Account(user_id=current_user.id, current_balance=payload.amount, name="Main Account")
        db.add(account)
    db.commit()
    return {"message": "Opening balance updated", "current_balance": account.current_balance}
