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
