"""
The matching logic for the backend.

This is the same idea as my similarity notebook, but instead of reading a csv it loads
the engineers from the database. It uses scikit-learn's k-NN to find the engineers who
best match the levels a project needs. It can also filter the engineers by vertical and
years of experience before matching.
"""

import numpy as np
from sklearn.neighbors import NearestNeighbors

from database import get_connection

# the six things I match on (same order everywhere)
ATTRIBUTES = ["seniority", "domain", "communication", "timezone", "stack", "bandwidth"]


def load_engineers(vertical=None, min_years=None, max_years=None):
    """Read engineers from the database, with optional filters for vertical and years."""
    conn = get_connection()
    cur = conn.cursor()

    query = (
        "SELECT name, role, region, vertical, years_experience, "
        "seniority, domain, communication, timezone, stack, bandwidth FROM engineers"
    )

    # only add the filters that were actually given
    conditions = []
    params = []
    if vertical:
        conditions.append("vertical = %s")
        params.append(vertical)
    if min_years is not None:
        conditions.append("years_experience >= %s")
        params.append(min_years)
    if max_years is not None:
        conditions.append("years_experience <= %s")
        params.append(max_years)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def recommend(project, method="euclidean", weights=None, top_n=10,
              vertical=None, min_years=None, max_years=None):
    """Return the engineers who best match what the project needs (after any filters)."""
    if weights is None:
        weights = {a: 1 for a in ATTRIBUTES}
    weight_vector = np.array([weights[a] for a in ATTRIBUTES])

    rows = load_engineers(vertical, min_years, max_years)

    # if the filters left no engineers there is nothing to match
    if len(rows) == 0:
        return []

    # cannot ask for more neighbours than the number of engineers we have
    n = min(top_n, len(rows))

    # the six values are the last six columns of each row
    attribute_matrix = np.array([row[-6:] for row in rows], dtype=float) * weight_vector
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
            "role": row[1],
            "region": row[2],
            "vertical": row[3],
            "years_experience": row[4],
            "seniority": row[5],
            "domain": row[6],
            "communication": row[7],
            "timezone": row[8],
            "stack": row[9],
            "bandwidth": row[10],
            "match_percent": round(float(scores[place]), 1),
        })
    return matches
