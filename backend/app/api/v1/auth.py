# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordRequestForm
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user_schema import UserCreate, UserResponse
from app.schemas.auth_schema import Token
from app.services import auth_service
from app.core.security import create_access_token
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    return auth_service.create_user(db=db, user=user)

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(token: str):
    # In a real app, we'd extract the token from the Authorization header via a dependency
    # and maybe verify it first. For simplicity here, we accept it in the body/query
    # and add it to the denylist.
    auth_service.add_token_to_denylist(token)
    return {"message": "Successfully logged out"}

@router.delete("/delete-account", status_code=status.HTTP_200_OK)
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete user profile and cascade delete all transactions and goals."""
    db.delete(current_user)
    db.commit()
    return {"message": "Account permanently deleted"}

@router.post("/sandbox", response_model=Token)
def login_sandbox(db: Session = Depends(get_db)):
    """Logs in or resets a sandbox guest session with pre-populated dummy transactions and goals."""
    from app.models.account import Account
    from app.models.goal import Goal
    from app.models.transaction import Transaction
    from app.core.security import get_password_hash
    from datetime import date, timedelta
    from decimal import Decimal
    from app.services.csv_parser import generate_transaction_hash
    
    # 1. Fetch or create sandbox user
    user = db.query(User).filter(User.email == "sandbox@finpilot.ai").first()
    if not user:
        user = User(
            email="sandbox@finpilot.ai",
            password_hash=get_password_hash("sandbox123"),
            auth_provider="email"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    # 2. Clear all existing data for sandbox user
    db.query(Transaction).filter(Transaction.user_id == user.id).delete()
    db.query(Goal).filter(Goal.user_id == user.id).delete()
    db.query(Account).filter(Account.user_id == user.id).delete()
    db.commit()
    
    # 3. Seed mock transactions
    # Sum of incomes: 145.75, Sum of expenses: 27496.00
    txs_data = [
        ("Saved to goa trip", date.today(), "Investment", "expense", Decimal("500.00"), "Saved to goa trip (vault:1)"),
        ("Saved to goa trip", date.today(), "Investment", "expense", Decimal("1000.00"), "Saved to goa trip (vault:2)"),
        ("Saved to goa trip", date.today(), "Investment", "expense", Decimal("9000.00"), "Saved to goa trip (vault:3)"),
        ("Gym Membership", date.today() - timedelta(days=27), "Uncategorized", "expense", Decimal("999.00"), "Gym Membership"),
        ("UPI/GYM MEMBERSHIP", date.today() - timedelta(days=27), "Uncategorized", "expense", Decimal("999.00"), "UPI/GYM MEMBERSHIP"),
        ("Book Purchase", date.today() - timedelta(days=28), "Uncategorized", "expense", Decimal("899.00"), "Book Purchase"),
        ("UPI/BOOKSTORE", date.today() - timedelta(days=28), "Uncategorized", "expense", Decimal("899.00"), "UPI/BOOKSTORE"),
        ("Interest Credit", date.today() - timedelta(days=29), "Uncategorized", "income", Decimal("145.75"), "Interest Credit"),
        ("Rent", date.today() - timedelta(days=30), "Uncategorized", "expense", Decimal("12000.00"), "Rent"),
        ("Petrol", date.today() - timedelta(days=31), "Uncategorized", "expense", Decimal("2200.00"), "Petrol"),
    ]
    
    seeded_txs = []
    for desc, dt, cat, t_type, amt, hash_desc in txs_data:
        tx_hash = generate_transaction_hash(
            user_id=str(user.id),
            date=dt.strftime("%Y-%m-%d"),
            amount=str(amt),
            description=hash_desc,
            t_type=t_type
        )
        seeded_txs.append(Transaction(
            user_id=user.id,
            date=dt,
            amount=amt,
            type=t_type,
            category=cat,
            description=desc,
            transaction_hash=tx_hash
        ))
    db.bulk_save_objects(seeded_txs)
    
    # 4. Seed account balance
    # We want displayed balance to be exactly ₹19,500.00
    # Current flow: balance = opening_balance + income - expense = opening_balance - 27350.25
    # So opening_balance = 19500.00 + 27350.25 = 46850.25
    account = Account(
        user_id=user.id,
        current_balance=Decimal("46850.25"),
        name="Main Account"
    )
    db.add(account)
    
    # 5. Seed Goals
    # Goa Trip: Target ₹15,000, current ₹10,500 (since 500+1000+9000 = 10,500 saved!). Target Date: 30 days away.
    goa_target_date = date.today() + timedelta(days=30)
    goa_goal = Goal(
        user_id=user.id,
        name="goa trip",
        target_amount=Decimal("15000.00"),
        current_amount=Decimal("10500.00"),
        target_date=goa_target_date,
        status="active"
    )
    db.add(goa_goal)
    
    db.commit()
    
    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}

