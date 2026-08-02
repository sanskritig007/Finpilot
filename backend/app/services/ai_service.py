# pyrefly: ignore [missing-import]
import google.generativeai as genai
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.core.config import settings
from app.services import ai_tools

def run_chat_completion(db: Session, user_id: str, messages: list) -> str:
    """Send message history to Gemini, using Google's official SDK and automatic function calling."""
    
    # 1. Define local helper functions that act as Gemini tools.
    # We define them locally inside the function closure so they have safe access to the
    # current database Session (db) and current authenticated User ID (user_id).
    
    def get_safe_to_spend_balance() -> dict:
        """Retrieve the user's current Safe to Spend balance, Total balance, and locked goals amount."""
        return ai_tools.get_safe_to_spend_balance(db, user_id)
        
    def get_spending_by_category(category_name: str) -> dict:
        """Calculate the total spent and list recent transactions in a specific category (e.g. 'Food & Dining', 'Rent & Housing', 'Shopping', 'Travel & Transport', 'Entertainment').
        
        Args:
            category_name: The exact or partial name of the category to search.
        """
        return ai_tools.get_spending_by_category(db, user_id, category_name)
        
    def get_spending_by_description(query: str) -> dict:
        """Search transactions and sum up spending on a specific keyword or brand name (e.g. 'Swiggy', 'Uber', 'Amazon', 'Starbucks').
        
        Args:
            query: The keyword to search for in transaction descriptions.
        """
        return ai_tools.get_spending_by_description(db, user_id, query)
        
    def get_savings_goals() -> dict:
        """Retrieve the list of active and completed savings goals and target progress values."""
        return ai_tools.get_savings_goals(db, user_id)

    # 2. Configure Google GenAI API Client
    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    # 3. Initialize the Generative Model with tools and system instruction
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        tools=[
            get_safe_to_spend_balance,
            get_spending_by_category,
            get_spending_by_description,
            get_savings_goals
        ],
        system_instruction=(
            "You are FinPilot, a premium, helpful personal finance assistant. You have secure access to the user's "
            "bank transactions and savings goals through specific tools. "
            "CRITICAL RULES:\n"
            "1. NEVER guess or hallucinate numbers. If you need data, call the appropriate database tool.\n"
            "2. If you do not have a tool to answer the question, tell the user politely.\n"
            "3. Format numbers nicely (e.g. ₹45,500.00) and structure your answers with clear bullet points or headers.\n"
            "4. Be concise, polite, and focus on financial well-being."
        )
    )
    
    # 4. Map message history format from custom schema to Gemini format:
    # Gemini expects: [{"role": "user"|"model", "parts": [content_string]}]
    gemini_history = []
    
    # Map all historical messages except the very last one
    for msg in messages[:-1]:
        role = "user" if msg["role"] == "user" else "model"
        gemini_history.append({
            "role": role,
            "parts": [msg["content"]]
        })
        
    # 5. Start Gemini Chat with automatic function calling enabled!
    # The SDK will execute the local python functions, feed results to Gemini,
    # and return the final text response transparently.
    chat = model.start_chat(history=gemini_history, enable_automatic_function_calling=True)
    
    # Send the final user message to get the response
    last_user_message = messages[-1]["content"]
    response = chat.send_message(last_user_message)
    
    return response.text


def run_chat_completion_stream(db: Session, user_id: str, messages: list):
    """Send message history to Gemini, yielding chunk text using automatic function calling stream."""
    
    # 1. Define local helper functions that act as Gemini tools.
    def get_safe_to_spend_balance() -> dict:
        """Retrieve the user's current Safe to Spend balance, Total balance, and locked goals amount."""
        return ai_tools.get_safe_to_spend_balance(db, user_id)
        
    def get_spending_by_category(category_name: str) -> dict:
        """Calculate the total spent and list recent transactions in a specific category (e.g. 'Food & Dining', 'Rent & Housing', 'Shopping', 'Travel & Transport', 'Entertainment').
        
        Args:
            category_name: The exact or partial name of the category to search.
        """
        return ai_tools.get_spending_by_category(db, user_id, category_name)
        
    def get_spending_by_description(query: str) -> dict:
        """Search transactions and sum up spending on a specific keyword or brand name (e.g. 'Swiggy', 'Uber', 'Amazon', 'Starbucks').
        
        Args:
            query: The keyword to search for in transaction descriptions.
        """
        return ai_tools.get_spending_by_description(db, user_id, query)
        
    def get_savings_goals() -> dict:
        """Retrieve the list of active and completed savings goals and target progress values."""
        return ai_tools.get_savings_goals(db, user_id)

    # 2. Configure Google GenAI API Client
    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    # 3. Initialize the Generative Model with tools and system instruction
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        tools=[
            get_safe_to_spend_balance,
            get_spending_by_category,
            get_spending_by_description,
            get_savings_goals
        ],
        system_instruction=(
            "You are FinPilot, a premium, helpful personal finance assistant. You have secure access to the user's "
            "bank transactions and savings goals through specific tools. "
            "CRITICAL RULES:\n"
            "1. NEVER guess or hallucinate numbers. If you need data, call the appropriate database tool.\n"
            "2. If you do not have a tool to answer the question, tell the user politely.\n"
            "3. Format numbers nicely (e.g. ₹45,500.00) and structure your answers with clear bullet points or headers.\n"
            "4. Be concise, polite, and focus on financial well-being."
        )
    )
    
    # 4. Map message history format from custom schema to Gemini format
    gemini_history = []
    for msg in messages[:-1]:
        role = "user" if msg["role"] == "user" else "model"
        gemini_history.append({
            "role": role,
            "parts": [msg["content"]]
        })
        
    # 5. Start Gemini Chat with automatic function calling enabled!
    chat = model.start_chat(history=gemini_history, enable_automatic_function_calling=True)
    
    # Send the final user message to get the response stream
    last_user_message = messages[-1]["content"]
    response_stream = chat.send_message(last_user_message, stream=True)
    
    for chunk in response_stream:
        if chunk.text:
            yield chunk.text

