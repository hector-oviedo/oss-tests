from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from engine import LLMEngine
from transformers import AutoTokenizer
import config

router = APIRouter()

# Initialize tokenizer for chat templating
# We use the tokenizer matching the model to ensure correct template application
tokenizer = AutoTokenizer.from_pretrained(config.MODEL_NAME, token=config.HF_TOKEN)

@router.post("")
async def chat_generate(request: Request):
    """
    Chat endpoint.
    Accepts a JSON body with 'messages' (list of dicts) and optional sampling parameters.
    Applies the model's chat template and streams the response.
    """
    data = await request.json()
    messages = data.get("messages")
    
    if not messages or not isinstance(messages, list):
        return {"error": "Messages list is required"}

    # Apply the chat template
    # This converts the list of messages into the single string format the model expects
    prompt = tokenizer.apply_chat_template(
        messages, 
        tokenize=False, 
        add_generation_prompt=True
    )

    # Extract optional parameters
    params = {
        "temperature": data.get("temperature"),
        "max_tokens": data.get("max_tokens"),
        "top_p": data.get("top_p")
    }
    params = {k: v for k, v in params.items() if v is not None}

    engine = LLMEngine()

    return StreamingResponse(
        engine.generate_stream(prompt, **params),
        media_type="application/x-ndjson"
    )
