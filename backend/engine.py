from typing import AsyncGenerator, Union, List
import json
from vllm.engine.arg_utils import AsyncEngineArgs
from vllm.engine.async_llm_engine import AsyncLLMEngine
from vllm.sampling_params import SamplingParams
from vllm.utils import random_uuid
from vllm.inputs.data import TokensPrompt
import config

class LLMEngine:
    """
    A Singleton wrapper around the vLLM AsyncLLMEngine.
    
    This class handles the initialization of the model and provides
    a clean method to generate streaming responses.
    """
    
    _instance = None
    _engine: AsyncLLMEngine = None
    _is_generating: bool = False

    def __new__(cls):
        """Ensure only one instance of the engine wrapper exists."""
        if cls._instance is None:
            cls._instance = super(LLMEngine, cls).__new__(cls)
            cls._instance._is_generating = False
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
            trust_remote_code=True,  # Often required for new/custom architectures
            # tensor_parallel_size=1  # Set this to the number of GPUs you have
        )
        
        # Create the engine
        self._engine = AsyncLLMEngine.from_engine_args(engine_args)
        print("✅ vLLM Engine initialized successfully.")

    @property
    def is_busy(self) -> bool:
        return self._is_generating

    async def generate_stream(self, prompt: Union[str, List[int]], **kwargs) -> AsyncGenerator[str, None]:
        """
        Generates text based on the prompt and yields chunks of the response.
        
        Args:
            prompt (str | List[int]): The input text or token IDs to the model.
            **kwargs: Overrides for sampling parameters (temperature, max_tokens, etc.)
        
        Yields:
            str: JSON formatted string containing the text delta.
        """
        if self._engine is None:
            raise RuntimeError("Engine not initialized. Call initialize() first.")
            
        if self._is_generating:
            # Simple blocking mechanism as requested
            raise RuntimeError("Busy: A generation is already in progress.")

        try:
            self._is_generating = True
            
            # Set up sampling parameters, using defaults from config if not provided
            sampling_params = SamplingParams(
                temperature=kwargs.get("temperature", config.DEFAULT_TEMPERATURE),
                top_p=kwargs.get("top_p", config.DEFAULT_TOP_P),
                max_tokens=kwargs.get("max_tokens", config.DEFAULT_MAX_TOKENS),
                skip_special_tokens=kwargs.get("skip_special_tokens", True)
            )

            request_id = random_uuid()
            
            # Handle different prompt types
            if isinstance(prompt, list):
                # vLLM expects a TokensPrompt (TypedDict) for token IDs
                inputs = TokensPrompt(prompt_token_ids=prompt)
            else:
                inputs = prompt

            # Initiate the generation process
            results_generator = self._engine.generate(inputs, sampling_params, request_id)

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
                
        finally:
            self._is_generating = False
