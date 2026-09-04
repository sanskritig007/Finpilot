from sqlalchemy import Column, String, Numeric, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base

class FixedCommitment(Base):
    __tablename__ = "fixed_commitments"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    category = Column(String(100), default="Subscriptions", nullable=False)
    frequency = Column(String(20), default="monthly", nullable=False)  # 'monthly', 'yearly', 'weekly'
    due_day = Column(Integer, default=1, nullable=False)  # 1 to 31
    auto_detected = Column(Boolean, default=False, nullable=False)
    status = Column(String(20), default="active", nullable=False)  # 'active', 'paused'

    user = relationship("User", back_populates="fixed_commitments")
