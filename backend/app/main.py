from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI App
app = FastAPI(
    title="FinPilot AI API",
    description="API for FinPilot AI - The intelligent personal finance assistant.",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173", # Vite default port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1 import auth

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "FinPilot AI API is running"}

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

