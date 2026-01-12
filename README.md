# 🧠 LocalAI: GPT-OSS Inference Engine

> **Raw, Unfiltered, High-Performance LLM Inference.**  
> Powered by [vLLM](https://github.com/vllm-project/vllm) and [FastAPI](https://fastapi.tiangolo.com/).

![Status](https://img.shields.io/badge/Status-Active-success)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![License](https://img.shields.io/badge/License-MIT-purple)

## 🚀 Overview

LocalAI is a streamlined, high-performance inference server designed to run open-source models (like GPT-OSS 20B) locally with maximum efficiency. We utilize `vLLM`'s PagedAttention technology to deliver state-of-the-art throughput and low latency streaming.

**Key Features:**
- ⚡ **Blazing Fast Inference:** Leverages vLLM for optimized memory management.
- 🌊 **Real-time Streaming:** Native async streaming endpoints using Server-Sent Events (SSE) / NDJSON.
- 🛠️ **Raw & Extensible:** Built on FastAPI, giving you full control over the API surface.

## 🛠️ Stack

- **Backend:** Python 3.10+, FastAPI, vLLM, Uvicorn
- **Frontend:** React (Vite) - *Active*

## 📦 Getting Started

### Prerequisites

- Python 3.10 or higher
- CUDA-enabled GPU (NVIDIA) for vLLM acceleration (optional for mock mode, required for real inference)

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
    The API will be available at `http://localhost:8000`.

### 🧪 API Usage

**Generate Text (Streamed):**

```bash
curl -X POST "http://localhost:8000/generate" \
     -H "Content-Type: application/json" \
     -d '{
           "prompt": "Explain quantum computing in one sentence.",
           "temperature": 0.7,
           "max_tokens": 100
         }'
```

## 📝 Configuration

- **Model Selection:** Currently defaults to `facebook/opt-125m` for testing. 
- Edit `backend/main.py` variable `MODEL_PATH` to switch to `gpt-oss-20b` or other supported models.

---

*Built with ❤️ for the Open Source AI Community.*
