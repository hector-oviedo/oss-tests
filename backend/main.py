import uvicorn
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables from .env file (if it exists)
load_dotenv(dotenv_path="../.env")

import config
from engine import LLMEngine
from routers import completion, chat

# ------------------------------------------------------------------------------
# Lifecycle Management
# ------------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handle startup and shutdown events.
    Initializes the LLM engine when the server starts.
    """
    # 1. Initialize the LLM Engine (loads model into GPU memory)
    engine = LLMEngine()
    engine.initialize()
    
    yield
    
    # (Optional) Clean up resources on shutdown if needed
    print("Shutting down API server...")

# ------------------------------------------------------------------------------
# API Setup
# ------------------------------------------------------------------------------

app = FastAPI(
    title="LocalAI Inference API",
    description=f"High-performance inference for {config.MODEL_NAME}",
    lifespan=lifespan
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    """
    Simple health check endpoint to verify the server is running.
    """
    return {"status": "active", "model": config.MODEL_NAME}

# Register Routers
app.include_router(completion.router, prefix="/completion", tags=["Completion"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])

# ------------------------------------------------------------------------------
# Entry Point
# ------------------------------------------------------------------------------

if __name__ == "__main__":
    print(f"Starting server on {config.HOST}:{config.PORT}")
    uvicorn.run(app, host=config.HOST, port=config.PORT)
