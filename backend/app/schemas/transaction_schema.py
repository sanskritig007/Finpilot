from pydantic import BaseModel
from datetime import date
from decimal import Decimal
from uuid import UUID
from typing import List

class TransactionBase(BaseModel):
    date: date
    amount: Decimal
    type: str
    category: str
    description: str

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
