# Dockerfile for Hugging Face Spaces Deployment
# Multi-stage build optimized for HF Spaces with minimal image size

# Build stage
FROM python:3.10-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.10-slim AS production

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r flask && useradd -r -g flask flask

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv

# Copy Flask application
COPY flask_admin ./flask_admin
COPY app.py .

# Set up environment for HF Spaces
ENV PATH=/opt/venv/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FLASK_APP=app.py \
    FLASK_ENV=production \
    PORT=7860 \
    HOST=0.0.0.0

# Change ownership to flask user
RUN chown -R flask:flask /app

# Switch to non-root user
USER flask

# Expose HF Spaces port
EXPOSE 7860

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

# Run Flask with Gunicorn optimized for HF Spaces
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "2", "--timeout", "30", "--keep-alive", "2", "--max-requests", "1000", "--max-requests-jitter", "100", "app:app"]