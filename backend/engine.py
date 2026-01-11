from typing import AsyncGenerator
import json
from vllm.engine.arg_utils import AsyncEngineArgs
from vllm.engine.async_llm_engine import AsyncLLMEngine
from vllm.sampling_params import SamplingParams
from vllm.utils import random_uuid
import config

class LLMEngine:
    """
    A Singleton wrapper around the vLLM AsyncLLMEngine.
    
    This class handles the initialization of the model and provides
    a clean method to generate streaming responses.
    """
    
    _instance = None
    _engine: AsyncLLMEngine = None

    def __new__(cls):
        """Ensure only one instance of the engine wrapper exists."""
        if cls._instance is None:
            cls._instance = super(LLMEngine, cls).__new__(cls)
        return cls._instance

    def initialize(self):
        """
        Initializes the vLLM engine with configuration from config.py.
        This operation can take several minutes depending on model size.
        """
        if self._engine is not None:
            return

        print(f"🔄 Initializing vLLM Engine with model: {config.MODEL_NAME}...")
        
        # Configure the engine arguments
        engine_args = AsyncEngineArgs(
            model=config.MODEL_NAME,
            # You can add more vLLM optimizations here (e.g., tensor_parallel_size)
        )
        
        # Create the engine
        self._engine = AsyncLLMEngine.from_engine_args(engine_args)
        print("✅ vLLM Engine initialized successfully.")

    async def generate_stream(self, prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """
        Generates text based on the prompt and yields chunks of the response.
        
        Args:
            prompt (str): The input text to the model.
            **kwargs: Overrides for sampling parameters (temperature, max_tokens, etc.)
        
        Yields:
            str: JSON formatted string containing the text delta.
        """
        if self._engine is None:
            raise RuntimeError("Engine not initialized. Call initialize() first.")

        # Set up sampling parameters, using defaults from config if not provided
        sampling_params = SamplingParams(
            temperature=kwargs.get("temperature", config.DEFAULT_TEMPERATURE),
            top_p=kwargs.get("top_p", config.DEFAULT_TOP_P),
            max_tokens=kwargs.get("max_tokens", config.DEFAULT_MAX_TOKENS)
        )

        request_id = random_uuid()
        
        # Initiate the generation process
        results_generator = self._engine.generate(prompt, sampling_params, request_id)

        # Iterate over the stream
        last_output_text = ""
        async for request_output in results_generator:
            # vLLM returns the full generated text at every step.
            # We calculate the 'delta' (newly generated text) to stream back to the client.
            full_text = request_output.outputs[0].text
            delta = full_text[len(last_output_text):]
            last_output_text = full_text
            
            # Yield the delta formatted as a JSON string for the client
            yield json.dumps({"text": delta}) + "\n"
