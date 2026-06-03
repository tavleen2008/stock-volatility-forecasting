FROM python:3.11-slim

WORKDIR /project

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

RUN pip install uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

ENV PATH="/project/.venv/bin:${PATH}"

COPY . .

WORKDIR /project/ML/quant_pipeline

EXPOSE 8080

CMD ["uvicorn", "endpoint:app", "--host", "0.0.0.0", "--port", "8080"]