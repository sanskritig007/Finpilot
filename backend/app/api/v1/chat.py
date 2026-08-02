# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services import ai_service, rate_limiter

router = APIRouter()

class ChatMessage(BaseModel):
    role: str  # 'user', 'assistant'
    content: Optional[str] = None
    parts: Optional[List[Dict[str, Any]]] = None

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@router.post("/")
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
        
    # Convert Pydantic schemas to standard dictionaries
    messages_list = []
    for msg in payload.messages:
        content = msg.content
        if not content and msg.parts:
            content = "".join([part.get("text", "") for part in msg.parts if part.get("type") == "text"])
        messages_list.append({"role": msg.role, "content": content or ""})
    
    # Use working non-stream run_chat_completion to execute tools safely
    try:
        ai_response = ai_service.run_chat_completion(
            db=db,
            user_id=current_user.id,
            messages=messages_list
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
        
    def event_generator():
        try:
            import time
            chunk_size = 6  # Yield 6 characters at a time
            for i in range(0, len(ai_response), chunk_size):
                chunk = ai_response[i:i+chunk_size]
                yield chunk
                time.sleep(0.015)  # 15ms delay for smooth typing animation
        except Exception as e:
            yield f"\nError: {str(e)}"

    return StreamingResponse(
        event_generator(),
        media_type="text/plain",
        headers={"x-vercel-ai-data-stream": "v1"}
    )


