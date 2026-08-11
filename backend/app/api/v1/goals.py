from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.goal import Goal
from app.schemas.goal_schema import GoalCreate, GoalUpdate, GoalResponse
from datetime import date
from app.models.transaction import Transaction
from app.services.csv_parser import generate_transaction_hash

router = APIRouter()

@router.get("/", response_model=List[GoalResponse])
def get_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all savings goals for the logged-in user."""
    return db.query(Goal).filter(Goal.user_id == current_user.id).order_by(Goal.created_at.desc()).all()

@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_in: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new savings goal."""
    goal = Goal(
        user_id=current_user.id,
        name=goal_in.name,
        target_amount=goal_in.target_amount,
        target_date=goal_in.target_date,
        current_amount=0.0,
        status="active"
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal

@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: UUID,
    goal_in: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update details or progress of an existing savings goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    # Calculate difference in current amount (funds added or withdrawn)
    added_amount = None
    if goal_in.current_amount is not None:
        added_amount = goal_in.current_amount - goal.current_amount

    # Update only fields provided
    update_data = goal_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)
        
    db.commit()
    db.refresh(goal)

    # Log an automatic double-entry transaction to sync the total balance
    if added_amount is not None and added_amount != 0:
        tx_type = "expense" if added_amount > 0 else "income"
        tx_desc = f"Saved to {goal.name}" if added_amount > 0 else f"Withdrew from {goal.name}"
        tx_amount = abs(added_amount)
        
        # Unique suffix to prevent double-entry hash collisions on same-day manual logs
        import time
        unique_suffix = f" (vault:{int(time.time())})"
        
        tx_hash = generate_transaction_hash(
            user_id=str(current_user.id),
            date=date.today().strftime("%Y-%m-%d"),
            amount=str(tx_amount),
            description=tx_desc + unique_suffix,
            t_type=tx_type
        )
        
        db_tx = Transaction(
            user_id=current_user.id,
            date=date.today(),
            amount=tx_amount,
            type=tx_type,
            category="Investment",
            description=tx_desc,
            transaction_hash=tx_hash
        )
        db.add(db_tx)
        db.commit()

    return goal

@router.delete("/{goal_id}", status_code=status.HTTP_200_OK)
def delete_goal(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a savings goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    # Refund saved amount back to Total Balance on deletion
    if goal.current_amount > 0:
        tx_desc = f"Refund from deleted goal: {goal.name}"
        tx_amount = goal.current_amount
        
        import time
        unique_suffix = f" (refund:{int(time.time())})"
        
        tx_hash = generate_transaction_hash(
            user_id=str(current_user.id),
            date=date.today().strftime("%Y-%m-%d"),
            amount=str(tx_amount),
            description=tx_desc + unique_suffix,
            t_type="income"
        )
        
        db_tx = Transaction(
            user_id=current_user.id,
            date=date.today(),
            amount=tx_amount,
            type="income",
            category="Investment",
            description=tx_desc,
            transaction_hash=tx_hash
        )
        db.add(db_tx)

    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully"}
