# Container for the Python backend.
FROM python:3.11-slim

WORKDIR /app

# install the python libraries first so docker can cache this layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy the rest of the backend code
COPY . .

# start the API server, reachable from outside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
