FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgl1-mesa-glx libglib2.0-0 libosmesa6 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install poetry
COPY backend/pyproject.toml backend/poetry.lock* ./
RUN poetry config virtualenvs.create false && poetry install --no-dev --no-interaction

COPY backend/ .

CMD ["celery", "-A", "app.workers.celery_app", "worker", "--loglevel=info"]
