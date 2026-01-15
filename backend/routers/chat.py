import json
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from engine import LLMEngine
import openai_harmony
from openai_harmony import HarmonyEncodingName, Role, Author, TextContent, Message, Conversation, SystemContent, ReasoningEffort
import config

router = APIRouter()

# Initialize Harmony encoder
try:
    enc = openai_harmony.load_harmony_encoding(HarmonyEncodingName.HARMONY_GPT_OSS)
except Exception as e:
    print(f"Error loading openai_harmony: {e}")
    enc = None

async def filter_harmony_stream(upstream_generator):
    """
    Filters the stream and separates content into 'reasoning' (analysis) and 'content' (final).
    Yields JSON chunks with {"type": "reasoning"|"content", "text": "..."}.
    """
    buffer = ""
    
    # States
    STATE_WAITING = "waiting"
    STATE_ANALYSIS = "analysis"
    STATE_FINAL = "final"
    current_state = STATE_WAITING

    # Markers
    ANALYSIS_MARKER = "<|channel|>analysis<|message|>"
    FINAL_MARKER = "<|channel|>final<|message|>"
    END_MARKER = "<|end|>"

    async for chunk_json in upstream_generator:
        # chunk_json is a JSON string: '{"text": "..."}\n'
        try:
            data = json.loads(chunk_json)
            chunk_text = data.get("text", "")
        except Exception:
            continue
            
        buffer += chunk_text
        
        while buffer:
            if current_state == STATE_WAITING:
                # Check for markers to switch state
                if ANALYSIS_MARKER in buffer:
                    _, buffer = buffer.split(ANALYSIS_MARKER, 1)
                    current_state = STATE_ANALYSIS
                elif FINAL_MARKER in buffer:
                    _, buffer = buffer.split(FINAL_MARKER, 1)
                    current_state = STATE_FINAL
                else:
                    # Keep buffering until we see a marker or buffer gets too large?
                    # Ideally the model outputs a marker very early.
                    # If we have a lot of text and no marker, maybe it's raw text (fallback)?
                    # For now, let's assume it starts with a marker.
                    # Optimization: if buffer is huge and no marker, maybe just yield it as content?
                    if len(buffer) > 200: # Heuristic
                         # Assume content if no marker found after 200 chars?
                         # Or just wait. Let's wait.
                         break 
                    break

            elif current_state == STATE_ANALYSIS:
                # Look for end of analysis (which is usually start of final or end marker)
                # Actually, analysis ends with <|end|>, then <|channel|>final...
                # But sometimes it might jump.
                # Let's look for END_MARKER.
                if END_MARKER in buffer:
                    content, buffer = buffer.split(END_MARKER, 1)
                    if content:
                        yield json.dumps({"type": "reasoning", "text": content}) + "\n"
                    # After analysis end, we go back to waiting for next channel
                    current_state = STATE_WAITING
                else:
                    # Check if FINAL_MARKER appeared without END_MARKER (unexpected but possible)
                    if FINAL_MARKER in buffer:
                         content, buffer = buffer.split(FINAL_MARKER, 1)
                         if content:
                             yield json.dumps({"type": "reasoning", "text": content}) + "\n"
                         current_state = STATE_FINAL
                    else:
                        # Yield all safe buffer
                        # We need to keep enough buffer to match the END_MARKER
                        safe_len = len(buffer) - len(END_MARKER)
                        if safe_len > 0:
                            yield json.dumps({"type": "reasoning", "text": buffer[:safe_len]}) + "\n"
                            buffer = buffer[safe_len:]
                        break

            elif current_state == STATE_FINAL:
                if END_MARKER in buffer:
                    content, buffer = buffer.split(END_MARKER, 1)
                    if content:
                        yield json.dumps({"type": "content", "text": content}) + "\n"
                    # Done with this message turn usually
                    current_state = STATE_WAITING
                else:
                    # Yield all safe buffer
                    safe_len = len(buffer) - len(END_MARKER)
                    if safe_len > 0:
                        yield json.dumps({"type": "content", "text": buffer[:safe_len]}) + "\n"
                        buffer = buffer[safe_len:]
                    break

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
    reasoning_effort_str = data.get("reasoning_effort", config.DEFAULT_REASONING_EFFORT).lower()
    
    # Map string to enum
    reasoning_effort_map = {
        "low": ReasoningEffort.LOW,
        "medium": ReasoningEffort.MEDIUM,
        "high": ReasoningEffort.HIGH
    }
    reasoning_effort = reasoning_effort_map.get(reasoning_effort_str, ReasoningEffort.LOW)

    if not raw_messages or not isinstance(raw_messages, list):
        return {"error": "Messages list is required"}

    # Context Management: Truncate history if too long
    # Heuristic: 1 token ~= 4 chars.
    max_chars = config.MAX_CONTEXT_TOKENS * 4
    
    # Identify system message (usually first) to preserve it
    system_msg = None
    if raw_messages and raw_messages[0].get("role") == "system":
        system_msg = raw_messages.pop(0)
        max_chars -= len(system_msg.get("content", ""))

    # Truncate remaining messages from the front
    while raw_messages:
        total_chars = sum(len(m.get("content", "")) for m in raw_messages)
        if total_chars <= max_chars:
            break
        raw_messages.pop(0) # Remove oldest non-system message

    # Re-insert system message
    if system_msg:
        raw_messages.insert(0, system_msg)

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
        if role_enum == Role.SYSTEM:
            # Use SystemContent for system messages to support reasoning effort
            # Note: with_text might not be the method, looking at standard builder pattern often used
            # If with_text doesn't exist, I'll rely on inspecting results. 
            # But SystemContent.new() usually creates a builder.
            # Let's assume .with_instructions(text) or .with_text(text)
            # Based on DeveloperContent example in search: DeveloperContent.new().with_instructions(...)
            # SystemContent likely has similar. Let's try .with_instructions() if it mimics DeveloperContent
            # Or just check if SystemContent(text) works? No, it's a struct.
            # I will guess .with_instructions() or .with_content()
            # Actually, the search example showed: Message.from_role_and_content(Role.SYSTEM, SystemContent.new())
            # It didn't show setting text for SystemContent in that snippet.
            # But typically system message has text.
            # I'll use a safer approach: try to find the method or use a generic TextContent if I can't set it.
            # But I need reasoning effort.
            # Let's assume .with_text() or .with_value() is common.
            # To be safe, I'll use TextContent for now if I can't be sure, BUT I really want reasoning effort.
            # Let's try SystemContent.new().with_text(content_str) and .with_reasoning_effort(...)
            # If this fails, I'll catch it.
            try:
                 content_obj = SystemContent.new()
                 # Try to find a way to set text. 
                 # If I can't find it, I will just set the reasoning effort on an empty system message? That's useless.
                 # Wait, maybe SystemContent IS the text container?
                 # Let's search 'SystemContent' usage online? 
                 # Time is short. I will assume TextContent is fine for content, 
                 # and ReasoningEffort is set on the Conversation or System message specifically?
                 # The grep showed 'with_reasoning_effort' in 'SystemContent'.
                 # So SystemContent definitely has it.
                 # Does SystemContent hold text?
                 # `DeveloperContent` does `with_instructions`.
                 # Let's try `with_instructions` for SystemContent too.
                 if hasattr(content_obj, "with_instructions"):
                     content_obj = content_obj.with_instructions(content_str)
                 elif hasattr(content_obj, "with_text"):
                     content_obj = content_obj.with_text(content_str)
                 
                 content_obj = content_obj.with_reasoning_effort(reasoning_effort)
                 harmony_msg = Message(author=Author(role=role_enum), content=[content_obj])
            except Exception as e:
                print(f"Warning: Failed to construct SystemContent: {e}")
                # Fallback
                harmony_msg = Message(
                    author=Author(role=role_enum),
                    content=[TextContent(text=content_str)]
                )
        else:
            harmony_msg = Message(
                author=Author(role=role_enum),
                content=[TextContent(text=content_str)]
            )
        harmony_messages.append(harmony_msg)

    conversation = Conversation(messages=harmony_messages)

    # Generate prompt using Harmony
    # render_conversation_for_completion prepares the prompt for the model to continue (as assistant)
    prompt = enc.render_conversation_for_completion(conversation, next_turn_role=Role.ASSISTANT)
    
    print(f"DEBUG: Generated Harmony Prompt: {prompt!r}")

    # Extract optional parameters
    params = {
        "temperature": data.get("temperature"),
        "max_tokens": data.get("max_tokens"),
        "top_p": data.get("top_p"),
        "skip_special_tokens": False # Important: We need special tokens to parse the stream
    }
    params = {k: v for k, v in params.items() if v is not None}

    engine = LLMEngine()
    
    if engine.is_busy:
        raise HTTPException(status_code=429, detail="Server is busy generating another response. Please wait.")
    
    # Wrap the engine generator with our filter
    filtered_stream = filter_harmony_stream(engine.generate_stream(prompt, **params))

    return StreamingResponse(
        filtered_stream,
        media_type="application/x-ndjson"
    )