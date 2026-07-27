from sqlalchemy import Column, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base

class Account(Base):
    __tablename__ = "accounts"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False, default="Main Account")
    current_balance = Column(Numeric(12, 2), default=0.00, nullable=False)
    
    user = relationship("User", back_populates="accounts")
