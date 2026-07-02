"""
This file handles the connection to the PostgreSQL database.

The backend never reads the csv file directly. Instead the engineer data lives in the
database (a separate container), and this file is how the backend talks to it.
"""

import os
import psycopg2

# These settings come from the environment (set in docker-compose.yml).
# I use the service name "db" as the host because inside the docker network the
# database container is reachable by its service name, not by "localhost".
DB_HOST = os.environ.get("DB_HOST", "db")
DB_NAME = os.environ.get("POSTGRES_DB", "skillmatch")
DB_USER = os.environ.get("POSTGRES_USER", "skillmatch")
DB_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "localdev")


def get_connection():
    """Open and return a new connection to the database."""
    conn = psycopg2.connect(
        host=DB_HOST,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )
    return conn
