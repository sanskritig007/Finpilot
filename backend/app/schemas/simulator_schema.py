from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import date

class SimulationRequest(BaseModel):
    name: Optional[str] = Field("Planned Purchase", max_length=150)
    amount: Decimal = Field(..., gt=0)
    payment_mode: str = Field("upfront", description="'upfront' or 'emi'")
    emi_months: Optional[int] = Field(3, ge=1, le=36)

class SimulationMetric(BaseModel):
    before: Decimal
    after: Decimal
    delta: Decimal

class RunwayMetric(BaseModel):
    before_months: float
    after_months: float
    delta_months: float
    before_status: str
    after_status: str

class GoalImpact(BaseModel):
    goal_id: str
    goal_name: str
    target_amount: Decimal
    current_amount: Decimal
    delay_days: int
    impact_description: str

class SimulationResult(BaseModel):
    item_name: str
    purchase_amount: Decimal
    payment_mode: str
    emi_months: int
    monthly_emi_amount: Decimal
    
    total_balance: SimulationMetric
    safe_to_spend: SimulationMetric
    upcoming_fixed_expenses: SimulationMetric
    runway: RunwayMetric
    
    goal_delays: List[GoalImpact]
    
    verdict: str  # 'safe', 'caution', 'critical'
    verdict_title: str
    verdict_message: str
    recommendations: List[str]
    
    # Comparison summary for EMI alternative if user chose upfront or vice versa
    alternative_option: Optional[Dict[str, Any]] = None
