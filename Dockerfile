# ==========================================
# STAGE 1: Build Design System (using Bun)
# ==========================================
FROM oven/bun:1-slim AS design-system-build
WORKDIR /app/design-system

# Speed up: Skip heavy browser downloads (Playwright/Puppeteer)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=true

# Copy package files separately for caching
COPY design-system/package.json ./
# Bun is extremely fast at installing from package-lock.json
RUN bun install

# Copy source and build
COPY design-system/ ./
RUN bun run build

# ==========================================
# STAGE 2: Build Frontend (using Bun)
# ==========================================
FROM oven/bun:1-slim AS frontend-build
WORKDIR /app

# Copy built design system (dependency)
COPY --from=design-system-build /app/design-system /app/design-system

WORKDIR /app/frontend
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Copy package files
COPY frontend/package.json ./
# Install frontend dependencies
RUN bun install

# Copy source and build (Vite/TypeScript)
COPY frontend/ ./
RUN bun run build

# ==========================================
# STAGE 3: Production Image (Python Runtime)
# ==========================================
FROM python:3.10-slim

# Set environment variables for HF Spaces
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    SENTENCE_TRANSFORMERS_HOME=/home/user/model_cache \
    TRANSFORMERS_OFFLINE=1 \
    HF_DATASETS_OFFLINE=1

# Create non-root user (Hugging Face requirement)
RUN useradd -m -u 1000 user
WORKDIR /home/user/app

# Install backend system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy backend source + Built frontend assets
COPY --from=frontend-build /app/frontend/dist ./static
COPY backend/ ./

# Permissions
RUN chown -R user:user /home/user/app
USER user

# Pre-download AI models
RUN mkdir -p /home/user/model_cache && \
    python -c "from huggingface_hub import snapshot_download; \
    snapshot_download('sentence-transformers/all-MiniLM-L6-v2', \
    local_dir='/home/user/model_cache/all-MiniLM-L6-v2', \
    token=None)"

EXPOSE 7860

# Startup: Apply migrations and start Uvicorn
CMD ["sh", "-c", "alembic -c config/alembic.ini upgrade head || alembic -c config/alembic.ini stamp head; uvicorn main:app --host 0.0.0.0 --port 7860"]
