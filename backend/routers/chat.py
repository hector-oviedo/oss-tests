from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from engine import LLMEngine
import openai_harmony
from openai_harmony import HarmonyEncodingName, Role, Author, TextContent, Message, Conversation
import config

router = APIRouter()

# Initialize Harmony encoder
try:
    enc = openai_harmony.load_harmony_encoding(HarmonyEncodingName.HARMONY_GPT_OSS)
except Exception as e:
    print(f"Error loading openai_harmony: {e}")
    enc = None

@router.post("")
async def chat_generate(request: Request):
    """
    Chat endpoint.
    Accepts a JSON body with 'messages' (list of dicts) and optional sampling parameters.
    Applies the model's chat template using openai_harmony and streams the response.
    """
    if enc is None:
        raise HTTPException(status_code=500, detail="Harmony encoding not initialized")

    data = await request.json()
    raw_messages = data.get("messages")
    
    if not raw_messages or not isinstance(raw_messages, list):
        return {"error": "Messages list is required"}

    # Convert simple dict messages to Harmony objects
    harmony_messages = []
    for msg in raw_messages:
        role_str = msg.get("role")
        content_str = msg.get("content")
        
        if not role_str or not content_str:
            continue

        # Map role
        try:
            role_enum = Role(role_str)
        except ValueError:
            # Fallback or skip invalid roles
            continue

        # Create Harmony Message
        harmony_msg = Message(
            author=Author(role=role_enum),
            content=[TextContent(text=content_str)]
        )
        harmony_messages.append(harmony_msg)

    conversation = Conversation(messages=harmony_messages)

    # Generate prompt using Harmony
    # render_conversation_for_completion prepares the prompt for the model to continue (as assistant)
    prompt = enc.render_conversation_for_completion(conversation)
    
    print(f"DEBUG: Generated Harmony Prompt: {prompt!r}")

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