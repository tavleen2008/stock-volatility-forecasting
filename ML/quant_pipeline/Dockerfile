FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

ENV UV_EXTRA_INDEX_URL="https://download.pytorch.org/whl/cpu"

# Use the official uv binary for lightning-fast installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy only dependency files first to maximize Docker layer caching
COPY pyproject.toml uv.lock ./

# Install dependencies (but NOT the project source code yet)
RUN uv sync --frozen --no-dev --no-install-project

# Now copy the source code
COPY . .

# Final sync to install the project itself
RUN uv sync --frozen --no-dev

ENV PATH="/app/.venv/bin:${PATH}"

EXPOSE 8080

CMD ["uvicorn", "endpoint:app", "--host", "0.0.0.0", "--port", "8080"]