from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.analytics_schema import SpendingAnalyticsResponse
from app.services import analytics_service

router = APIRouter()

@router.get("/spending", response_model=SpendingAnalyticsResponse, status_code=status.HTTP_200_OK)
def get_spending_analytics_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve Apple-grade Spending Velocity and 50/30/20 Capital Allocation Breakdown.
    """
    return analytics_service.get_spending_analytics(db, current_user.id)
