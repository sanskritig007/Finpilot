import unittest
import uuid
from datetime import date
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.goal import Goal
from app.models.fixed_commitment import FixedCommitment
from app.services.analytics_service import get_spending_analytics

class TestSpendingAnalytics(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = self.SessionLocal()
        
        self.user_id = uuid.uuid4()
        user = User(id=self.user_id, email="analytics_tester@apple.com")
        self.db.add(user)
        
        # Add account with 100,000 balance
        account = Account(user_id=self.user_id, current_balance=Decimal("100000.00"), name="Main Account")
        self.db.add(account)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_50_30_20_allocation_math(self):
        today = date.today()
        
        # 1. Needs: Rent Fixed Commitment = 25,000
        rent = FixedCommitment(
            user_id=self.user_id,
            name="Apartment Rent",
            amount=Decimal("25000.00"),
            category="Housing",
            frequency="monthly",
            due_day=5,
            status="active"
        )
        self.db.add(rent)
        
        # 2. Wants: Dining (5,000) + Shopping (10,000) = 15,000
        t1 = Transaction(
            user_id=self.user_id,
            date=date(today.year, today.month, min(today.day, 10)),
            amount=Decimal("5000.00"),
            type="expense",
            category="Food & Dining",
            description="Fine Dining",
            transaction_hash=str(uuid.uuid4())
        )
        t2 = Transaction(
            user_id=self.user_id,
            date=date(today.year, today.month, min(today.day, 12)),
            amount=Decimal("10000.00"),
            type="expense",
            category="Shopping",
            description="Designer Apparel",
            transaction_hash=str(uuid.uuid4())
        )
        self.db.add_all([t1, t2])
        
        # 3. Savings: Goal target 10,000
        goal = Goal(
            user_id=self.user_id,
            name="Emergency Fund",
            target_amount=Decimal("10000.00"),
            current_amount=Decimal("0.00"),
            status="active"
        )
        self.db.add(goal)
        self.db.commit()

        # Run analytics
        res = get_spending_analytics(self.db, self.user_id)
        alloc = res["allocation"]

        # Needs = 25,000 (50.0%), Wants = 15,000 (30.0%), Savings = 10,000 (20.0%)
        # Total Pool = 50,000
        self.assertEqual(alloc["needs_amount"], Decimal("25000.00"))
        self.assertEqual(alloc["wants_amount"], Decimal("15000.00"))
        self.assertEqual(alloc["savings_amount"], Decimal("10000.00"))
        self.assertEqual(alloc["total_pool"], Decimal("50000.00"))
        self.assertEqual(alloc["needs_percent"], 50.0)
        self.assertEqual(alloc["wants_percent"], 30.0)
        self.assertEqual(alloc["savings_percent"], 20.0)

    def test_spending_velocity_calculation(self):
        today = date.today()
        # Create 1 expense this month
        t1 = Transaction(
            user_id=self.user_id,
            date=date(today.year, today.month, min(today.day, 5)),
            amount=Decimal("3000.00"),
            type="expense",
            category="Food & Dining",
            description="Groceries",
            transaction_hash=str(uuid.uuid4())
        )
        self.db.add(t1)
        self.db.commit()

        res = get_spending_analytics(self.db, self.user_id)
        vel = res["velocity"]
        
        self.assertEqual(vel["total_spent_mtd"], Decimal("3000.00"))
        self.assertGreater(vel["current_daily_pace"], Decimal("0.00"))
        self.assertIn(vel["velocity_status"], ["on_target", "elevated", "rapid_burn"])

if __name__ == "__main__":
    unittest.main()
