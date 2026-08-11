from sqlalchemy.orm import Session
from uuid import UUID
from app.models.transaction import Transaction
from app.schemas.transaction_schema import TransactionCreate
from app.services.csv_parser import generate_transaction_hash

def create_manual_transaction(db: Session, user_id: UUID, tx_data: TransactionCreate) -> Transaction:
    """Creates a user manual transaction after validating it is not a duplicate entry."""
    # Generate unique transaction hash to prevent double submissions
    tx_hash = generate_transaction_hash(
        user_id=str(user_id),
        date=tx_data.date.strftime("%Y-%m-%d"),
        amount=str(tx_data.amount),
        description=tx_data.description,
        t_type=tx_data.type
    )

    # Check if a duplicate entry exists
    existing = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_hash == tx_hash
    ).first()
    if existing:
        raise ValueError("A transaction with these exact details already exists.")

    db_tx = Transaction(
        user_id=user_id,
        date=tx_data.date,
        amount=tx_data.amount,
        type=tx_data.type,
        category=tx_data.category,
        description=tx_data.description,
        transaction_hash=tx_hash
    )
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx
