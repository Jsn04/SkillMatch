"""
The matching logic for the backend.

This is the same idea as my similarity notebook, but instead of reading a csv it loads
the engineers from the database. It uses scikit-learn's k-NN to find the engineers who
best match the levels a project needs. It can also filter the engineers by discipline
and vertical before matching. I do not filter by years of experience separately, since
the Experience Level dropdown already implies a years range, and letting both be set at
once could contradict each other (for example picking "Junior" but also 15+ years).

It also takes current availability into account. An engineer who is already fully booked
on another project is not a real option if I need to fill a seat right now (an exact fit
search), so those are left out automatically. For a potential fit search I am scouting
ahead rather than staffing today, so a busy engineer is still shown, just with their
status so I know when they would actually be free.
"""

import numpy as np
from sklearn.neighbors import NearestNeighbors

from database import get_connection

# the five levels I match on (same order everywhere)
ATTRIBUTES = ["seniority", "domain", "communication", "timezone", "bandwidth"]


def load_engineers(discipline=None, vertical=None, exclude_fully_booked=False):
    """Read engineers from the database, with optional filters."""
    conn = get_connection()
    cur = conn.cursor()

    query = (
        "SELECT name, discipline, region, vertical, years_experience, "
        "seniority, domain, communication, timezone, bandwidth, "
        "availability_status, available_in_weeks FROM engineers"
    )

    # only add the filters that were actually given
    conditions = []
    params = []
    if discipline:
        conditions.append("discipline = %s")
        params.append(discipline)
    if vertical:
        conditions.append("vertical = %s")
        params.append(vertical)
    if exclude_fully_booked:
        conditions.append("availability_status != %s")
        params.append("Fully booked")

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def recommend(project, method="euclidean", weights=None, top_n=10,
              discipline=None, vertical=None):
    """Return the engineers who best match what the project needs (after any filters)."""
    if weights is None:
        weights = {a: 1 for a in ATTRIBUTES}
    weight_vector = np.array([weights[a] for a in ATTRIBUTES])

    # exact fit = fill the seat now, so a fully booked engineer is not a real option.
    # potential fit = scouting ahead, so busy engineers are still worth showing.
    exclude_fully_booked = (method == "euclidean")

    rows = load_engineers(discipline, vertical, exclude_fully_booked)

    # if the filters left no engineers there is nothing to match
    if len(rows) == 0:
        return []

    # cannot ask for more neighbours than the number of engineers we have
    n = min(top_n, len(rows))

    # the five levels are columns 5 to 9 of each row (before the availability columns)
    attribute_matrix = np.array([row[5:10] for row in rows], dtype=float) * weight_vector
    project_point = np.array([project[a] for a in ATTRIBUTES], dtype=float) * weight_vector

    knn = NearestNeighbors(n_neighbors=n, metric=method)
    knn.fit(attribute_matrix)
    distances, indices = knn.kneighbors([project_point])

    # turn the distance into an easy 0-100 match score
    if method == "euclidean":
        max_distance = np.sqrt((weight_vector ** 2 * (99 ** 2)).sum())
        scores = (1 - distances[0] / max_distance) * 100
    else:  # cosine distance is 1 - similarity
        scores = (1 - distances[0]) * 100

    # build the list of matched engineers to send back
    matches = []
    for place, row_index in enumerate(indices[0]):
        row = rows[row_index]
        matches.append({
            "name": row[0],
            "discipline": row[1],
            "region": row[2],
            "vertical": row[3],
            "years_experience": row[4],
            "seniority": row[5],
            "domain": row[6],
            "communication": row[7],
            "timezone": row[8],
            "bandwidth": row[9],
            "availability_status": row[10],
            "available_in_weeks": row[11],
            "match_percent": round(float(scores[place]), 1),
        })
    return matches
