import csv
import io
import hashlib
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from app.models.transaction import Transaction

def generate_transaction_hash(user_id: str, date: str, amount: str, description: str, t_type: str) -> str:
    """Generate a unique SHA-256 hash for a transaction row to prevent duplicates."""
    data = f"{user_id}:{date}:{amount}:{description.strip().lower()}:{t_type.lower()}"
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def clean_amount(val: str) -> Tuple[Decimal, str]:
    """Clean the currency string and return (Decimal absolute value, type)."""
    # Remove currency symbols, commas, spaces
    cleaned = val.replace('₹', '').replace('$', '').replace(',', '').strip()
    
    if not cleaned:
        raise ValueError("Empty amount field")
        
    try:
        num = Decimal(cleaned)
        if num < 0:
            return abs(num), "expense"
        else:
            return num, "income"
    except InvalidOperation:
        raise ValueError(f"Invalid amount format: {val}")

def parse_date(val: str) -> datetime.date:
    """Parse date from common formats."""
    formats = [
        "%Y-%m-%d",      # 2026-07-30
        "%d-%m-%Y",      # 30-07-2026
        "%d/%m/%Y",      # 30/07/2026
        "%Y/%m/%d",      # 2026/07/30
        "%b %d, %Y",     # Jul 30, 2026
        "%d %b %Y",      # 30 Jul 2026
    ]
    for fmt in formats:
        try:
            return datetime.strptime(val.strip(), fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Could not parse date: {val}")

def parse_csv_stream(user_id: str, file_content: bytes) -> List[Dict]:
    """Parse raw CSV bytes in-memory and return a list of mapped transaction dicts."""
    # Decode bytes to string
    try:
        text = file_content.decode('utf-8')
    except UnicodeDecodeError:
        # Fallback to latin-1
        text = file_content.decode('latin-1')
        
    f = io.StringIO(text)
    reader = csv.reader(f)
    
    # Read header row
    try:
        headers = [h.strip().lower() for h in next(reader)]
    except StopIteration:
        raise ValueError("Empty CSV file")
        
    # Helper to find column index (using substring matching for flexibility)
    def find_column(names: List[str], required: bool = True) -> int:
        for name in names:
            for idx, h in enumerate(headers):
                if name.lower() in h.lower():
                    return idx
        if required:
            raise ValueError(f"Missing required column matching: {names}")
        return -1

    # Locate column indexes
    idx_date = find_column(['date', 'txn date', 'transaction date', 'value date'])
    idx_desc = find_column(['description', 'narration', 'particulars', 'info'])
    
    # Try finding amount, or fallback to debit/credit split
    idx_amount = find_column(['amount', 'value', 'transaction amount'], required=False)
    idx_debit = find_column(['debit', 'withdrawal', 'dr'], required=False)
    idx_credit = find_column(['credit', 'deposit', 'cr'], required=False)
    
    idx_category = find_column(['category', 'genre'], required=False)
    idx_type = find_column(['dr/cr', 'd/c', 'type', 'transaction type'], required=False)

    if idx_amount == -1 and (idx_debit == -1 or idx_credit == -1):
        raise ValueError("CSV must contain either an 'amount' column or both 'debit' and 'credit' columns")

    transactions = []
    
    for row_num, row in enumerate(reader, start=2):
        if not row or all(not cell.strip() for cell in row):
            continue  # Skip empty rows
            
        try:
            date_val = parse_date(row[idx_date])
            desc_val = row[idx_desc].strip()
            category_val = row[idx_category].strip() if idx_category != -1 and len(row) > idx_category else "Uncategorized"
            
            # Determine amount and type
            if idx_amount != -1 and len(row) > idx_amount:
                amount_str = row[idx_amount]
                amount_val, default_type = clean_amount(amount_str)
                type_val = default_type
                
                # Check for explicit type or sign column (e.g. Dr/Cr column containing +/- or Dr/Cr)
                if idx_type != -1 and len(row) > idx_type:
                    raw_type = row[idx_type].strip().lower()
                    if raw_type in ['-', 'dr', 'debit', 'withdrawal', 'expense']:
                        type_val = "expense"
                    elif raw_type in ['+', 'cr', 'credit', 'deposit', 'income']:
                        type_val = "income"
            else:
                # Debit / Credit split
                debit_str = row[idx_debit].strip() if len(row) > idx_debit else ""
                credit_str = row[idx_credit].strip() if len(row) > idx_credit else ""
                
                if debit_str and not credit_str:
                    amount_val, _ = clean_amount(debit_str)
                    type_val = "expense"
                elif credit_str and not debit_str:
                    amount_val, _ = clean_amount(credit_str)
                    type_val = "income"
                elif debit_str and credit_str:
                    # Both populated is abnormal but let's prioritize credit as income
                    amount_val, _ = clean_amount(credit_str)
                    type_val = "income"
                else:
                    # Both empty, skip row
                    continue
            
            # Generate unique hash for deduplication
            tx_hash = generate_transaction_hash(
                user_id=str(user_id),
                date=date_val.strftime("%Y-%m-%d"),
                amount=str(amount_val),
                description=desc_val,
                t_type=type_val
            )
            
            transactions.append({
                "user_id": user_id,
                "date": date_val,
                "amount": amount_val,
                "type": type_val,
                "category": category_val or "Uncategorized",
                "description": desc_val,
                "transaction_hash": tx_hash
            })
            
        except Exception as e:
            # Skip corrupted rows and log to standard output (or handle gracefully)
            print(f"Skipping row {row_num} due to error: {e}")
            continue
            
    return transactions

def import_transactions_to_db(db: Session, transactions: List[Dict]) -> Tuple[int, int]:
    """Insert non-duplicate transactions into database. Returns (imported_count, skipped_count)."""
    if not transactions:
        return 0, 0
        
    user_id = transactions[0]["user_id"]
    
    # Fetch all existing transaction hashes for this user to perform fast in-memory deduplication
    existing_hashes = {
        tx_hash for (tx_hash,) in db.query(Transaction.transaction_hash)
        .filter(Transaction.user_id == user_id).all()
    }
    
    new_records = []
    skipped_count = 0
    
    for tx in transactions:
        if tx["transaction_hash"] in existing_hashes:
            skipped_count += 1
        else:
            # Add to list and track to prevent duplicate rows inside the SAME csv file
            new_records.append(Transaction(**tx))
            existing_hashes.add(tx["transaction_hash"])
            
    if new_records:
        db.bulk_save_objects(new_records)
        db.commit()
        
    return len(new_records), skipped_count
