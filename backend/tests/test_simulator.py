import unittest
import uuid
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.user import User
from app.models.account import Account
from app.models.goal import Goal
from app.models.fixed_commitment import FixedCommitment
from app.schemas.simulator_schema import SimulationRequest
from app.services.simulation_service import simulate_purchase

class TestPurchaseSimulator(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = self.SessionLocal()
        
        self.user_id = uuid.uuid4()
        user = User(id=self.user_id, email="simulator_tester@apple.com")
        self.db.add(user)
        
        # Add account with 100,000 balance
        account = Account(user_id=self.user_id, current_balance=Decimal("100000.00"), name="Main Checking")
        self.db.add(account)
        
        # Add active commitment: Rent 20,000
        rent = FixedCommitment(
            user_id=self.user_id,
            name="Apartment Rent",
            amount=Decimal("20000.00"),
            category="Housing",
            frequency="monthly",
            due_day=5,
            status="active"
        )
        self.db.add(rent)
        
        # Add active savings goal: Emergency Fund 50,000 (currently 20,000 saved)
        goal = Goal(
            user_id=self.user_id,
            name="Emergency Fund",
            target_amount=Decimal("50000.00"),
            current_amount=Decimal("20000.00"),
            status="active"
        )
        self.db.add(goal)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_simulate_upfront_safe(self):
        # Small purchase of 5,000 upfront
        req = SimulationRequest(
            name="Noise Cancelling Headphones",
            amount=Decimal("5000.00"),
            payment_mode="upfront"
        )
        res = simulate_purchase(self.db, self.user_id, req)
        
        # Current Safe to Spend was: 100,000 - 30,000 (remaining goal) - 20,000 (rent) = 50,000
        # After 5,000 upfront, Safe to Spend should be 45,000
        self.assertEqual(res["total_balance"]["after"], Decimal("95000.00"))
        self.assertEqual(res["safe_to_spend"]["after"], Decimal("45000.00"))
        self.assertEqual(res["verdict"], "safe")
        self.assertIn("Safe", res["verdict_title"])

    def test_simulate_upfront_critical(self):
        # Massive purchase of 95,000 upfront
        req = SimulationRequest(
            name="High End Gaming Rig",
            amount=Decimal("95000.00"),
            payment_mode="upfront"
        )
        res = simulate_purchase(self.db, self.user_id, req)
        
        # After 95,000 upfront: Balance = 5,000, Safe to spend = 5,000 - 30,000 - 20,000 = -45,000
        self.assertEqual(res["total_balance"]["after"], Decimal("5000.00"))
        self.assertLess(res["safe_to_spend"]["after"], Decimal("0.00"))
        self.assertEqual(res["verdict"], "critical")
        self.assertIn("High Risk", res["verdict_title"])

    def test_simulate_emi_mode(self):
        # 30,000 purchase on 6-Month No-Cost EMI (5,000/mo)
        req = SimulationRequest(
            name="iPhone 15",
            amount=Decimal("30000.00"),
            payment_mode="emi",
            emi_months=6
        )
        res = simulate_purchase(self.db, self.user_id, req)
        
        # Balance remains 100,000
        self.assertEqual(res["total_balance"]["after"], Decimal("100000.00"))
        # Fixed obligations increase by 5,000 (from 20,000 to 25,000)
        self.assertEqual(res["upcoming_fixed_expenses"]["after"], Decimal("25000.00"))
        self.assertEqual(res["monthly_emi_amount"], Decimal("5000.00"))
        # Safe to spend: 100,000 - 30,000 (goal) - 25,000 = 45,000
        self.assertEqual(res["safe_to_spend"]["after"], Decimal("45000.00"))
        self.assertEqual(res["verdict"], "safe")

    def test_goal_delays_projection(self):
        req = SimulationRequest(
            name="Designer Watch",
            amount=Decimal("25000.00"),
            payment_mode="upfront"
        )
        res = simulate_purchase(self.db, self.user_id, req)
        
        self.assertEqual(len(res["goal_delays"]), 1)
        self.assertEqual(res["goal_delays"][0]["goal_name"], "Emergency Fund")
        self.assertGreater(res["goal_delays"][0]["delay_days"], 0)

if __name__ == "__main__":
    unittest.main()
