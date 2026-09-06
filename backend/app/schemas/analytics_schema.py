from pydantic import BaseModel
from typing import List, Dict, Any
from decimal import Decimal

class AllocationBreakdown(BaseModel):
    needs_amount: Decimal
    needs_percent: float
    wants_amount: Decimal
    wants_percent: float
    savings_amount: Decimal
    savings_percent: float
    total_pool: Decimal

class VelocityMetric(BaseModel):
    current_daily_pace: Decimal
    target_safe_daily_pace: Decimal
    days_passed: int
    days_remaining: int
    total_spent_mtd: Decimal
    projected_month_end_spend: Decimal
    velocity_status: str  # 'on_target', 'elevated', 'rapid_burn'
    velocity_message: str

class TopCategory(BaseModel):
    category: str
    amount: Decimal
    percentage: float

class SpendingAnalyticsResponse(BaseModel):
    allocation: AllocationBreakdown
    velocity: VelocityMetric
    top_categories: List[TopCategory]
