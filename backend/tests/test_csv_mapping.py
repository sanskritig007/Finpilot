import unittest
import io
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

class TestCSVMapping(unittest.TestCase):
    def setUp(self):
        self.db_path = "test_csv_mapping.db"
        if os.path.exists(self.db_path):
            try:
                os.remove(self.db_path)
            except Exception:
                pass
                
        # Set up a file-based SQLite database for integration testing
        self.engine = create_engine(f"sqlite:///{self.db_path}")
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Build tables
        Base.metadata.create_all(bind=self.engine)
        self.db = self.SessionLocal()
        
        # Create a test user
        self.test_user = User(email="mapping_user@example.com", password_hash="hashed_pw")
        self.db.add(self.test_user)
        self.db.commit()
        self.db.refresh(self.test_user)
        
        # Override dependency and auth middleware dependency
        # To make it simple, we override get_current_user to yield this user
        from app.api.deps import get_current_user
        app.dependency_overrides[get_current_user] = lambda: self.test_user
        
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
        from app.api.deps import get_current_user
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db, None)
        if os.path.exists(self.db_path):
            try:
                os.remove(self.db_path)
            except Exception:
                pass

    def test_custom_csv_column_mapping_upload(self):
        # CSV with non-standard columns: 'Value Date', 'Narrative', 'Outflow', 'Category'
        csv_data = (
            "Value Date,Narrative,Outflow,Category\n"
            "2026-08-11,Swiggy Lunch,-450.00,Food\n"
            "2026-08-12,Refund from Swiggy,120.00,Food\n"
        )
        
        file_payload = {"file": ("bank_statement.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
        
        # Make request with custom query mapping parameters
        params = {
            "mapping_date": "Value Date",
            "mapping_desc": "Narrative",
            "mapping_amount": "Outflow",
            "mapping_category": "Category"
        }
        
        response = self.client.post("/api/v1/transactions/upload", files=file_payload, params=params)
        self.assertEqual(response.status_code, 201)
        
        data = response.json()
        self.assertEqual(data["total_imported"], 2)
        
        # Verify in DB
        txs = self.db.query(Transaction).filter(Transaction.user_id == self.test_user.id).all()
        self.assertEqual(len(txs), 2)
        
        # Check first transaction details
        tx1 = next(t for t in txs if t.description == "Swiggy Lunch")
        self.assertEqual(tx1.amount, 450.00)
        self.assertEqual(tx1.type, "expense")
        self.assertEqual(tx1.category, "Food")
        self.assertEqual(tx1.date.strftime("%Y-%m-%d"), "2026-08-11")

    def test_missing_mapped_column_error(self):
        csv_data = (
            "Value Date,Narrative,Outflow\n"
            "2026-08-11,Swiggy,-450.00\n"
        )
        
        file_payload = {"file": ("bank_statement.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
        
        # Mapping column 'cost' which doesn't exist in CSV headers
        params = {
            "mapping_date": "Value Date",
            "mapping_desc": "Narrative",
            "mapping_amount": "cost"
        }
        
        response = self.client.post("/api/v1/transactions/upload", files=file_payload, params=params)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Mapped column 'cost' not found in CSV headers", response.json()["detail"])
