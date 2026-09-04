from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.fixed_commitment import FixedCommitment
from app.schemas.commitment_schema import (
    CommitmentCreate,
    CommitmentUpdate,
    CommitmentResponse,
    AutoDetectResult
)
from app.services import commitment_service

router = APIRouter()

@router.get("", response_model=List[CommitmentResponse])
def get_commitments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all fixed commitments for current user with live cycle status."""
    return commitment_service.get_commitments_with_status(db, current_user.id)

@router.post("", response_model=CommitmentResponse, status_code=status.HTTP_201_CREATED)
def create_commitment(
    payload: CommitmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually add a recurring fixed commitment (Rent, Bill, EMI, Subscription)."""
    commitment = FixedCommitment(
        user_id=current_user.id,
        name=payload.name.strip(),
        amount=payload.amount,
        category=payload.category or "Subscriptions",
        frequency=payload.frequency or "monthly",
        due_day=payload.due_day or 1,
        auto_detected=False,
        status="active"
    )
    db.add(commitment)
    db.commit()
    db.refresh(commitment)
    
    # Return formatted with status
    results = commitment_service.get_commitments_with_status(db, current_user.id)
    for c in results:
        if str(c["id"]) == str(commitment.id):
            return c
    return commitment

@router.delete("/{commitment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_commitment(
    commitment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a fixed commitment."""
    commitment = db.query(FixedCommitment).filter(
        FixedCommitment.id == commitment_id,
        FixedCommitment.user_id == current_user.id
    ).first()
    
    if not commitment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commitment not found"
        )
        
    db.delete(commitment)
    db.commit()
    return None

@router.post("/detect", response_model=AutoDetectResult)
def detect_commitments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Intelligent Scan: Analyzes recent transactions to auto-detect
    recurring subscriptions, rent, and utility bills.
    """
    new_commitments = commitment_service.detect_recurring_commitments(db, current_user.id)
    all_commitments = commitment_service.get_commitments_with_status(db, current_user.id)
    
    return {
        "newly_detected_count": len(new_commitments),
        "total_commitments": len(all_commitments),
        "detected_commitments": all_commitments
    }
