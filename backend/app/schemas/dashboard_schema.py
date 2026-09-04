from pydantic import BaseModel
from decimal import Decimal
from typing import List

class DashboardSummary(BaseModel):
    total_balance: Decimal
    active_goals_locked: Decimal
    upcoming_fixed_expenses: Decimal
    safe_to_spend: Decimal
    runway_months: float = 0.0
    monthly_burn: Decimal = Decimal('0.00')
    runway_status: str = "healthy"  # 'healthy', 'caution', 'critical'

class DashboardInsights(BaseModel):
    analysis: str
    recommendations: List[str]
    encouragement: str
