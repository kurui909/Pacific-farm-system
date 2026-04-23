FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Use shell form so $PORT expands
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT