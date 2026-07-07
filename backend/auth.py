"""
Handles logins for the project.

Managers have to log in before they can use the matcher. This file makes the users
table, saves a new user (with the password hashed, never in plain text), checks a
password when someone logs in, and makes/reads the little token that proves a user is
logged in.

I keep this in its own file so all the login code is in one place, away from the
matching logic.
"""

import os
import hashlib
import secrets
import datetime

import jwt
from fastapi import Header, HTTPException

from database import get_connection

# this key signs the login token. in a real setup it would come from the environment,
# here there is a default so the project still runs on its own.
SECRET_KEY = os.environ.get("SECRET_KEY", "skillmatch-local-dev-key-not-a-real-secret")

# the login token stops working after this many hours, so an old token is not valid forever
TOKEN_HOURS = 12


def create_users_table():
    """Make the users table if it is not there yet. Runs when the backend starts."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE,
            password_hash TEXT,
            salt TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
        """
    )
    conn.commit()
    cur.close()
    conn.close()


def hash_password(password, salt):
    """
    Turn a password into a hash using its salt. The salt is a random bit of text that is
    saved next to the hash, so two people with the same password still get different
    hashes. Same password + same salt always gives the same hash, which is how login
    checks the password later.
    """
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt.encode(), 100000
    ).hex()


def register(email, password):
    """Save a new manager. Returns a login token, or raises if the email is already used."""
    email = email.strip().lower()

    conn = get_connection()
    cur = conn.cursor()

    # is this email already registered?
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    if cur.fetchone() is not None:
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="That email is already registered.")

    salt = secrets.token_hex(16)
    password_hash = hash_password(password, salt)

    cur.execute(
        "INSERT INTO users (email, password_hash, salt) VALUES (%s, %s, %s) RETURNING id",
        (email, password_hash, salt),
    )
    user_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return make_token(user_id, email)


def login(email, password):
    """Check the email and password. If they are right, hand back a login token."""
    email = email.strip().lower()

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, password_hash, salt FROM users WHERE email = %s", (email,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    # same error for "no such user" and "wrong password" so it does not leak which emails exist
    if row is None:
        raise HTTPException(status_code=401, detail="Wrong email or password.")

    user_id, saved_hash, salt = row
    if hash_password(password, salt) != saved_hash:
        raise HTTPException(status_code=401, detail="Wrong email or password.")

    return make_token(user_id, email)


def make_token(user_id, email):
    """Build a signed token that holds who the user is and when it stops working."""
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=TOKEN_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def current_user(authorization: str = Header(None)):
    """
    Read the token off the request and return the logged in user. The protected
    endpoints use this: if the token is missing, wrong, or expired it raises 401 and the
    request never reaches the matcher.

    The frontend sends the header as "Bearer <token>", so I drop the "Bearer " part first.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Please log in first.")

    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Your session has expired, please log in again.")

    return {"user_id": payload["user_id"], "email": payload["email"]}


def seed_default_manager():
    """
    Make one manager account so the app can be tried straight away without registering.
    Only adds it if it is not there yet.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email = %s", ("manager@skillmatch.com",))
    exists = cur.fetchone() is not None
    cur.close()
    conn.close()

    if not exists:
        register("manager@skillmatch.com", "password123")
        print("added default manager login")
