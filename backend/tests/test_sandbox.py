import unittest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import get_db
from app.models.base import Base
from app.models.user import User
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.goal import Goal

class TestSandboxMode(unittest.TestCase):
    def setUp(self):
        self.db_path = "test_sandbox.db"
        if os.path.exists(self.db_path):
            try:
                os.remove(self.db_path)
            except Exception:
                pass
                
        # File-based SQLite ensures connection sharing is thread-safe for FastAPI TestClient
        self.engine = create_engine(f"sqlite:///{self.db_path}")
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Build tables
        Base.metadata.create_all(bind=self.engine)
        self.db = self.SessionLocal()
        
        def override_get_db():
            db = self.SessionLocal()
            try:
                yield db
            finally:
                db.close()
                
        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

    def tearDown(self):
        self.db.close()
        app.dependency_overrides.clear()
        if os.path.exists(self.db_path):
            try:
                os.remove(self.db_path)
            except Exception:
                pass

    def test_sandbox_login_and_seeding(self):
        # Hit sandbox endpoint
        response = self.client.post("/api/v1/auth/sandbox")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
        
        # Query DB to check user sandbox@finpilot.ai is created
        user = self.db.query(User).filter(User.email == "sandbox@finpilot.ai").first()
        self.assertIsNotNone(user)
        
        # Check Account seeded
        account = self.db.query(Account).filter(Account.user_id == user.id).first()
        self.assertIsNotNone(account)
        self.assertEqual(account.current_balance, 46850.25)
        
        # Check Goals seeded
        goals = self.db.query(Goal).filter(Goal.user_id == user.id).all()
        self.assertEqual(len(goals), 1)
        self.assertEqual(goals[0].name, "goa trip")
        self.assertEqual(goals[0].target_amount, 15000.00)
        self.assertEqual(goals[0].current_amount, 10500.00)
        
        # Check Transactions seeded (should be exactly 10 mock entries)
        txs = self.db.query(Transaction).filter(Transaction.user_id == user.id).all()
        self.assertEqual(len(txs), 10)
        
        # Check that duplicate endpoint call resets it correctly without conflicts
        response2 = self.client.post("/api/v1/auth/sandbox")
        self.assertEqual(response2.status_code, 200)
        
        # Assert database counts remain the same (properly cleared before seeding)
        user_count = self.db.query(User).count()
        self.assertEqual(user_count, 1)
        tx_count = self.db.query(Transaction).count()
        self.assertEqual(tx_count, 10)
        goal_count = self.db.query(Goal).count()
        self.assertEqual(goal_count, 1)
