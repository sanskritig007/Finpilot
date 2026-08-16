import re

def predict_category(description: str, tx_type: str) -> str:
    """Predict transaction category based on description keywords and transaction type."""
    desc = description.strip().lower()
    
    # 1. Check type-based overrides first
    if tx_type == "income":
        if any(k in desc for k in ["salary", "paycheck", "wages", "stipend", "reimbursement", "bonus"]):
            return "Salary"
        if any(k in desc for k in ["refund", "cashback", "reversal", "returned"]):
            return "Refund"
        
    # 2. Food & Dining
    food_keywords = [
        "swiggy", "zomato", "starbucks", "mcdonald", "burger", "pizza", "kfc", "cafe", 
        "restaurant", "dining", "food", "tea", "coffee", "chai", "bakery", "subway", 
        "domino", "diner"
    ]
    if any(k in desc for k in food_keywords):
        return "Food & Dining"
        
    # 3. Shopping
    shopping_keywords = [
        "amazon", "flipkart", "myntra", "shopping", "retail", "decathlon", "clothing",
        "fashion", "store", "mall", "supermarket", "grocery", "groceries", "instamart", 
        "blinkit", "zepto", "dmart", "market"
    ]
    if any(k in desc for k in shopping_keywords):
        return "Shopping"
        
    # 4. Rent & Housing
    housing_keywords = [
        "rent", "housing", "landlord", "maintenance", "society", "pg", "hostel", "lease"
    ]
    if any(k in desc for k in housing_keywords):
        return "Rent & Housing"
        
    # 5. Salary (general credits)
    salary_keywords = ["salary", "paycheck", "wages", "stipend", "bonus"]
    if any(k in desc for k in salary_keywords):
        return "Salary"
        
    # 6. Entertainment
    ent_keywords = [
        "netflix", "spotify", "prime video", "disney", "hotstar", "youtube premium", 
        "movie", "cinema", "pvr", "inox", "bookmyshow", "ticket", "gaming", "steam",
        "playstation", "xbox", "pubg", "club"
    ]
    if any(k in desc for k in ent_keywords):
        return "Entertainment"
        
    # 7. Bills & Utilities
    bill_keywords = [
        "electricity", "water", "wifi", "broadband", "phone bill", "recharge", "jio", 
        "airtel", "vi ", "gas", "cylinder", "power", "utility", "insurance", "premium"
    ]
    if any(k in desc for k in bill_keywords):
        return "Bills & Utilities"
        
    # 8. Travel & Transport
    travel_keywords = [
        "uber", "ola", "auto", "petrol", "fuel", "shell", "travel", "irctc", "flight", 
        "airline", "metro", "bus", "cab", "taxi", "rapido", "makemytrip", "goibibo", 
        "toll", "fastag"
    ]
    if any(k in desc for k in travel_keywords):
        return "Travel & Transport"
        
    # 9. Investment
    invest_keywords = [
        "saved to", "saving", "investment", "mutual fund", "groww", "zerodha", "stocks", 
        "etf", "sip", "fd ", "fixed deposit", "recurring deposit", "gold", "crypto", "coins"
    ]
    if any(k in desc for k in invest_keywords):
        return "Investment"
        
    # 10. Refund
    refund_keywords = ["refund", "cashback", "reversal", "returned"]
    if any(k in desc for k in refund_keywords):
        return "Refund"
        
    return "Uncategorized"
