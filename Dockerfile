# Base image
FROM python:3.10-slim-buster

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y curl build-essential libpq-dev \
    && apt-get clean

# Install PostgreSQL client and development files
RUN apt-get install -y postgresql-client postgresql-server-dev-all

# Copy the backend directory
COPY backend/ /app/backend/

# Copy and install backend dependencies
COPY backend/pyproject.toml /app/backend/
RUN pip install poetry && cd backend && poetry install --no-root --no-dev

# Run Django migrations
RUN cd backend && poetry run python manage.py makemigrations && poetry run python manage.py migrate

# Expose the port for Django server
EXPOSE 8000

# Start the Django server
CMD cd backend && poetry run gunicorn backend.wsgi:application --bind 0.0.0.0:8000