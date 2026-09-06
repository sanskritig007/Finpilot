from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.simulator_schema import SimulationRequest, SimulationResult
from app.services import simulation_service

router = APIRouter()

@router.post("/simulate", response_model=SimulationResult, status_code=status.HTTP_200_OK)
def run_purchase_simulation(
    payload: SimulationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Simulate a hypothetical purchase (Upfront Cash or No-Cost EMI)
    to calculate real-time impact on Safe-to-Spend, Financial Runway,
    and Active Savings Goals without altering persistent ledger data.
    """
    return simulation_service.simulate_purchase(db, current_user.id, payload)
