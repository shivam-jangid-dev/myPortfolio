# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /app

# Install uv for fast, deterministic dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency manifests first (layer cache optimisation)
COPY pyproject.toml uv.lock ./

# Install production dependencies into a virtual-env inside the image
RUN uv sync --frozen --no-dev --no-install-project

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM python:3.13-slim

WORKDIR /app

# Copy the virtual-env from the builder stage
COPY --from=builder /app/.venv /app/.venv

# Copy the application source code
COPY . .

# Put the virtual-env's bin directory on PATH so `uvicorn` is found directly
ENV PATH="/app/.venv/bin:$PATH"

# Re injects PORT at runtime; default to 8080 for local testing
ENV PORT=8080
EXPOSE ${PORT}

# Run the FastAPI app via uvicorn
CMD ["python", "main.py"]
