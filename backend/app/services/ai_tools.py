# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from sqlalchemy import func
from decimal import Decimal
from typing import List, Dict, Any
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.goal import Goal
from app.services import finance_logic

def get_safe_to_spend_balance(db: Session, user_id: str) -> Dict[str, Any]:
    """Retrieve the exact Safe to Spend balance and Total balance."""
    total_balance = finance_logic.get_total_balance(db, user_id)
    safe_to_spend = finance_logic.get_safe_to_spend(db, user_id)
    goals_locked = finance_logic.get_locked_goals_amount(db, user_id)
    
    return {
        "total_balance": float(total_balance),
        "safe_to_spend": float(safe_to_spend),
        "goals_locked": float(goals_locked)
    }

def get_spending_by_category(db: Session, user_id: str, category_name: str) -> Dict[str, Any]:
    """Retrieve total amount spent by user in a specific category (case-insensitive substring match)."""
    # Sum up all expense transactions matching the category
    total = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.user_id == user_id)\
        .filter(Transaction.type == 'expense')\
        .filter(func.lower(Transaction.category).like(f"%{category_name.lower()}%"))\
        .scalar() or Decimal('0.00')
        
    # Get recent 5 transactions in this category for detail
    recent = db.query(Transaction)\
        .filter(Transaction.user_id == user_id)\
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

def get_spending_by_description(db: Session, user_id: str, query: str) -> Dict[str, Any]:
    """Search transactions by keyword in their description (e.g. 'Swiggy', 'Zomato')."""
    total = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.user_id == user_id)\
        .filter(Transaction.type == 'expense')\
        .filter(func.lower(Transaction.description).like(f"%{query.lower()}%"))\
        .scalar() or Decimal('0.00')
        
    recent = db.query(Transaction)\
        .filter(Transaction.user_id == user_id)\
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

def get_savings_goals(db: Session, user_id: str) -> Dict[str, Any]:
    """Retrieve list of user savings goals."""
    goals = db.query(Goal).filter(Goal.user_id == user_id).all()
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
