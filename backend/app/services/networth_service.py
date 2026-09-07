"""Multi-Account & Net Worth Aggregation Service.

Computes real-time Net Worth, Assets vs Liabilities, and Credit Card Utilization
across checking, savings, investment, credit card, and loan accounts.
"""
from decimal import Decimal
from typing import Dict, Any, List, Optional
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.account_schema import AccountCreate, AccountUpdate

LIQUID_TYPES = {"checking", "savings", "cash"}
INVESTMENT_TYPES = {"investment", "demat", "mutual_fund", "crypto", "fixed_deposit", "pf"}
CREDIT_CARD_TYPES = {"credit_card", "credit"}
LOAN_TYPES = {"loan", "mortgage", "emi", "personal_loan", "home_loan"}


def _safe_user_id(user_id: Any):
    """Ensure user_id is in consistent format for comparisons."""
    if isinstance(user_id, str):
        try:
            return uuid.UUID(user_id)
        except ValueError:
            return user_id
    return user_id


def get_user_accounts(db: Session, user_id: Any) -> List[Account]:
    """Retrieve all accounts for a user. If none exist, auto-provisions a default Checking account."""
    uid = _safe_user_id(user_id)
    accounts = db.query(Account).filter(Account.user_id == uid).order_by(Account.is_primary.desc(), Account.created_at.asc()).all()
    
    if not accounts:
        # Auto-create primary checking account
        default_acc = Account(
            user_id=uid,
            name="Main Checking Account",
            institution="Primary Bank",
            account_type="checking",
            current_balance=Decimal('0.00'),
            is_primary=True
        )
        db.add(default_acc)
        db.commit()
        db.refresh(default_acc)
        return [default_acc]
        
    return accounts


def create_account(db: Session, user_id: Any, account_in: AccountCreate) -> Account:
    """Create a new user account with support for bank, investment, credit card, or loan."""
    uid = _safe_user_id(user_id)
    
    # If set as primary, unset primary flag on existing accounts
    if account_in.is_primary:
        db.query(Account).filter(Account.user_id == uid).update({"is_primary": False})
        db.commit()

    account = Account(
        user_id=uid,
        name=account_in.name,
        institution=account_in.institution or "Bank",
        account_type=account_in.account_type.lower(),
        current_balance=account_in.current_balance,
        credit_limit=account_in.credit_limit if account_in.account_type.lower() in CREDIT_CARD_TYPES else None,
        is_primary=account_in.is_primary
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def get_account_by_id(db: Session, user_id: Any, account_id: uuid.UUID) -> Optional[Account]:
    """Fetch single account by ID belonging to user."""
    uid = _safe_user_id(user_id)
    return db.query(Account).filter(Account.id == account_id, Account.user_id == uid).first()


def update_account(db: Session, user_id: Any, account_id: uuid.UUID, account_in: AccountUpdate) -> Optional[Account]:
    """Update existing account parameters."""
    uid = _safe_user_id(user_id)
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == uid).first()
    if not account:
        return None

    update_data = account_in.model_dump(exclude_unset=True) if hasattr(account_in, "model_dump") else account_in.dict(exclude_unset=True)
    
    if update_data.get("is_primary") is True:
        db.query(Account).filter(Account.user_id == uid, Account.id != account_id).update({"is_primary": False})

    for field, value in update_data.items():
        if field == "account_type" and value:
            setattr(account, field, value.lower())
        else:
            setattr(account, field, value)

    db.commit()
    db.refresh(account)
    return account


def delete_account(db: Session, user_id: Any, account_id: uuid.UUID) -> bool:
    """Delete an account if it belongs to the user."""
    uid = _safe_user_id(user_id)
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == uid).first()
    if not account:
        return False

    db.delete(account)
    db.commit()
    return True


def calculate_net_worth(db: Session, user_id: Any) -> Dict[str, Any]:
    """
    Calculate deterministic Net Worth, Asset-Liability breakdown, and Credit Utilization.
    
    Formulas:
      - Total Assets = Liquid Cash + Investments
      - Total Liabilities = Credit Card Dues + Loans
      - Net Worth = Total Assets - Total Liabilities
      - Credit Utilization = (Total Credit Dues / Total Credit Limit) * 100
    """
    uid = _safe_user_id(user_id)
    accounts = get_user_accounts(db, uid)

    liquid_cash = Decimal('0.00')
    investments = Decimal('0.00')
    credit_dues = Decimal('0.00')
    loans = Decimal('0.00')
    total_credit_limit = Decimal('0.00')

    for acc in accounts:
        acc_type = (acc.account_type or "checking").lower()
        balance = Decimal(str(acc.current_balance or 0))

        if acc_type in LIQUID_TYPES:
            liquid_cash += balance
        elif acc_type in INVESTMENT_TYPES:
            investments += balance
        elif acc_type in CREDIT_CARD_TYPES:
            credit_dues += balance
            if acc.credit_limit:
                total_credit_limit += Decimal(str(acc.credit_limit))
        elif acc_type in LOAN_TYPES:
            loans += balance
        else:
            # Default to liquid asset if unrecognized
            liquid_cash += balance

    # Note: Net transactions flow (income - expense) adjusts liquid cash
    income_sum = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.user_id == uid)\
        .filter(Transaction.type == 'income').scalar() or Decimal('0.00')
        
    expense_sum = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.user_id == uid)\
        .filter(Transaction.type == 'expense').scalar() or Decimal('0.00')
        
    net_flow = income_sum - expense_sum
    liquid_cash += net_flow

    total_assets = liquid_cash + investments
    total_liabilities = credit_dues + loans
    net_worth = total_assets - total_liabilities

    # Credit utilization calculation
    if total_credit_limit > Decimal('0.00'):
        util_ratio = float((credit_dues / total_credit_limit) * Decimal('100.0'))
        credit_utilization = round(max(0.0, util_ratio), 1)
    else:
        credit_utilization = 0.0

    if credit_utilization <= 30.0:
        credit_utilization_status = "healthy"
    elif credit_utilization <= 50.0:
        credit_utilization_status = "moderate"
    else:
        credit_utilization_status = "high_risk"

    return {
        "net_worth": net_worth,
        "total_assets": total_assets,
        "total_liabilities": total_liabilities,
        "liquid_cash": liquid_cash,
        "investments": investments,
        "credit_dues": credit_dues,
        "loans": loans,
        "credit_utilization": credit_utilization,
        "credit_utilization_status": credit_utilization_status,
        "total_credit_limit": total_credit_limit,
        "total_credit_used": credit_dues,
        "accounts": accounts
    }
