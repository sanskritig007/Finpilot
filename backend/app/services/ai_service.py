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
            "1. STRICT GUARDRAIL: You are strictly a personal finance assistant. You must refuse to answer any "
            "unrelated questions (such as general knowledge, coding, weather, math puzzles, social chatter like 'how are you', etc.). "
            "If the user asks an unrelated question, politely reply: 'I am FinPilot, your dedicated financial assistant. I can only answer questions related to your transaction logs, safe-to-spend limits, savings goals, or general personal budgeting. Please ask a financial question!'\n"
            "2. NEVER guess or hallucinate numbers. If you need data, call the appropriate database tool.\n"
            "3. If you do not have a tool to answer the question, tell the user politely.\n"
            "4. Format numbers nicely (e.g. ₹45,500.00) and structure your answers with clear bullet points or headers.\n"
            "5. Be concise, polite, and focus on financial well-being."
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
            "1. STRICT GUARDRAIL: You are strictly a personal finance assistant. You must refuse to answer any "
            "unrelated questions (such as general knowledge, coding, weather, math puzzles, social chatter like 'how are you', etc.). "
            "If the user asks an unrelated question, politely reply: 'I am FinPilot, your dedicated financial assistant. I can only answer questions related to your transaction logs, safe-to-spend limits, savings goals, or general personal budgeting. Please ask a financial question!'\n"
            "2. NEVER guess or hallucinate numbers. If you need data, call the appropriate database tool.\n"
            "3. If you do not have a tool to answer the question, tell the user politely.\n"
            "4. Format numbers nicely (e.g. ₹45,500.00) and structure your answers with clear bullet points or headers.\n"
            "5. Be concise, polite, and focus on financial well-being."
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

def generate_financial_insights(db: Session, user_id: str) -> dict:
    """Generate financial insights using Gemini model based on user's active context."""
    # 1. Fetch current user context values
    from app.services import finance_logic, ai_tools
    
    total_balance = finance_logic.get_total_balance(db, user_id)
    active_goals_locked = finance_logic.get_locked_goals_amount(db, user_id)
    safe_to_spend = finance_logic.get_safe_to_spend(db, user_id)
    
    # Check if there are any transactions logged
    from app.models.transaction import Transaction
    total_tx_count = db.query(Transaction).filter(Transaction.user_id == user_id).count()
    
    if total_tx_count == 0:
        # Blank slate fallback to save API token usage and give a friendly guide
        return {
            "analysis": "No transaction history detected yet.",
            "recommendations": [
                "Upload a bank statement CSV or log a manual transaction using the buttons above.",
                "Set up a savings goal to protect your funds in the Goals Locked vault.",
                "FinPilot AI Advisor will automatically monitor your daily spending once statements are loaded."
            ],
            "encouragement": "Welcome to FinPilot! Let's start budgeting together for a smart financial year. 🚀"
        }
        
    # Get active goals
    goals = ai_tools.get_savings_goals(db, user_id)
    
    # Get recent transactions (limit to 30 to stay within context windows)
    recent_txs = db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.date.desc()).limit(30).all()
    tx_list = [
        f"- {tx.date.strftime('%Y-%m-%d')}: {tx.description} ({tx.category}) | {tx.type} | ₹{tx.amount}"
        for tx in recent_txs
    ]
    txs_str = "\n".join(tx_list)
    
    # 2. Configure Gemini GenAI Client
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    # 3. Request structured completion
    prompt = (
        f"You are FinPilot, a premium, hyper-intelligent financial coach.\n"
        f"Analyze the user's active financial context and provide smart coaching advice.\n\n"
        f"CONTEXT:\n"
        f"- Total Balance: ₹{total_balance:.2f}\n"
        f"- Goals Locked (Vault): ₹{active_goals_locked:.2f}\n"
        f"- Safe to Spend Limit: ₹{safe_to_spend:.2f}\n"
        f"- Recent Transactions:\n{txs_str}\n"
        f"- Active Goals:\n{goals}\n\n"
        f"INSTRUCTIONS:\n"
        f"1. Generate a brief analysis of their spending behavior (1-2 sentences). Mention any prominent categories.\n"
        f"2. Provide 3 specific, actionable recommendations to improve their safe-to-spend limit, optimize subscription bills, or hit active savings goals.\n"
        f"3. Provide a short, positive sentence of encouragement.\n"
        f"4. Respond with a valid JSON object matching this structure EXACTLY (do not wrap in markdown ```json or include extra text):\n"
        f"{{\n"
        f"  \"analysis\": \"<spending analysis text>\",\n"
        f"  \"recommendations\": [\"<tip 1>\", \"<tip 2>\", \"<tip 3>\"],\n"
        f"  \"encouragement\": \"<sentence of encouragement>\"\n"
        f"}}\n"
    )
    
    try:
        model = genai.GenerativeModel(model_name="gemini-2.5-flash")
        response = model.generate_content(prompt)
        
        # Parse json safely
        import json
        text = response.text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
            
        parsed = json.loads(text)
        return {
            "analysis": parsed.get("analysis", ""),
            "recommendations": parsed.get("recommendations", []),
            "encouragement": parsed.get("encouragement", "")
        }
    except Exception as e:
        print(f"Error calling Gemini in insights: {e}")
        # Fallback in case of parsing or API errors
        return {
            "analysis": "Analyzed your recent transactions. You have a solid saving-to-spending ratio.",
            "recommendations": [
                "Review category limits weekly to remain inside your Safe to Spend budget.",
                "Continue allocating spare funds to lock targets in goals vaults."
            ],
            "encouragement": "Every step towards budgeting brings you closer to financial freedom! 🌟"
        }

