import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from typing import List, Dict, Any, Union
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.goal import Goal
from app.models.fixed_commitment import FixedCommitment
from app.services import finance_logic

def _safe_user_id(user_id: Any) -> Any:
    if isinstance(user_id, str):
        try:
            return uuid.UUID(user_id)
        except Exception:
            pass
    return user_id

def get_safe_to_spend_balance(db: Session, user_id: Any) -> Dict[str, Any]:
    """Retrieve the exact Safe to Spend balance and Total balance."""
    uid = _safe_user_id(user_id)
    total_balance = finance_logic.get_total_balance(db, uid)
    safe_to_spend = finance_logic.get_safe_to_spend(db, uid)
    goals_locked = finance_logic.get_locked_goals_amount(db, uid)
    
    return {
        "total_balance": float(total_balance),
        "safe_to_spend": float(safe_to_spend),
        "goals_locked": float(goals_locked)
    }

def get_spending_by_category(db: Session, user_id: Any, category_name: str) -> Dict[str, Any]:
    """Retrieve total amount spent by user in a specific category (case-insensitive substring match)."""
    uid = _safe_user_id(user_id)
    total = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.user_id == uid)\
        .filter(Transaction.type == 'expense')\
        .filter(func.lower(Transaction.category).like(f"%{category_name.lower()}%"))\
        .scalar() or Decimal('0.00')
        
    recent = db.query(Transaction)\
        .filter(Transaction.user_id == uid)\
        .filter(Transaction.type == 'expense')\
        .filter(func.lower(Transaction.category).like(f"%{category_name.lower()}%"))\
        .order_by(Transaction.date.desc())\
        .limit(5).all()
        
    return {
        "category": category_name,
        "total_spent": float(total),
        "recent_transactions": [
            {"date": str(tx.date), "amount": float(tx.amount), "description": tx.description}
            for tx in recent
        ]
    }

def get_spending_by_description(db: Session, user_id: Any, query: str) -> Dict[str, Any]:
    """Search transactions by keyword in their description (e.g. 'Swiggy', 'Zomato')."""
    uid = _safe_user_id(user_id)
    total = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.user_id == uid)\
        .filter(Transaction.type == 'expense')\
        .filter(func.lower(Transaction.description).like(f"%{query.lower()}%"))\
        .scalar() or Decimal('0.00')
        
    recent = db.query(Transaction)\
        .filter(Transaction.user_id == uid)\
        .filter(Transaction.type == 'expense')\
        .filter(func.lower(Transaction.description).like(f"%{query.lower()}%"))\
        .order_by(Transaction.date.desc())\
        .limit(10).all()
        
    return {
        "query": query,
        "total_spent": float(total),
        "transactions": [
            {"date": str(tx.date), "amount": float(tx.amount), "description": tx.description, "category": tx.category}
            for tx in recent
        ]
    }

def get_savings_goals(db: Session, user_id: Any) -> Dict[str, Any]:
    """Retrieve list of user savings goals."""
    uid = _safe_user_id(user_id)
    goals = db.query(Goal).filter(Goal.user_id == uid).all()
    return {
        "goals": [
            {
                "name": goal.name,
                "target_amount": float(goal.target_amount),
                "current_amount": float(goal.current_amount),
                "target_date": str(goal.target_date) if goal.target_date else None,
                "status": goal.status
            }
            for goal in goals
        ]
    }

def get_fixed_commitments_and_emis(db: Session, user_id: Any) -> Dict[str, Any]:
    """Retrieve list of user recurring fixed bills, commitments, subscriptions, and EMIs."""
    uid = _safe_user_id(user_id)
    commitments = db.query(FixedCommitment).filter(FixedCommitment.user_id == uid).all()
    total_monthly = sum(float(c.amount) for c in commitments if c.status == 'active')
    return {
        "total_monthly_commitments": total_monthly,
        "commitments": [
            {
                "name": c.name,
                "amount": float(c.amount),
                "due_day": c.due_day,
                "category": c.category,
                "frequency": c.frequency,
                "status": c.status
            }
            for c in commitments
        ]
    }
