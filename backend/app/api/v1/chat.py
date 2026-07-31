# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import List
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services import ai_service, rate_limiter

router = APIRouter()

class ChatMessage(BaseModel):
    role: str  # 'user', 'assistant'
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    response: str

@router.post("/", response_model=ChatResponse)
def chat_with_assistant(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat with the FinPilot personal finance AI assistant."""
    # 1. Enforce Redis Rate Limiting (20 prompts/hour)
    if rate_limiter.is_rate_limited(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You've reached your hourly chat limit (20 messages/hour). Please try again later."
        )
        
    try:
        # Convert Pydantic schemas to standard dictionaries for OpenAI service
        messages_list = [{"role": msg.role, "content": msg.content} for msg in payload.messages]
        
        ai_response = ai_service.run_chat_completion(
            db=db,
            user_id=current_user.id,
            messages=messages_list
        )
        
        return {"response": ai_response}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Chat Service Error: {str(e)}"
        )
