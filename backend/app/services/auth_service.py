# pyrefly: ignore [missing-import]
import redis
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user_schema import UserCreate
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings

# Initialize Redis client for JWT denylist
# Using decode_responses=True so we get strings instead of bytes
redis_client = redis.from_url(settings.REDIS_URI, decode_responses=True)

def create_user(db: Session, user: UserCreate):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, password_hash=hashed_password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not user.password_hash or not verify_password(password, user.password_hash):
        return False
    return user

def add_token_to_denylist(token: str, expires_in: int = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60):
    """Add a JWT token to the Redis denylist."""
    try:
        # Store token in Redis with an expiration so it cleans itself up
        redis_client.setex(f"denylist:{token}", expires_in, "revoked")
    except redis.RedisError as e:
        # In a real app, log this error
        print(f"Redis error: {e}")

def is_token_revoked(token: str) -> bool:
    """Check if a token is in the denylist."""
    try:
        return redis_client.exists(f"denylist:{token}") > 0
    except redis.RedisError:
        # Fail open or fail closed? For MVP, fail open if Redis is down, but ideally fail closed.
        return False
