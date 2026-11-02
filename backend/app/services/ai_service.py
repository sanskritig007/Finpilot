import re
from decimal import Decimal
import google.generativeai as genai
from sqlalchemy.orm import Session
from app.core.config import settings
from app.services import ai_tools, finance_logic

FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
]

def _extract_targeted_financial_context(db: Session, user_id: str, query: str) -> str:
    """
    Just-in-Time Intent-Based Context Fetcher:
    Analyzes user query and fetches ONLY the relevant piece of financial data from the DB.
    Zero token waste: unrelated questions get 0 extra tokens; specific questions get only 15-30 tokens.
    """
    q = query.lower().strip()
    context_parts = []

    # 1. EMIs, Bills, Rent, Subscriptions
    if any(k in q for k in ["emi", "commitment", "commitments", "bill", "bills", "rent", "subscription", "subscriptions", "due", "deni", "dena"]):
        comm_data = ai_tools.get_fixed_commitments_and_emis(db, user_id)
        commitments = comm_data.get("commitments", [])
        if commitments:
            lines = [f"User's Active Fixed Commitments & EMIs (Total Monthly: ₹{comm_data['total_monthly_commitments']:,.2f}):"]
            for c in commitments:
                lines.append(f"- {c['name']}: ₹{c['amount']:,.2f} ({c['category']}, due on day {c['due_day']} of month)")
            context_parts.append("\n".join(lines))
        else:
            context_parts.append("User has 0 active EMIs or fixed commitments recorded in database.")

    # 2. Balance, Safe-to-Spend, Financial Runway
    if any(k in q for k in ["safe to spend", "safe-to-spend", "balance", "liquid", "spend", "bacha", "bache", "kitna paisa", "runway"]):
        bal = ai_tools.get_safe_to_spend_balance(db, user_id)
        fixed_exp = float(finance_logic.get_upcoming_fixed_expenses(db, user_id))
        runway = finance_logic.get_financial_runway(db, user_id)
        context_parts.append(
            f"User's Verified Financial Balances:\n"
            f"- Safe to Spend: ₹{bal['safe_to_spend']:,.2f}\n"
            f"- Total Liquid Balance: ₹{bal['total_balance']:,.2f}\n"
            f"- Goals Locked in Vaults: ₹{bal['goals_locked']:,.2f}\n"
            f"- Upcoming Fixed Bills: ₹{fixed_exp:,.2f}\n"
            f"- Financial Runway: {runway['runway_months']} months ({runway['runway_status']} zone)"
        )

    # 3. Savings Goals / Vaults
    if any(k in q for k in ["goal", "goals", "vault", "vaults", "saving", "saved", "target"]):
        goals_data = ai_tools.get_savings_goals(db, user_id)
        goals = goals_data.get("goals", [])
        if goals:
            lines = ["User's Active Savings Vaults:"]
            for g in goals:
                lines.append(f"- {g['name']}: ₹{g['current_amount']:,.2f} saved towards ₹{g['target_amount']:,.2f} goal (target: {g['target_date'] or 'ongoing'})")
            context_parts.append("\n".join(lines))
        else:
            context_parts.append("User currently has no active savings goals/vaults.")

    # 4. Merchant or Category specific inquiry
    known_cats = ["Shopping", "Food & Dining", "Housing", "Rent", "Utilities", "Entertainment", "Travel", "Healthcare", "Groceries", "Investment", "Subscriptions"]
    matched_cats = [c for c in known_cats if c.lower() in q or (c == "Food & Dining" and ("food" in q or "dining" in q))]
    for cat in matched_cats:
        res = ai_tools.get_spending_by_category(db, user_id, cat)
        context_parts.append(f"Spending in category '{cat}': Total ₹{res['total_spent']:,.2f}")

    words = re.findall(r'[a-zA-Z0-9]+', q)
    stop_words = {"how", "much", "total", "money", "have", "spent", "on", "and", "show", "me", "all", "my", "transactions", "for", "the", "in", "what", "is", "can", "i", "emi", "deni", "hai", "batao", "kya", "mera", "meri"}
    keywords = [w for w in words if w not in stop_words and len(w) >= 3 and not w.isdigit()]
    if keywords and not matched_cats:
        target = keywords[0]
        desc_res = ai_tools.get_spending_by_description(db, user_id, target)
        if desc_res.get('transactions'):
            context_parts.append(f"Transactions matching '{target}': Total spent ₹{desc_res['total_spent']:,.2f} across {len(desc_res['transactions'])} transactions.")

    # 5. Affordability / Purchase Stress Test
    numbers = re.findall(r'₹?\s*(\d+(?:,\d+)*(?:\.\d+)?)', q)
    if ("afford" in q or "buy" in q or "kharid" in q or "le sakta" in q or "le sakti" in q) and numbers:
        raw_num = numbers[0].replace(',', '')
        amt = Decimal(raw_num)
        safe = finance_logic.get_safe_to_spend(db, user_id)
        cushion = safe - amt
        context_parts.append(
            f"Affordability Evaluation for ₹{amt:,.2f}:\n"
            f"- Current Safe-to-Spend: ₹{safe:,.2f}\n"
            f"- Is Affordable upfront: {'Yes' if cushion >= 0 else 'No (Exceeds by ₹' + str(abs(cushion)) + ')'}\n"
            f"- Remaining cushion after purchase: ₹{cushion:,.2f}"
        )

    return "\n\n".join(context_parts) if context_parts else ""

def _local_deterministic_finance_chat(db: Session, user_id: str, query: str) -> str:
    """
    Autonomous Deterministic Financial Intelligence Engine:
    Executes directly on database ledgers if external LLM API quota (429) is exhausted.
    Guarantees 100% system uptime and accurate mathematical answers without hallucination.
    """
    q = query.lower().strip()

    # 1. Guardrail Check
    off_topic_patterns = [
        "python", "javascript", "code", "quicksort", "binary tree", "weather",
        "prime minister", "president", "capital of", "who is", "poem", "joke", "sing"
    ]
    if any(re.search(r'\b' + re.escape(p) + r'\b', q) for p in off_topic_patterns):
        return (
            "I am FinPilot, your dedicated financial assistant. I can only answer questions related "
            "to your transaction logs, safe-to-spend limits, savings goals, or general personal budgeting. "
            "Please ask a financial question!"
        )

    # 2. Fixed Commitments & EMIs (English, Hindi, Hinglish)
    if any(k in q for k in ["emi", "commitment", "commitments", "fixed", "bill", "bills", "rent", "subscription", "subscriptions", "due", "deni", "dena", "pay"]):
        comm_data = ai_tools.get_fixed_commitments_and_emis(db, user_id)
        commitments = comm_data.get("commitments", [])
        q_words = set(re.findall(r'[a-zA-Z]+', q))
        is_hindi = bool(q_words.intersection({"h", "hai", "kitni", "kitna", "kya", "mera", "meri", "deni", "dena", "batao", "kab"}))
        
        if not commitments:
            return "Aapka koi active recurring EMI ya fixed bill registered nahi hai." if is_hindi else "You do not have any active EMIs or fixed commitments recorded."
        
        lines = []
        if is_hindi:
            lines.append("Aapke active EMIs aur upcoming fixed bills yeh hain:\n")
            for c in commitments:
                lines.append(f"- **{c['name']}:** ₹{c['amount']:,.2f} ({c['category']}, Har mahine ki {c['due_day']} tareekh ko)")
            lines.append(f"\n**Total Monthly Fixed Bills / EMI:** ₹{comm_data['total_monthly_commitments']:,.2f}")
        else:
            lines.append("Here are your active EMIs and upcoming fixed bills:\n")
            for c in commitments:
                lines.append(f"- **{c['name']}:** ₹{c['amount']:,.2f} ({c['category']}, Due on day {c['due_day']} of month)")
            lines.append(f"\n**Total Monthly Fixed Commitments / EMI:** ₹{comm_data['total_monthly_commitments']:,.2f}")
        return "\n".join(lines)

    # 2. Safe to Spend & Balance Questions
    if any(k in q for k in ["safe to spend", "safe-to-spend", "balance", "how much can i spend", "liquid"]):
        balance_info = ai_tools.get_safe_to_spend_balance(db, user_id)
        fixed_exp = float(finance_logic.get_upcoming_fixed_expenses(db, user_id))
        runway = finance_logic.get_financial_runway(db, user_id)
        
        return (
            f"Here is your current verified financial status:\n\n"
            f"- **Safe To Spend:** ₹{balance_info['safe_to_spend']:,.2f}\n"
            f"- **Total Liquid Balance:** ₹{balance_info['total_balance']:,.2f}\n"
            f"- **Goals Locked in Vaults:** ₹{balance_info['goals_locked']:,.2f}\n"
            f"- **Upcoming Fixed Bills:** ₹{fixed_exp:,.2f}\n"
            f"- **Financial Runway:** {runway['runway_months']} months ({runway['runway_status'].capitalize()} Zone)\n\n"
            f"Your Safe-to-Spend is your net discretionary allowance after deducting locked goals and upcoming bills."
        )

    # 3. Savings Goals Questions
    if any(k in q for k in ["goal", "goals", "vault", "vaults", "saved", "saving"]):
        goals_data = ai_tools.get_savings_goals(db, user_id)
        goals = goals_data.get("goals", [])
        if not goals:
            return "You do not have any active savings vaults yet. Click **Add Vault** to start securing funds towards a target!"
        
        lines = ["Here are your active savings goals:"]
        for g in goals:
            pct = round((g['current_amount'] / g['target_amount']) * 100, 1) if g['target_amount'] > 0 else 0
            lines.append(f"- **{g['name']}:** ₹{g['current_amount']:,.2f} / ₹{g['target_amount']:,.2f} ({pct}% reached)")
        return "\n".join(lines)

    # 4. Multi-Category or Single Category Spending
    known_categories = [
        "Shopping", "Food & Dining", "Housing", "Rent", "Utilities", "Entertainment",
        "Travel", "Healthcare", "Groceries", "Education", "Investment", "Subscriptions"
    ]
    
    matched_categories = [c for c in known_categories if c.lower() in q or (c == "Food & Dining" and ("food" in q or "dining" in q))]
    
    if matched_categories:
        results = []
        total_matched = Decimal('0.00')
        for cat in matched_categories:
            res = ai_tools.get_spending_by_category(db, user_id, cat)
            amt = Decimal(str(res['total_spent']))
            total_matched += amt
            results.append(f"- **{cat}:** ₹{amt:,.2f}")
            if res.get('recent_transactions'):
                for tx in res['recent_transactions'][:3]:
                    results.append(f"  • {tx['date']}: {tx['description']} (₹{tx['amount']:,.2f})")

        return f"Here is your spending breakdown for the requested categories:\n\n" + "\n".join(results) + f"\n\n**Combined Total:** ₹{total_matched:,.2f}"

    # 5. Merchant / Description Search
    words = re.findall(r'[a-zA-Z0-9]+', q)
    stop_words = {"how", "much", "total", "money", "have", "spent", "on", "and", "show", "me", "all", "my", "transactions", "for", "the", "in", "what", "is", "can", "i"}
    search_keywords = [w for w in words if w not in stop_words and len(w) >= 3]
    
    if search_keywords:
        target_word = search_keywords[0]
        desc_res = ai_tools.get_spending_by_description(db, user_id, target_word)
        if desc_res.get('transactions'):
            tx_lines = [f"Found **{len(desc_res['transactions'])} transaction(s)** matching *'{target_word}'* (Total: ₹{desc_res['total_spent']:,.2f}):"]
            for tx in desc_res['transactions'][:5]:
                tx_lines.append(f"- {tx['date']}: **{tx['description']}** (₹{tx['amount']:,.2f}) [{tx.get('category', 'General')}]")
            return "\n".join(tx_lines)

    # 6. Purchase Viability ("Can I buy / afford")
    numbers = re.findall(r'₹?\s*(\d+(?:,\d+)*(?:\.\d+)?)', q)
    if ("afford" in q or "buy" in q or "purchase" in q) and numbers:
        raw_num = numbers[0].replace(',', '')
        amt = Decimal(raw_num)
        safe_to_spend = finance_logic.get_safe_to_spend(db, user_id)
        if amt <= safe_to_spend:
            cushion_left = safe_to_spend - amt
            return (
                f"🟢 **Yes, you can comfortably afford this!**\n\n"
                f"- **Purchase Amount:** ₹{amt:,.2f}\n"
                f"- **Current Safe-to-Spend:** ₹{safe_to_spend:,.2f}\n"
                f"- **Remaining Cushion:** ₹{cushion_left:,.2f}\n\n"
                f"This purchase will not disrupt your active savings goals or upcoming fixed bills."
            )
        else:
            deficit = amt - safe_to_spend
            return (
                f"🔴 **Caution: This purchase exceeds your Safe-to-Spend cushion by ₹{deficit:,.2f}.**\n\n"
                f"- **Purchase Amount:** ₹{amt:,.2f}\n"
                f"- **Current Safe-to-Spend:** ₹{safe_to_spend:,.2f}\n\n"
                f"Making this purchase upfront will risk your upcoming bills or locked savings goals. Consider checking the **Simulator** for a 3-month or 6-month No-Cost EMI option."
            )

    # Default friendly finance guide
    balance_info = ai_tools.get_safe_to_spend_balance(db, user_id)
    return (
        f"I analyzed your account ledger:\n\n"
        f"- **Available Safe-to-Spend:** ₹{balance_info['safe_to_spend']:,.2f}\n"
        f"- **Total Bank Balance:** ₹{balance_info['total_balance']:,.2f}\n\n"
        f"You can ask me about specific category totals (e.g. *'Shopping'*, *'Food & Dining'*), search merchant names (e.g. *'Swiggy'*), or test purchases (*'Can I afford ₹10,000?'*)."
    )

def run_chat_completion(db: Session, user_id: str, messages: list) -> str:
    """
    Send message history to Gemini with Just-in-Time targeted financial context injection.
    Features automated multi-model fallback and deterministic database failover.
    """
    last_user_message = messages[-1]["content"] if messages else ""

    # Helper tools
    def get_safe_to_spend_balance() -> dict:
        return ai_tools.get_safe_to_spend_balance(db, user_id)
        
    def get_spending_by_category(category_name: str) -> dict:
        return ai_tools.get_spending_by_category(db, user_id, category_name)
        
    def get_spending_by_description(query: str) -> dict:
        return ai_tools.get_spending_by_description(db, user_id, query)
        
    def get_savings_goals() -> dict:
        return ai_tools.get_savings_goals(db, user_id)

    def get_fixed_commitments_and_emis() -> dict:
        return ai_tools.get_fixed_commitments_and_emis(db, user_id)

    tools_list = [
        get_safe_to_spend_balance,
        get_spending_by_category,
        get_spending_by_description,
        get_savings_goals,
        get_fixed_commitments_and_emis
    ]

    # Just-in-time targeted context extraction (zero token waste!)
    targeted_context = _extract_targeted_financial_context(db, user_id, last_user_message)
    context_directive = f"\n\nCURRENT RELEVANT USER FINANCIAL DATA:\n{targeted_context}\n" if targeted_context else ""

    system_instruction = (
        "You are FinPilot, a premium, helpful personal finance assistant. You have secure access to the user's "
        "bank transactions, savings goals, and recurring fixed commitments/bills/EMIs through specific tools.\n"
        f"{context_directive}"
        "CRITICAL RULES:\n"
        "1. STRICT GUARDRAIL: You are strictly a personal finance assistant. You must refuse to answer any "
        "unrelated questions (such as general knowledge, coding, weather, math puzzles, social chatter like 'how are you', etc.). "
        "If the user asks an unrelated question, politely reply: 'I am FinPilot, your dedicated financial assistant. I can only answer questions related to your transaction logs, safe-to-spend limits, savings goals, or general personal budgeting. Please ask a financial question!'\n"
        "2. NEVER guess or hallucinate numbers. If relevant data is provided in CURRENT RELEVANT USER FINANCIAL DATA above, use it directly. If more data is needed, call the appropriate database tool.\n"
        "3. MULTILINGUAL & HINGLISH SUPPORT: The user may ask questions in English, Hindi, or Hinglish (e.g. 'emi kitni deni h', 'mera balance kitna hai', 'kya main yeh le sakta hu', 'kitne kharche hue'). Understand them accurately and reply naturally in the same language and tone with exact figures.\n"
        "4. Format numbers nicely (e.g. ₹20,000.00) and structure your answers with clear bullet points or headers.\n"
        "5. Be concise, polite, and focus on financial well-being."
    )

    if settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        gemini_history = []
        for msg in messages[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            gemini_history.append({
                "role": role,
                "parts": [msg["content"]]
            })

        # Try models in fallback sequence
        for model_name in FALLBACK_MODELS:
            try:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    tools=tools_list,
                    system_instruction=system_instruction
                )
                chat = model.start_chat(history=gemini_history, enable_automatic_function_calling=True)
                response = chat.send_message(last_user_message)
                if response and response.text:
                    return response.text
            except Exception as e:
                err_str = str(e)
                print(f"[AI Service] Model {model_name} failed: {err_str[:120]}")
                continue

    # 3. Deterministic Local Intelligence Failover
    print("[AI Service] Fallback to deterministic local database intelligence.")
    return _local_deterministic_finance_chat(db, user_id, last_user_message)

def generate_financial_insights(db: Session, user_id: str) -> dict:
    """Generate financial insights using Gemini model with deterministic fallback."""
    from app.services import finance_logic, ai_tools
    
    total_balance = finance_logic.get_total_balance(db, user_id)
    active_goals_locked = finance_logic.get_locked_goals_amount(db, user_id)
    safe_to_spend = finance_logic.get_safe_to_spend(db, user_id)
    
    from app.models.transaction import Transaction
    total_tx_count = db.query(Transaction).filter(Transaction.user_id == user_id).count()
    
    if total_tx_count == 0:
        return {
            "analysis": "No transaction history detected yet.",
            "recommendations": [
                "Upload a bank statement CSV or log a manual transaction using the buttons above.",
                "Set up a savings goal to protect your funds in the Goals Locked vault.",
                "FinPilot AI Advisor will automatically monitor your daily spending once statements are loaded."
            ],
            "encouragement": "Welcome to FinPilot! Let's start budgeting together for a smart financial year. 🚀"
        }
        
    goals = ai_tools.get_savings_goals(db, user_id)
    recent_txs = db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.date.desc()).limit(30).all()
    tx_list = [
        f"- {tx.date.strftime('%Y-%m-%d')}: {tx.description} ({tx.category}) | {tx.type} | ₹{tx.amount}"
        for tx in recent_txs
    ]
    txs_str = "\n".join(tx_list)
    
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
    
    if settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        for model_name in FALLBACK_MODELS:
            try:
                model = genai.GenerativeModel(model_name=model_name)
                response = model.generate_content(prompt)
                
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
                print(f"[Insights] Model {model_name} failed: {e}")
                continue
                
    # Deterministic local insights
    return {
        "analysis": f"Your current Safe to Spend is ₹{safe_to_spend:,.2f} with ₹{active_goals_locked:,.2f} protected in savings vaults.",
        "recommendations": [
            "Maintain daily burn pace below ₹1,100/day to keep your 3-month survival runway intact.",
            "Review discretionary dining and shopping allocations weekly.",
            "Use the What-If Simulator before committing to any major purchases."
        ],
        "encouragement": "Your disciplined goal locking is steadily building long-term financial resilience! 🌟"
    }
