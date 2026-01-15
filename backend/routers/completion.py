from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from engine import LLMEngine

router = APIRouter()

@router.post("")
async def completion_generate(request: Request):
    """
    Completion endpoint.
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
    
    if engine.is_busy:
        raise HTTPException(status_code=429, detail="Server is busy generating another response. Please wait.")

    # Return the streaming response using the engine's generator
    return StreamingResponse(
        engine.generate_stream(prompt, **params),
        media_type="application/x-ndjson"
    )
