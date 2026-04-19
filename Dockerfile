# ==========================================
# STAGE 1: Build Design System
# ==========================================
FROM node:20-slim AS design-system-build
WORKDIR /app/design-system
COPY design-system/package*.json ./
RUN npm install
COPY design-system/ ./
RUN npm run build

# ==========================================
# STAGE 2: Build Frontend
# ==========================================
FROM node:20-slim AS frontend-build
WORKDIR /app
# Copy design system from stage 1 (needed as a local dependency)
COPY --from=design-system-build /app/design-system /app/design-system
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 3: Production Image
# ==========================================
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    SENTENCE_TRANSFORMERS_HOME=/home/user/model_cache \
    TRANSFORMERS_OFFLINE=1 \
    HF_DATASETS_OFFLINE=1

# Create a non-root user (Hugging Face Spaces requirement)
RUN useradd -m -u 1000 user
WORKDIR /home/user/app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements first for better caching
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy backend source
COPY --from=frontend-build /app/frontend/dist ./static
COPY backend/ ./

# Ensure correct permissions
RUN chown -R user:user /home/user/app

# Switch to non-root user
USER user

# Pre-download embedding models for offline use (prevents runtime downloads)
RUN mkdir -p /home/user/model_cache && \
    python -c "from huggingface_hub import snapshot_download; \
    snapshot_download('sentence-transformers/all-MiniLM-L6-v2', \
    local_dir='/home/user/model_cache/all-MiniLM-L6-v2', \
    token=None)"

# Expose the standard HF Spaces port
EXPOSE 7860

# Unified Startup: Run migrations then start FastAPI
# We use 'alembic stamp head' as a fallback to ensure the DB is marked as current 
# if it was manually initialized or seeded outside of migrations.
CMD ["sh", "-c", "alembic -c config/alembic.ini upgrade head || alembic -c config/alembic.ini stamp head; uvicorn main:app --host 0.0.0.0 --port 7860"]
