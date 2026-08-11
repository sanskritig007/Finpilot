import unittest
import uuid
from datetime import date
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
# Make sure all models are imported so SQLAlchemy knows their metadata
from app.models.user import User
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.goal import Goal
from app.schemas.transaction_schema import TransactionCreate
from app.services.transaction_service import create_manual_transaction

class TestManualTransactions(unittest.TestCase):
    def setUp(self):
        # Create an in-memory SQLite database for fast isolated unit testing
        self.engine = create_engine("sqlite:///:memory:")
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Build schemas
        Base.metadata.create_all(bind=self.engine)
        
        self.db = self.SessionLocal()
        
        # Set up two test users to verify user isolation
        self.user1_id = uuid.uuid4()
        self.user2_id = uuid.uuid4()
        
        user1 = User(id=self.user1_id, email="user1@example.com")
        user2 = User(id=self.user2_id, email="user2@example.com")
        
        self.db.add(user1)
        self.db.add(user2)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_create_manual_expense(self):
        # Log a manual expense transaction
        payload = TransactionCreate(
            date=date(2026, 8, 11),
            amount=Decimal("1500.50"),
            type="expense",
            category="Food & Dining",
            description="Restaurant dinner"
        )
        
        tx = create_manual_transaction(self.db, self.user1_id, payload)
        
        # Assertions
        self.assertEqual(tx.user_id, self.user1_id)
        self.assertEqual(tx.amount, Decimal("1500.50"))
        self.assertEqual(tx.type, "expense")
        self.assertEqual(tx.category, "Food & Dining")
        self.assertEqual(tx.description, "Restaurant dinner")
        self.assertIsNotNone(tx.transaction_hash)

    def test_create_manual_income(self):
        # Log a manual income transaction
        payload = TransactionCreate(
            date=date(2026, 8, 11),
            amount=Decimal("50000.00"),
            type="income",
            category="Salary",
            description="Monthly Paycheck"
        )
        
        tx = create_manual_transaction(self.db, self.user1_id, payload)
        
        # Assertions
        self.assertEqual(tx.user_id, self.user1_id)
        self.assertEqual(tx.amount, Decimal("50000.00"))
        self.assertEqual(tx.type, "income")
        self.assertEqual(tx.category, "Salary")
        self.assertEqual(tx.description, "Monthly Paycheck")

    def test_duplicate_transaction_validation(self):
        # Log first transaction
        payload1 = TransactionCreate(
            date=date(2026, 8, 11),
            amount=Decimal("100.00"),
            type="expense",
            category="Shopping",
            description="Grocery"
        )
        create_manual_transaction(self.db, self.user1_id, payload1)
        
        # Log second identical transaction for the same user
        payload2 = TransactionCreate(
            date=date(2026, 8, 11),
            amount=Decimal("100.00"),
            type="expense",
            category="Shopping",
            description="Grocery"
        )
        
        # Assert duplicate creation fails with ValueError
        with self.assertRaises(ValueError) as context:
            create_manual_transaction(self.db, self.user1_id, payload2)
            
        self.assertIn("already exists", str(context.exception))

    def test_user_isolation(self):
        # User 1 logs a transaction
        payload_u1 = TransactionCreate(
            date=date(2026, 8, 11),
            amount=Decimal("200.00"),
            type="expense",
            category="Shopping",
            description="Book Store"
        )
        tx_u1 = create_manual_transaction(self.db, self.user1_id, payload_u1)
        
        # User 2 logs the EXACT SAME details
        payload_u2 = TransactionCreate(
            date=date(2026, 8, 11),
            amount=Decimal("200.00"),
            type="expense",
            category="Shopping",
            description="Book Store"
        )
        
        # Assert User 2 can create it without conflict, because of user_id hash partitioning!
        tx_u2 = create_manual_transaction(self.db, self.user2_id, payload_u2)
        
        self.assertEqual(tx_u1.user_id, self.user1_id)
        self.assertEqual(tx_u2.user_id, self.user2_id)
        self.assertNotEqual(tx_u1.transaction_hash, tx_u2.transaction_hash)

        # Assert querying transactions returns separate rows for each user
        u1_txs = self.db.query(Transaction).filter(Transaction.user_id == self.user1_id).all()
        u2_txs = self.db.query(Transaction).filter(Transaction.user_id == self.user2_id).all()
        
        self.assertEqual(len(u1_txs), 1)
        self.assertEqual(len(u2_txs), 1)
        self.assertEqual(u1_txs[0].id, tx_u1.id)
        self.assertEqual(u2_txs[0].id, tx_u2.id)

if __name__ == "__main__":
    unittest.main()
