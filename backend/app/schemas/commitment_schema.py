from pydantic import BaseModel, Field
from uuid import UUID
from datetime import date, datetime
from typing import Optional
from decimal import Decimal

class CommitmentBase(BaseModel):
    name: str = Field(..., max_length=150)
    amount: Decimal
    category: str = Field("Subscriptions", max_length=100)
    frequency: str = Field("monthly", max_length=20)
    due_day: int = Field(1, ge=1, le=31)
    status: str = Field("active", max_length=20)

class CommitmentCreate(BaseModel):
    name: str = Field(..., max_length=150)
    amount: Decimal
    category: Optional[str] = "Subscriptions"
    frequency: Optional[str] = "monthly"
    due_day: Optional[int] = 1

class CommitmentUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    category: Optional[str] = None
    frequency: Optional[str] = None
    due_day: Optional[int] = None
    status: Optional[str] = None

class CommitmentResponse(CommitmentBase):
    id: UUID
    user_id: UUID
    auto_detected: bool
    created_at: datetime
    is_paid_this_month: bool = False
    days_until_due: int = 0
    next_due_date: Optional[date] = None

    class Config:
        from_attributes = True

class AutoDetectResult(BaseModel):
    newly_detected_count: int
    total_commitments: int
    detected_commitments: list[CommitmentResponse]
