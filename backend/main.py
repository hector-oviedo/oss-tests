from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

import config
from engine import LLMEngine

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


@app.post("/generate")
async def generate_text(request: Request):
    """
    Main inference endpoint.
    Accepts a JSON body with 'prompt' and optional sampling parameters.
    Returns a streaming response (Server-Sent Events / NDJSON).
    """
    # Parse the request body
    data = await request.json()
    prompt = data.get("prompt")
    
    if not prompt:
        return {"error": "Prompt is required"}

    # Extract optional parameters
    params = {
        "temperature": data.get("temperature"),
        "max_tokens": data.get("max_tokens"),
        "top_p": data.get("top_p")
    }
    # Filter out None values to use defaults
    params = {k: v for k, v in params.items() if v is not None}

    # Get the engine instance
    engine = LLMEngine()

    # Return the streaming response using the engine's generator
    return StreamingResponse(
        engine.generate_stream(prompt, **params),
        media_type="application/x-ndjson"
    )

# ------------------------------------------------------------------------------
# Entry Point
# ------------------------------------------------------------------------------

if __name__ == "__main__":
    print(f"Starting server on {config.HOST}:{config.PORT}")
    uvicorn.run(app, host=config.HOST, port=config.PORT)