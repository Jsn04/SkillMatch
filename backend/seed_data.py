"""
This script creates the engineers table and loads the engineer data into it.

It runs automatically when the backend starts. It only loads the data if the table
is empty, so restarting the app does not add the engineers again.
"""

import csv
import time

from psycopg2.extras import execute_values

from database import get_connection

# the data file is shared into the container at this path (see docker-compose.yml)
CSV_PATH = "/app/data/engineers.csv"

# the columns we load, in the same order as the csv
COLUMNS = [
    "name", "role", "region", "vertical", "years_experience",
    "seniority", "domain", "communication", "timezone", "stack", "bandwidth",
]

# these columns are numbers, the rest are text
NUMERIC_COLUMNS = {
    "years_experience", "seniority", "domain", "communication",
    "timezone", "stack", "bandwidth",
}


def wait_for_database():
    """Keep trying to connect until the database is ready (it can start a little later)."""
    for attempt in range(10):
        try:
            conn = get_connection()
            conn.close()
            return
        except Exception:
            print("database not ready yet, waiting...")
            time.sleep(1)
    # one last try, and let it raise the error if it still fails
    get_connection().close()


def create_table(conn):
    """Create the engineers table if it does not exist yet."""
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS engineers (
            id SERIAL PRIMARY KEY,
            name TEXT,
            role TEXT,
            region TEXT,
            vertical TEXT,
            years_experience INTEGER,
            seniority INTEGER,
            domain INTEGER,
            communication INTEGER,
            timezone INTEGER,
            stack INTEGER,
            bandwidth INTEGER
        )
        """
    )
    conn.commit()
    cur.close()


def table_is_empty(conn):
    """Return True if there are no engineers in the table yet."""
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM engineers")
    count = cur.fetchone()[0]
    cur.close()
    return count == 0


def load_engineers(conn):
    """Read engineers.csv and insert every row into the table."""
    rows = []
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            values = []
            for col in COLUMNS:
                value = row[col]
                if col in NUMERIC_COLUMNS:
                    value = int(value)   # turn the text "40" into the number 40
                values.append(value)
            rows.append(values)

    cur = conn.cursor()
    # insert all the rows in one go
    execute_values(
        cur,
        "INSERT INTO engineers "
        "(name, role, region, vertical, years_experience, "
        "seniority, domain, communication, timezone, stack, bandwidth) VALUES %s",
        rows,
    )
    conn.commit()
    cur.close()
    print("loaded", len(rows), "engineers")


def seed():
    """Create the table and load the data into it if it is empty."""
    wait_for_database()
    conn = get_connection()
    create_table(conn)
    if table_is_empty(conn):
        load_engineers(conn)
    else:
        print("engineers already loaded, skipping")
    conn.close()


if __name__ == "__main__":
    seed()
