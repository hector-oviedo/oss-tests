import os

# ------------------------------------------------------------------------------
# Configuration Settings
# ------------------------------------------------------------------------------

# The name or path of the model to use. 
# Defaults to "gpt-oss-20b" as requested, but can be overridden by env var.
# WARNING: "gpt-oss-20b" is a large model. Ensure you have sufficient GPU VRAM.
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-oss-20b")

# API Server settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# Inference defaults
DEFAULT_TEMPERATURE = 0.7
DEFAULT_TOP_P = 0.95
DEFAULT_MAX_TOKENS = 100
