import unittest
import uuid
from datetime import date
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction_schema import TransactionCreate
from app.services.categorizer import predict_category
from app.services.transaction_service import create_manual_transaction

class TestAutoCategorization(unittest.TestCase):
    def setUp(self):
        # Create in-memory SQLite database
        self.engine = create_engine("sqlite:///:memory:")
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = self.SessionLocal()
        
        self.user_id = uuid.uuid4()
        user = User(id=self.user_id, email="categorizer@example.com")
        self.db.add(user)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_predict_category_heuristics(self):
        # Verify custom predictions mapping
        self.assertEqual(predict_category("Zomato lunch order", "expense"), "Food & Dining")
        self.assertEqual(predict_category("Swiggy groceries", "expense"), "Food & Dining")
        self.assertEqual(predict_category("Amazon India online store", "expense"), "Shopping")
        self.assertEqual(predict_category("House rent payment", "expense"), "Rent & Housing")
        self.assertEqual(predict_category("Netflix Premium Subscription", "expense"), "Entertainment")
        self.assertEqual(predict_category("Jio Fiber Internet Recharge", "expense"), "Bills & Utilities")
        self.assertEqual(predict_category("Uber ride to office", "expense"), "Travel & Transport")
        self.assertEqual(predict_category("Groww Mutual Fund SIP", "expense"), "Investment")
        self.assertEqual(predict_category("Monthly paycheck credit", "income"), "Salary")
        self.assertEqual(predict_category("Amazon refund cash credit", "income"), "Refund")
        self.assertEqual(predict_category("Random transfer entry", "expense"), "Uncategorized")

    def test_manual_transaction_auto_categorization(self):
        # Log a manual transaction leaving category as Uncategorized
        payload = TransactionCreate(
            date=date(2026, 8, 16),
            amount=Decimal("1500.00"),
            type="expense",
            category="Uncategorized",
            description="Starbucks Coffee"
        )
        
        tx = create_manual_transaction(self.db, self.user_id, payload)
        
        # Verify category was automatically predicted
        self.assertEqual(tx.category, "Food & Dining")
        
        # Log another with pre-specified category to verify it is NOT overwritten
        payload2 = TransactionCreate(
            date=date(2026, 8, 16),
            amount=Decimal("200.00"),
            type="expense",
            category="Shopping", # Manually overridden by user
            description="Starbucks mug"
        )
        tx2 = create_manual_transaction(self.db, self.user_id, payload2)
        self.assertEqual(tx2.category, "Shopping")
