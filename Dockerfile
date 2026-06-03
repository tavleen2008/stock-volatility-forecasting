FROM python:3.11-slim

WORKDIR /app

RUN pip install uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

COPY . .

EXPOSE 8080

CMD ["uvicorn", "ML.quant_pipeline.endpoint:app", "--host", "0.0.0.0", "--port", "8080"]