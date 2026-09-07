from sqlalchemy import Column, String, Numeric, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base

class Account(Base):
    __tablename__ = "accounts"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False, default="Main Account")
    institution = Column(String(100), nullable=True, default="Bank")
    account_type = Column(String(50), nullable=False, default="checking")  # 'checking', 'savings', 'investment', 'credit_card', 'loan'
    current_balance = Column(Numeric(12, 2), default=0.00, nullable=False)
    credit_limit = Column(Numeric(12, 2), nullable=True, default=None)  # Only for credit_card / lines of credit
    is_primary = Column(Boolean, default=False, nullable=False)
    
    user = relationship("User", back_populates="accounts")

