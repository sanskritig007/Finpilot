# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from decimal import Decimal

from typing import List

class DashboardSummary(BaseModel):
    total_balance: Decimal
    active_goals_locked: Decimal
    upcoming_fixed_expenses: Decimal
    safe_to_spend: Decimal

class DashboardInsights(BaseModel):
    analysis: str
    recommendations: List[str]
    encouragement: str
