from pydantic import BaseModel
from decimal import Decimal

class DashboardSummary(BaseModel):
    total_balance: Decimal
    active_goals_locked: Decimal
    upcoming_fixed_expenses: Decimal
    safe_to_spend: Decimal
