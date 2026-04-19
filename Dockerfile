# Deployment-only Dockerfile (Option A)
# Frontend is pre-built locally — no Node.js stage needed.
# This makes Hugging Face builds significantly faster.

FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy backend source first to install requirements
COPY backend /app/backend
WORKDIR /app/backend

# Copy prebuilt frontend assets (compiled locally via `npm run build`)
COPY frontend/dist /app/backend/static

# Copy the top-level requirements file into the image
COPY requirements.txt /app/requirements.txt

# Install backend dependencies from the copied requirements file
RUN pip install --no-cache-dir -r /app/requirements.txt

# Download the embedding model for offline use during build
# This stores it in /app/model_cache/all-MiniLM-L6-v2
RUN mkdir -p /app/model_cache && \
    python -c "from huggingface_hub import snapshot_download; \
    snapshot_download('sentence-transformers/all-MiniLM-L6-v2', \
    local_dir='/app/model_cache/all-MiniLM-L6-v2', \
    token=None)"

# Set environment variables for Hugging Face and offline model loading
ENV PORT=7860 \
    HOST=0.0.0.0 \
    PYTHONUNBUFFERED=1 \
    UVICORN_PORT=7860 \
    SENTENCE_TRANSFORMERS_HOME=/app/model_cache \
    TRANSFORMERS_OFFLINE=1 \
    HF_DATASETS_OFFLINE=1

# Expose the standard HF Spaces port
EXPOSE 7860

# Metadata for Hugging Face
LABEL maintainer="TicketIQ Team"
LABEL description="TicketIQ Unified Intelligence Hub"

# Multi-stage startup:
# 1. Run migrations (Neon)
# 2. Start Unified FastAPI (React + Intelligence Hub)
CMD bash -c "alembic -c config/alembic.ini upgrade head || alembic -c config/alembic.ini stamp head; uvicorn main:app --host 0.0.0.0 --port 7860"
