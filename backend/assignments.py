"""
Keeps track of which engineer a manager has put on which project.

The matcher only shows who fits. This file is the extra step after that: once a manager
picks an engineer for a project, it gets saved here so there is a record of who is
assigned where. I keep it in its own file so this feature is separate from the matching
and the login code.
"""

from database import get_connection


def create_assignments_table():
    """Make the assignments table if it is not there yet. Runs when the backend starts."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS assignments (
            id SERIAL PRIMARY KEY,
            engineer_id INTEGER,
            engineer_name TEXT,
            project_name TEXT,
            assigned_by TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
        """
    )
    conn.commit()
    cur.close()
    conn.close()


def add_assignment(engineer_id, engineer_name, project_name, assigned_by):
    """Save one engineer being put on one project, and return the new row."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO assignments (engineer_id, engineer_name, project_name, assigned_by) "
        "VALUES (%s, %s, %s, %s) RETURNING id, created_at",
        (engineer_id, engineer_name, project_name, assigned_by),
    )
    new_id, created_at = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return {
        "id": new_id,
        "engineer_id": engineer_id,
        "engineer_name": engineer_name,
        "project_name": project_name,
        "assigned_by": assigned_by,
        "created_at": str(created_at),
    }


def get_assignments():
    """Return every assignment, newest first, so the frontend can list them."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, engineer_id, engineer_name, project_name, assigned_by, created_at "
        "FROM assignments ORDER BY created_at DESC"
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    assignments = []
    for row in rows:
        assignments.append({
            "id": row[0],
            "engineer_id": row[1],
            "engineer_name": row[2],
            "project_name": row[3],
            "assigned_by": row[4],
            "created_at": str(row[5]),
        })
    return assignments


def remove_assignment(assignment_id):
    """Delete one assignment by its id (used when a manager takes an engineer off a project)."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM assignments WHERE id = %s", (assignment_id,))
    conn.commit()
    cur.close()
    conn.close()
