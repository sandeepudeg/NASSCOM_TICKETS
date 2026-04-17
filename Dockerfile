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

# Copy backend source
COPY backend /app/backend
WORKDIR /app/backend

# Copy prebuilt frontend assets (compiled locally via `npm run build`)
COPY frontend/dist /app/backend/static

# Install backend dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set essential environment variables for Hugging Face
ENV PORT=7860 \
    HOST=0.0.0.0 \
    PYTHONUNBUFFERED=1 \
    UVICORN_PORT=7860

# Expose the standard HF Spaces port
EXPOSE 7860

# Metadata for Hugging Face
LABEL maintainer="TicketIQ Team"
LABEL description="TicketIQ Unified Intelligence Hub"

# Multi-stage startup:
# 1. Run migrations (Neon)
# 2. Start Unified FastAPI (React + Intelligence Hub)
CMD alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 7860
