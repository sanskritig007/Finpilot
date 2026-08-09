from pydantic import BaseModel, Field
from uuid import UUID
from datetime import date, datetime
from typing import Optional
from decimal import Decimal

class GoalBase(BaseModel):
    name: str = Field(..., max_length=150)
    target_amount: Decimal
    current_amount: Decimal = Decimal('0.00')
    target_date: Optional[date] = None
    status: str = Field("active", max_length=20)  # 'active', 'completed', 'cancelled'

class GoalCreate(BaseModel):
    name: str = Field(..., max_length=150)
    target_amount: Decimal
    target_date: Optional[date] = None

class GoalUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    target_amount: Optional[Decimal] = None
    current_amount: Optional[Decimal] = None
    target_date: Optional[date] = None
    status: Optional[str] = Field(None, max_length=20)

class GoalResponse(GoalBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
