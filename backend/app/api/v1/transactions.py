from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction_schema import TransactionResponse, TransactionUpdate, PaginatedTransactions
from app.services import csv_parser

router = APIRouter()

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a bank statement CSV file, parse and import non-duplicate transactions."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported."
        )
        
    contents = await file.read()
    
    try:
        parsed_txs = csv_parser.parse_csv_stream(user_id=current_user.id, file_content=contents)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
        
    imported, skipped = csv_parser.import_transactions_to_db(db, parsed_txs)
    
    return {
        "message": "Upload completed successfully",
        "total_imported": imported,
        "duplicates_skipped": skipped
    }

@router.get("/", response_model=PaginatedTransactions)
def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve user's transactions with pagination and optional category filtering."""
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if category:
        query = query.filter(Transaction.category == category)
        
    # Sort by date descending
    query = query.order_by(Transaction.date.desc())
    
    total_count = query.count()
    total_pages = (total_count + limit - 1) // limit
    
    skip = (page - 1) * limit
    data = query.offset(skip).limit(limit).all()
    
    return {
        "data": data,
        "total_pages": total_pages,
        "current_page": page
    }

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction_category(
    transaction_id: UUID,
    payload: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually update the category of a specific transaction."""
    tx = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found."
        )
        
    tx.category = payload.category
    db.commit()
    db.refresh(tx)
    return tx
