# Stage 1: Build the Design System and Frontend
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies for design system (rimraf, etc.)
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Optimize for HF Spaces: Skip heavy browser downloads during build
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    NPM_CONFIG_LOGLEVEL=error

# Copy common design system first
COPY design-system ./design-system
WORKDIR /app/design-system

RUN npm ci --legacy-peer-deps
RUN npm run build

# Copy and build the frontend
WORKDIR /app
COPY frontend ./frontend
WORKDIR /app/frontend

RUN npm ci --legacy-peer-deps
# Vite build will pick up the design-system from the parent directory link
RUN npm run build

# Stage 2: Clean Production Runtime
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

# Copy built frontend assets from builder stage
COPY --from=builder /app/frontend/dist /app/backend/static

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

