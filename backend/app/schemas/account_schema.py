from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
import uuid

class AccountBase(BaseModel):
    name: str = Field(..., max_length=150, example="HDFC Salary Account")
    institution: Optional[str] = Field("Bank", max_length=100, example="HDFC Bank")
    account_type: str = Field("checking", example="checking")  # 'checking', 'savings', 'investment', 'credit_card', 'loan'
    current_balance: Decimal = Field(default=Decimal('0.00'), example=50000.00)
    credit_limit: Optional[Decimal] = Field(default=None, example=100000.00)
    is_primary: bool = Field(default=False)

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    institution: Optional[str] = None
    account_type: Optional[str] = None
    current_balance: Optional[Decimal] = None
    credit_limit: Optional[Decimal] = None
    is_primary: Optional[bool] = None

class AccountOut(AccountBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NetWorthSummary(BaseModel):
    net_worth: Decimal
    total_assets: Decimal
    total_liabilities: Decimal
    liquid_cash: Decimal
    investments: Decimal
    credit_dues: Decimal
    loans: Decimal
    credit_utilization: float
    credit_utilization_status: str  # 'healthy', 'moderate', 'high_risk'
    total_credit_limit: Decimal
    total_credit_used: Decimal
    accounts: List[AccountOut]
