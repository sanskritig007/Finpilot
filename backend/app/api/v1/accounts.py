import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.account_schema import AccountCreate, AccountUpdate, AccountOut, NetWorthSummary
from app.services import networth_service

router = APIRouter()


@router.get("", response_model=List[AccountOut])
def list_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all financial accounts for the authenticated user."""
    return networth_service.get_user_accounts(db, current_user.id)


@router.post("", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
def create_account(
    account_in: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new bank, investment, credit card, or loan account."""
    return networth_service.create_account(db, current_user.id, account_in)


@router.get("/summary", response_model=NetWorthSummary)
def get_net_worth_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve complete Net Worth aggregation, Asset-to-Liability breakdown, and Credit Utilization."""
    return networth_service.calculate_net_worth(db, current_user.id)


@router.get("/{account_id}", response_model=AccountOut)
def get_account_detail(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch details of a single account."""
    account = networth_service.get_account_by_id(db, current_user.id, account_id)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account


@router.put("/{account_id}", response_model=AccountOut)
def update_account_detail(
    account_id: uuid.UUID,
    account_in: AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update existing account balance, credit limit, or details."""
    account = networth_service.update_account(db, current_user.id, account_id, account_in)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account


@router.delete("/{account_id}", status_code=status.HTTP_200_OK)
def delete_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an account."""
    success = networth_service.delete_account(db, current_user.id, account_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return {"message": "Account successfully deleted"}
