FROM python:3.11-slim

WORKDIR /app

# Install dependencies directly from the pyproject.toml requirements
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    "fastapi>=0.110.0" \
    "uvicorn[standard]>=0.28.0" \
    "sqlalchemy>=2.0.0" \
    "pandas>=2.0.0" \
    "xlrd>=2.0.1" \
    "pyjwt[crypto]>=2.8.0" \
    "passlib[bcrypt]>=1.7.4" \
    "bcrypt>=4.0.0" \
    "python-multipart>=0.0.9" \
    "email-validator>=2.0.0"

# Copy source code
COPY app/ ./app/

# Expose port
EXPOSE 8000

# Run FastAPI with hot-reloading disabled for production deployment
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
