import json
import uuid
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
import uvicorn

from vllm.engine.arg_utils import AsyncEngineArgs
from vllm.engine.async_llm_engine import AsyncLLMEngine
from vllm.sampling_params import SamplingParams
from vllm.utils import random_uuid

app = FastAPI()

# Model configuration
# Note: You can pass these as CLI arguments or environment variables
MODEL_PATH = "facebook/opt-125m" # Default to a small model; user can change to gpt-oss-20b

engine_args = AsyncEngineArgs(model=MODEL_PATH)
engine = AsyncLLMEngine.from_engine_args(engine_args)

@app.get("/health")
async def health() -> StreamingResponse:
    """Health check endpoint."""
    return StreamingResponse(iter([json.dumps({"status": "ok"})]), media_type="application/json")

@app.post("/generate")
async def generate(request: Request) -> StreamingResponse:
    """Generate completion and stream the results."""
    request_dict = await request.json()
    prompt = request_dict.pop("prompt")
    sampling_params = SamplingParams(**request_dict)
    request_id = random_uuid()

    results_generator = engine.generate(prompt, sampling_params, request_id)

    async def stream_results() -> AsyncGenerator[bytes, None]:
        last_output_text = ""
        async for request_output in results_generator:
            # vLLM returns the full text generated so far. 
            # We calculate the delta to provide a streaming experience.
            full_text = request_output.outputs[0].text
            delta = full_text[len(last_output_text):]
            last_output_text = full_text
            
            yield (json.dumps({"text": delta}) + "\n").encode("utf-8")

    return StreamingResponse(stream_results(), media_type="application/x-ndjson")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

