# ─────────────────────────────────────────────────────────────
#  Worker — Dockerfile
#  python:3.11-slim, non-root user
# ─────────────────────────────────────────────────────────────
FROM python:3.11-slim AS base

WORKDIR /app

# Install dependencies first (layer-cached)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Non-root user for security
RUN addgroup --system worker \
 && adduser  --system --ingroup worker worker

USER worker

CMD ["python", "main.py"]
