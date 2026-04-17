# Multi-stage production Dockerfile for FastAPI backend
# Stage 1: Builder - install dependencies
FROM python:3.10-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies to /opt/venv
COPY requirements.txt .
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime - minimal production image
FROM python:3.10-slim

# Block DISABLE_PII_SCRUBBING=true in production via ARG guard
ARG DISABLE_PII_SCRUBBING=false
RUN if [ "$DISABLE_PII_SCRUBBING" = "true" ]; then \
        echo "ERROR: DISABLE_PII_SCRUBBING=true is not allowed in production builds" >&2; \
        exit 1; \
    fi

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application code (from context root)
COPY src ./src
COPY config ./config
COPY alembic ./alembic
COPY scripts ./scripts
COPY main.py .
COPY pyproject.toml .

# Ensure scripts are in PATH
ENV PATH=/opt/venv/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UVICORN_WORKERS=2 \
    GUNICORN_CMD_ARGS="--graceful-timeout 30 --timeout 60"

# Precompile bytecode to catch syntax errors early (only app code, not dependencies)
RUN python -m compileall /app -x '/app/\\..*' -x '.*/site-packages/.*' -x '.*/\\.venv.*' || true

# Run as root (dependencies are now in /opt/venv which is accessible to all users)
# For production with non-root user, uncomment below and remove user: line from docker-compose.yml
# RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
# USER appuser

# Expose FastAPI port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health/live || exit 1

# Run FastAPI with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
