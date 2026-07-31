# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Date, Numeric, ForeignKey
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
# pyrefly: ignore [missing-import]
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base

class Goal(Base):
    __tablename__ = "goals"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    target_amount = Column(Numeric(12, 2), nullable=False)
    current_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    target_date = Column(Date, nullable=True)
    status = Column(String(20), default="active", nullable=False)  # 'active', 'completed', 'cancelled'

    user = relationship("User", back_populates="goals")
