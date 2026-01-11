import os

# ------------------------------------------------------------------------------
# Configuration Settings
# ------------------------------------------------------------------------------

# The name or path of the model to use. 
# Updated to the namespaced Hugging Face ID.
MODEL_NAME = os.getenv("MODEL_NAME", "openai/gpt-oss-20b")

# Hugging Face Token (Required for gated models like openai/gpt-oss-20b)
# Ensure you run: export HF_TOKEN=hf_...
HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    print("⚠️  WARNING: HF_TOKEN is not set. If this is a gated model, download will fail.")
    print("👉  Get your token at https://huggingface.co/settings/tokens")
    print("👉  Run: export HF_TOKEN=your_token_here")

# API Server settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# Inference defaults
DEFAULT_TEMPERATURE = 0.7
DEFAULT_TOP_P = 0.95
DEFAULT_MAX_TOKENS = 100
