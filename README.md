# 🧠 LocalAI: GPT-OSS Inference Engine

> **Raw, Unfiltered, High-Performance LLM Inference.**  
> Powered by [vLLM](https://github.com/vllm-project/vllm) and [FastAPI](https://fastapi.tiangolo.com/).

![Status](https://img.shields.io/badge/Status-Active-success)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![License](https://img.shields.io/badge/License-MIT-purple)

## 🚀 Overview

LocalAI is a streamlined, high-performance inference server designed to run open-source models (specifically **GPT-OSS 20B**) locally with maximum efficiency. We utilize `vLLM`'s PagedAttention technology to deliver state-of-the-art throughput and low latency streaming, coupled with **OpenAI Harmony** for structured reasoning.

**Key Features:**
- ⚡ **Blazing Fast Inference:** Leverages `vLLM` for optimized memory management and continuous batching.
- 🧠 **Chain of Thought (CoT):** Visualizes the model's internal "Thinking Process" (analysis channel) separately from the final answer.
- 🌊 **Real-time Streaming:** Native async streaming endpoints using Server-Sent Events (SSE) / NDJSON.
- 🛡️ **Robust Architecture:** Handles concurrent request blocking (429 Busy) and context truncation automatically.
- 🎛️ **Configurable Reasoning:** Adjust the model's reasoning effort (Low/Medium/High) to balance depth vs. speed.

## 🛠️ Stack

- **Backend:** Python 3.10+, FastAPI, vLLM, Uvicorn, OpenAI Harmony
- **Frontend:** React (Vite), TailwindCSS

## 📦 Getting Started

### Prerequisites

- Python 3.10 or higher
- CUDA-enabled GPU (NVIDIA) for vLLM acceleration (24GB+ VRAM recommended for 20B models)
- Hugging Face Token (for gated models)

## 🐳 Docker Support (Recommended)

Run the entire stack (Backend + Frontend) with a single command.

1.  **Export your Hugging Face Token:**
    ```bash
    export HF_TOKEN=hf_...
    ```

2.  **Start the services:**
    ```bash
    docker-compose up --build
    ```

    - **Frontend:** [http://localhost:3000](http://localhost:3000)
    - **Backend API:** [http://localhost:8000](http://localhost:8000)
    - **Model Cache:** Models are stored in `~/.cache/huggingface` on your host to avoid re-downloading.

### 🐍 Manual Backend Setup

1.  **Navigate to the backend:**
    ```bash
    cd backend
    ```

2.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    *Note: `vllm` requires a Linux environment with CUDA support.*

3.  **Run the Server:**
    ```bash
    python main.py
    ```
    The API will be available at `http://localhost:8000` (Auto-reload enabled).

## 🧪 Features & Usage

### 1. Thinking Process (Chain of Thought)
The frontend automatically detects and displays the model's hidden reasoning steps in a collapsible "Thinking Process" block. This allows you to peer into the model's logic before it generates the final response.

### 2. Context Management
- **Token Limits:** Output limited to 1000 tokens (configurable).
- **Context Window:** Backend automatically truncates conversation history > 2000 tokens (configurable) to prevent OOM errors.

### 3. Concurrency Control
To ensure stability on consumer hardware, the engine enforces a **single active generation** policy. Concurrent requests will receive a `429 Too Many Requests` (Busy) response until the current generation finishes.

## 📝 Configuration

Configuration is managed via environment variables (see `.env.template`):

| Variable | Default | Description |
| :--- | :--- | :--- |
| `MODEL_NAME` | `openai/gpt-oss-20b` | Hugging Face model ID |
| `DEFAULT_MAX_TOKENS` | `1000` | Max output tokens per response |
| `MAX_CONTEXT_TOKENS` | `2000` | Max input context length (heuristic) |
| `DEFAULT_REASONING_EFFORT` | `low` | Model thinking depth (`low`, `medium`, `high`) |

---

*Built with ❤️ for the Open Source AI Community.*