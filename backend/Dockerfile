# Use NVIDIA CUDA base image for GPU support
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Install Python 3.10 and system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3-pip \
    python3.10-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Symlink python3 to python
RUN ln -s /usr/bin/python3.10 /usr/bin/python

# Set work directory
WORKDIR /app

# Install Python dependencies
# We copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the API port
EXPOSE 8000

# Command to run the application
CMD ["python", "main.py"]
