import unittest
import uuid
from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.goal import Goal
from app.models.fixed_commitment import FixedCommitment
from app.services.commitment_service import detect_recurring_commitments, get_commitments_with_status
from app.services.finance_logic import get_upcoming_fixed_expenses, get_financial_runway, get_safe_to_spend, get_total_balance

class TestCommitmentsAndRunway(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = self.SessionLocal()
        
        self.user_id = uuid.uuid4()
        user = User(id=self.user_id, email="investor@apple.com")
        self.db.add(user)
        
        # Add bank account with 100,000 balance
        account = Account(user_id=self.user_id, current_balance=Decimal("100000.00"), name="Primary Checking")
        self.db.add(account)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_recurring_detection_algorithm(self):
        # Create transactions repeating ~30 days apart (e.g. Netflix subscription)
        t1 = Transaction(
            user_id=self.user_id,
            date=date(2026, 6, 5),
            amount=Decimal("649.00"),
            type="expense",
            category="Entertainment",
            description="Netflix Subscription",
            transaction_hash=str(uuid.uuid4())
        )
        t2 = Transaction(
            user_id=self.user_id,
            date=date(2026, 7, 5),
            amount=Decimal("649.00"),
            type="expense",
            category="Entertainment",
            description="Netflix Subscription",
            transaction_hash=str(uuid.uuid4())
        )
        t3 = Transaction(
            user_id=self.user_id,
            date=date(2026, 8, 5),
            amount=Decimal("649.00"),
            type="expense",
            category="Entertainment",
            description="Netflix Subscription",
            transaction_hash=str(uuid.uuid4())
        )
        # Random non-recurring expense
        t4 = Transaction(
            user_id=self.user_id,
            date=date(2026, 7, 12),
            amount=Decimal("3500.00"),
            type="expense",
            category="Shopping",
            description="Zara Jacket",
            transaction_hash=str(uuid.uuid4())
        )
        self.db.add_all([t1, t2, t3, t4])
        self.db.commit()

        # Run recurring detection algorithm
        detected = detect_recurring_commitments(self.db, self.user_id)
        
        self.assertEqual(len(detected), 1)
        self.assertEqual(detected[0].amount, Decimal("649.00"))
        self.assertTrue(detected[0].auto_detected)
        self.assertIn("Netflix", detected[0].name)

    def test_upcoming_fixed_expenses_and_safe_to_spend(self):
        # Create 2 commitments: Rent (20,000) and WiFi (1,500)
        c1 = FixedCommitment(
            user_id=self.user_id,
            name="Apartment Rent",
            amount=Decimal("20000.00"),
            category="Housing",
            frequency="monthly",
            due_day=5,
            status="active"
        )
        c2 = FixedCommitment(
            user_id=self.user_id,
            name="Airtel Fiber",
            amount=Decimal("1500.00"),
            category="Utilities",
            frequency="monthly",
            due_day=15,
            status="active"
        )
        self.db.add_all([c1, c2])
        self.db.commit()

        # Check total upcoming fixed expenses before any payment
        upcoming = get_upcoming_fixed_expenses(self.db, self.user_id)
        self.assertEqual(upcoming, Decimal("21500.00"))

        # Check safe to spend: 100,000 (balance) - 21,500 (fixed) = 78,500
        safe_to_spend = get_safe_to_spend(self.db, self.user_id)
        self.assertEqual(safe_to_spend, Decimal("78500.00"))

    def test_paid_commitment_deduction_in_cycle(self):
        # Add Rent commitment
        c1 = FixedCommitment(
            user_id=self.user_id,
            name="Apartment Rent",
            amount=Decimal("20000.00"),
            category="Housing",
            frequency="monthly",
            due_day=5,
            status="active"
        )
        self.db.add(c1)
        self.db.commit()

        # Simulate user already paid rent this calendar month
        today = date.today()
        paid_tx = Transaction(
            user_id=self.user_id,
            date=date(today.year, today.month, 3),
            amount=Decimal("20000.00"),
            type="expense",
            category="Housing",
            description="Apartment Rent Payment",
            transaction_hash=str(uuid.uuid4())
        )
        self.db.add(paid_tx)
        self.db.commit()

        # Rent is paid this month, so upcoming unpaid fixed expenses should now be 0.00
        upcoming = get_upcoming_fixed_expenses(self.db, self.user_id)
        self.assertEqual(upcoming, Decimal("0.00"))

    def test_financial_runway_calculation(self):
        # 100,000 balance with 20,000 monthly fixed obligation
        c1 = FixedCommitment(
            user_id=self.user_id,
            name="Rent",
            amount=Decimal("20000.00"),
            category="Housing",
            frequency="monthly",
            due_day=1,
            status="active"
        )
        self.db.add(c1)
        self.db.commit()

        runway = get_financial_runway(self.db, self.user_id)
        # 100,000 / 20,000 = 5.0 months
        self.assertEqual(runway["runway_months"], 5.0)
        self.assertEqual(runway["runway_status"], "healthy")

if __name__ == "__main__":
    unittest.main()
