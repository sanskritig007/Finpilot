import uuid
from decimal import Decimal
from typing import Dict, Any, List, Union
from sqlalchemy.orm import Session

from app.models.goal import Goal
from app.services import finance_logic
from app.schemas.simulator_schema import SimulationRequest

def simulate_purchase(db: Session, user_id: Union[str, uuid.UUID], payload: SimulationRequest) -> Dict[str, Any]:
    """
    Deterministic Financial Simulation Engine:
    Evaluates the exact before/after impact of a hypothetical purchase on:
    1. Safe-to-Spend
    2. Total Liquid Balance
    3. Upcoming Fixed Obligations
    4. Financial Survival Runway
    5. Active Savings Goal Maturity Schedules
    """
    if isinstance(user_id, str):
        try:
            user_id = uuid.UUID(user_id)
        except Exception:
            pass

    # 1. Fetch current verified state
    curr_balance = finance_logic.get_total_balance(db, user_id)
    curr_goals_locked = finance_logic.get_locked_goals_amount(db, user_id)
    curr_fixed = finance_logic.get_upcoming_fixed_expenses(db, user_id)
    curr_safe = finance_logic.get_safe_to_spend(db, user_id)
    curr_runway = finance_logic.get_financial_runway(db, user_id)
    
    active_goals = db.query(Goal).filter(
        Goal.user_id == user_id,
        Goal.status == 'active'
    ).all()

    # 2. Simulate chosen mode
    is_emi = payload.payment_mode.lower() == 'emi'
    emi_months = max(1, payload.emi_months or 3) if is_emi else 1
    
    if is_emi:
        monthly_emi = payload.amount / Decimal(str(emi_months))
        sim_balance = curr_balance
        sim_fixed = curr_fixed + monthly_emi
        sim_monthly_burn = curr_runway["monthly_burn"] + monthly_emi
    else:
        monthly_emi = Decimal('0.00')
        sim_balance = curr_balance - payload.amount
        sim_fixed = curr_fixed
        sim_monthly_burn = curr_runway["monthly_burn"]

    sim_safe = sim_balance - curr_goals_locked - sim_fixed

    # 3. Simulate Runway Duration
    if sim_monthly_burn <= Decimal('0.00'):
        sim_runway_months = 99.0 if sim_balance > Decimal('0.00') else 0.0
    else:
        sim_runway_val = float(sim_balance / sim_monthly_burn)
        sim_runway_months = max(0.0, round(sim_runway_val, 1))

    if sim_runway_months >= 3.0:
        sim_runway_status = "healthy"
    elif sim_runway_months >= 1.5:
        sim_runway_status = "caution"
    else:
        sim_runway_status = "critical"

    # 4. Goal Delay Projection
    goal_delays = []
    for g in active_goals:
        remaining = g.target_amount - g.current_amount
        if remaining <= Decimal('0.00'):
            continue
            
        if is_emi:
            impact_ratio = float(monthly_emi / max(Decimal('1000.00'), curr_balance))
            delay_days = min(120, max(2, int(impact_ratio * 45 * emi_months)))
        else:
            impact_ratio = float(payload.amount / max(Decimal('1000.00'), curr_balance))
            delay_days = min(180, max(3, int(impact_ratio * 60)))

        goal_delays.append({
            "goal_id": str(g.id),
            "goal_name": g.name,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "delay_days": delay_days,
            "impact_description": f"Estimated {delay_days}-day delay to target maturity."
        })

    # 5. Risk Verdict Matrix
    recommendations: List[str] = []
    
    if sim_safe < Decimal('0.00') or sim_balance < Decimal('0.00') or sim_runway_months < 1.0:
        verdict = "critical"
        verdict_title = "High Risk: Financial Safety Breached"
        verdict_message = "This purchase will push your Safe-to-Spend into the negative or deplete your essential liquid reserves."
        if not is_emi:
            recommendations.append("Consider a 6-month or 12-month No-Cost EMI to avoid sudden capital depletion.")
        recommendations.append("Postpone non-essential discretionary purchases until balance recovers.")
    elif sim_safe < (curr_balance * Decimal('0.15')) or sim_runway_months < 2.5 or (curr_runway["runway_months"] > 0 and sim_runway_months < curr_runway["runway_months"] * 0.7):
        verdict = "caution"
        verdict_title = "Caution: Significant Cushion Reduction"
        verdict_message = "You can technically afford this, but your liquid cushion and survival runway will be tightly constrained."
        if not is_emi and payload.amount >= Decimal('15000.00'):
            recommendations.append(f"Splitting into a 3-month EMI (₹{(payload.amount/Decimal('3')).quantize(Decimal('0.01'))}/mo) would keep your runway healthy.")
        recommendations.append("Keep discretionary dining & leisure expenses low over the next 30 days.")
    else:
        verdict = "safe"
        verdict_title = "Safe & Financially Sound"
        verdict_message = "This purchase comfortably fits within your discretionary allowance without jeopardizing bills or active goals."
        recommendations.append("All upcoming rent, subscriptions, and locked savings goals remain 100% safeguarded.")
        if is_emi:
            recommendations.append(f"Ensure ₹{monthly_emi.quantize(Decimal('0.01'))} is earmarked on your due date each month.")

    # 6. Alternative Mode Comparison Summary
    alt_mode = "emi" if not is_emi else "upfront"
    alt_months = 6 if not is_emi else 1
    if not is_emi:
        alt_monthly_emi = payload.amount / Decimal('6')
        alt_safe = curr_balance - curr_goals_locked - (curr_fixed + alt_monthly_emi)
        alt_runway_val = float(curr_balance / (curr_runway["monthly_burn"] + alt_monthly_emi)) if (curr_runway["monthly_burn"] + alt_monthly_emi) > 0 else 99.0
        alt_runway = max(0.0, round(alt_runway_val, 1))
        alt_summary = {
            "mode": "6-Month EMI",
            "monthly_amount": alt_monthly_emi,
            "sim_safe_to_spend": alt_safe,
            "sim_runway_months": alt_runway,
            "verdict": "safe" if alt_safe > 0 and alt_runway >= 2.5 else "caution"
        }
    else:
        alt_safe = curr_balance - payload.amount - curr_goals_locked - curr_fixed
        alt_burn = curr_runway["monthly_burn"]
        alt_runway_val = float((curr_balance - payload.amount) / alt_burn) if alt_burn > 0 else 99.0
        alt_runway = max(0.0, round(alt_runway_val, 1))
        alt_summary = {
            "mode": "Full Upfront Cash",
            "monthly_amount": Decimal('0.00'),
            "sim_safe_to_spend": alt_safe,
            "sim_runway_months": alt_runway,
            "verdict": "safe" if alt_safe > 0 and alt_runway >= 2.5 else ("critical" if alt_safe < 0 else "caution")
        }

    return {
        "item_name": payload.name or "Planned Purchase",
        "purchase_amount": payload.amount,
        "payment_mode": payload.payment_mode,
        "emi_months": emi_months,
        "monthly_emi_amount": monthly_emi,
        "total_balance": {
            "before": curr_balance,
            "after": sim_balance,
            "delta": sim_balance - curr_balance
        },
        "safe_to_spend": {
            "before": curr_safe,
            "after": sim_safe,
            "delta": sim_safe - curr_safe
        },
        "upcoming_fixed_expenses": {
            "before": curr_fixed,
            "after": sim_fixed,
            "delta": sim_fixed - curr_fixed
        },
        "runway": {
            "before_months": curr_runway["runway_months"],
            "after_months": sim_runway_months,
            "delta_months": round(sim_runway_months - curr_runway["runway_months"], 1),
            "before_status": curr_runway["runway_status"],
            "after_status": sim_runway_status
        },
        "goal_delays": goal_delays,
        "verdict": verdict,
        "verdict_title": verdict_title,
        "verdict_message": verdict_message,
        "recommendations": recommendations,
        "alternative_option": alt_summary
    }
