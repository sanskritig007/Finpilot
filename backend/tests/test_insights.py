import unittest
import io
import os
import uuid
from unittest.mock import patch, MagicMock
from datetime import date
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import get_db
from app.models.base import Base
from app.models.user import User
from app.models.transaction import Transaction
from app.services.ai_service import run_chat_completion

class TestAIInsightsAndGuardrails(unittest.TestCase):
    def setUp(self):
        self.db_path = "test_insights.db"
        if os.path.exists(self.db_path):
            try:
                os.remove(self.db_path)
            except Exception:
                pass
                
        # Set up a file-based SQLite database
        self.engine = create_engine(f"sqlite:///{self.db_path}")
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = self.SessionLocal()
        
        # Create a test user
        self.test_user = User(email="insights_user@example.com", password_hash="hashed_pw")
        self.db.add(self.test_user)
        self.db.commit()
        self.db.refresh(self.test_user)
        
        # Override FastAPI dependencies
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

    def test_insights_endpoint_empty_state(self):
        # When transaction history is empty, it returns static onboarding advice (blank-slate state)
        response = self.client.get("/api/v1/dashboard/insights")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["analysis"], "No transaction history detected yet.")
        self.assertIn("Upload a bank statement CSV", data["recommendations"][0])
        self.assertIn("Welcome to FinPilot", data["encouragement"])

    @patch('google.generativeai.GenerativeModel')
    def test_insights_endpoint_with_data_gemini(self, mock_model_class):
        # Add a transaction to trigger Gemini call
        tx = Transaction(
            user_id=self.test_user.id,
            date=date(2026, 8, 16),
            amount=Decimal("150.00"),
            type="expense",
            category="Food & Dining",
            description="Starbucks Chai",
            transaction_hash="hash_abc"
        )
        self.db.add(tx)
        self.db.commit()

        # Mock Gemini completion response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = (
            '{"analysis": "You spend heavily on coffee.", '
            '"recommendations": ["Limit coffee purchases", "Create a budget"], '
            '"encouragement": "Smart choices yield rich futures!"}'
        )
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model

        response = self.client.get("/api/v1/dashboard/insights")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["analysis"], "You spend heavily on coffee.")
        self.assertEqual(len(data["recommendations"]), 2)
        self.assertEqual(data["encouragement"], "Smart choices yield rich futures!")

    @patch('google.generativeai.GenerativeModel')
    def test_chat_guardrail_unrelated_chatter(self, mock_model_class):
        # Mock Gemini model returning refusal to answer
        mock_model = MagicMock()
        mock_chat = MagicMock()
        mock_response = MagicMock()
        
        refusal_msg = (
            "I am FinPilot, your dedicated financial assistant. "
            "I can only answer questions related to your transaction logs, safe-to-spend limits, savings goals, "
            "or general personal budgeting. Please ask a financial question!"
        )
        mock_response.text = refusal_msg
        mock_chat.send_message.return_value = mock_response
        mock_model.start_chat.return_value = mock_chat
        mock_model_class.return_value = mock_model

        # Query chat with general chitchat
        messages = [{"role": "user", "content": "How are you doing today?"}]
        response = run_chat_completion(self.db, str(self.test_user.id), messages)
        
        self.assertIn("I can only answer questions related to your transaction logs", response)
