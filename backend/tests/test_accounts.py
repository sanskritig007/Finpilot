import unittest
import uuid
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.user import User
from app.models.account import Account
from app.schemas.account_schema import AccountCreate, AccountUpdate
from app.services import networth_service

class TestMultiAccountAndNetWorth(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = self.SessionLocal()
        
        self.user_id = uuid.uuid4()
        user = User(id=self.user_id, email="portfolio@apple.com")
        self.db.add(user)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_default_account_auto_provisioning(self):
        accounts = networth_service.get_user_accounts(self.db, self.user_id)
        self.assertEqual(len(accounts), 1)
        self.assertEqual(accounts[0].name, "Main Checking Account")
        self.assertEqual(accounts[0].account_type, "checking")
        self.assertTrue(accounts[0].is_primary)

    def test_create_and_primary_toggle(self):
        # 1. Create checking account
        acc1_in = AccountCreate(
            name="HDFC Salary",
            institution="HDFC Bank",
            account_type="checking",
            current_balance=Decimal("50000.00"),
            is_primary=True
        )
        acc1 = networth_service.create_account(self.db, self.user_id, acc1_in)
        self.assertTrue(acc1.is_primary)

        # 2. Create ICICI account and set as primary
        acc2_in = AccountCreate(
            name="ICICI Savings",
            institution="ICICI Bank",
            account_type="savings",
            current_balance=Decimal("100000.00"),
            is_primary=True
        )
        acc2 = networth_service.create_account(self.db, self.user_id, acc2_in)
        self.assertTrue(acc2.is_primary)

        # Re-fetch acc1 and verify is_primary is now False
        refreshed_acc1 = networth_service.get_account_by_id(self.db, self.user_id, acc1.id)
        self.assertFalse(refreshed_acc1.is_primary)

    def test_deterministic_net_worth_calculation(self):
        # Liquid assets: 50,000 (checking) + 100,000 (savings) = 150,000
        # Investments: 200,000 (stocks) + 100,000 (mutual fund) = 300,000
        # Total Assets = 450,000
        # Liabilities: 30,000 (credit card) + 70,000 (loan) = 100,000
        # Net Worth = 350,000
        accs = [
            Account(user_id=self.user_id, name="HDFC Checking", institution="HDFC", account_type="checking", current_balance=Decimal("50000.00"), is_primary=True),
            Account(user_id=self.user_id, name="SBI Savings", institution="SBI", account_type="savings", current_balance=Decimal("100000.00")),
            Account(user_id=self.user_id, name="Zerodha Kite", institution="Zerodha", account_type="investment", current_balance=Decimal("200000.00")),
            Account(user_id=self.user_id, name="Groww MF", institution="Groww", account_type="investment", current_balance=Decimal("100000.00")),
            Account(user_id=self.user_id, name="ICICI Sapphiro", institution="ICICI", account_type="credit_card", current_balance=Decimal("30000.00"), credit_limit=Decimal("100000.00")),
            Account(user_id=self.user_id, name="HDFC Car Loan", institution="HDFC", account_type="loan", current_balance=Decimal("70000.00")),
        ]
        self.db.add_all(accs)
        self.db.commit()

        summary = networth_service.calculate_net_worth(self.db, self.user_id)

        self.assertEqual(summary["liquid_cash"], Decimal("150000.00"))
        self.assertEqual(summary["investments"], Decimal("300000.00"))
        self.assertEqual(summary["total_assets"], Decimal("450000.00"))
        self.assertEqual(summary["credit_dues"], Decimal("30000.00"))
        self.assertEqual(summary["loans"], Decimal("70000.00"))
        self.assertEqual(summary["total_liabilities"], Decimal("100000.00"))
        self.assertEqual(summary["net_worth"], Decimal("350000.00"))
        self.assertEqual(summary["credit_utilization"], 30.0)
        self.assertEqual(summary["credit_utilization_status"], "healthy")

    def test_credit_card_utilization_thresholds(self):
        # 1. Healthy: 20,000 / 100,000 = 20%
        card1 = Account(
            user_id=self.user_id,
            name="Axis Atlas",
            institution="Axis Bank",
            account_type="credit_card",
            current_balance=Decimal("20000.00"),
            credit_limit=Decimal("100000.00")
        )
        self.db.add(card1)
        self.db.commit()

        summary1 = networth_service.calculate_net_worth(self.db, self.user_id)
        self.assertEqual(summary1["credit_utilization"], 20.0)
        self.assertEqual(summary1["credit_utilization_status"], "healthy")

        # 2. Moderate: 45,000 / 100,000 = 45%
        card1.current_balance = Decimal("45000.00")
        self.db.commit()
        summary2 = networth_service.calculate_net_worth(self.db, self.user_id)
        self.assertEqual(summary2["credit_utilization"], 45.0)
        self.assertEqual(summary2["credit_utilization_status"], "moderate")

        # 3. High Risk: 75,000 / 100,000 = 75%
        card1.current_balance = Decimal("75000.00")
        self.db.commit()
        summary3 = networth_service.calculate_net_worth(self.db, self.user_id)
        self.assertEqual(summary3["credit_utilization"], 75.0)
        self.assertEqual(summary3["credit_utilization_status"], "high_risk")

    def test_account_update_and_delete(self):
        acc = Account(
            user_id=self.user_id,
            name="Old Account",
            institution="Bank",
            account_type="checking",
            current_balance=Decimal("1000.00")
        )
        self.db.add(acc)
        self.db.commit()

        # Update
        update_in = AccountUpdate(name="New Salary Account", current_balance=Decimal("25000.00"))
        updated = networth_service.update_account(self.db, self.user_id, acc.id, update_in)
        self.assertEqual(updated.name, "New Salary Account")
        self.assertEqual(updated.current_balance, Decimal("25000.00"))

        # Delete
        deleted = networth_service.delete_account(self.db, self.user_id, acc.id)
        self.assertTrue(deleted)
        self.assertIsNone(networth_service.get_account_by_id(self.db, self.user_id, acc.id))

if __name__ == "__main__":
    unittest.main()
