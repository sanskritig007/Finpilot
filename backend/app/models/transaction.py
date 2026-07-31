# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Date, Numeric, ForeignKey, DateTime
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
# pyrefly: ignore [missing-import]
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base

class Transaction(Base):
    __tablename__ = "transactions"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    type = Column(String(20), nullable=False)  # 'expense', 'income', 'transfer', 'refund'
    category = Column(String(100), default="Uncategorized", nullable=False)
    description = Column(String, nullable=False)
    transaction_hash = Column(String(64), nullable=False, index=True)

    user = relationship("User", back_populates="transactions")
