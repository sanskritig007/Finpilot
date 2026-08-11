# pyrefly: ignore [missing-import]
from datetime import date
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
from decimal import Decimal
from uuid import UUID
from typing import List

class TransactionBase(BaseModel):
    date: date
    amount: Decimal
    type: str
    category: str
    description: str

class TransactionCreate(BaseModel):
    date: date
    amount: Decimal = Field(..., gt=Decimal('0.00'))
    type: str = Field(..., pattern="^(expense|income)$")
    category: str = Field("Uncategorized", max_length=100)
    description: str = Field(..., min_length=1)


class TransactionUpdate(BaseModel):
    category: str

class TransactionResponse(TransactionBase):
    id: UUID
    transaction_hash: str

    class Config:
        from_attributes = True

class PaginatedTransactions(BaseModel):
    data: List[TransactionResponse]
    total_pages: int
    current_page: int
