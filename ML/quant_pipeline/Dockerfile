FROM python:3.11-slim

WORKDIR /project/ML/quant_pipeline

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

ENV PATH="/project/ML/quant_pipeline/.venv/bin:${PATH}"

COPY . .

EXPOSE 8080

CMD ["uvicorn", "endpoint:app", "--host", "0.0.0.0", "--port", "8080"]