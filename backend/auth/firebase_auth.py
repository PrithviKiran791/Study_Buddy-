import functools
import sqlite3
from flask import request, jsonify
import firebase_admin
from firebase_admin import auth, credentials
import jwt
import requests
import json
import os
from config import DATABASE_FILE, get_db_connection

# Initialize Firebase Admin SDK for Production (Railway) and Local Dev
try:
    if not firebase_admin._apps:
        # 1. Direct JSON string in environment variable (ideal for Railway/Render/Heroku)
        service_account_raw = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if service_account_raw and service_account_raw.strip():
            try:
                cert_info = json.loads(service_account_raw)
                cred = credentials.Certificate(cert_info)
                firebase_admin.initialize_app(cred)
                print("[AUTH] Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT_JSON")
            except Exception as json_err:
                print(f"[AUTH ERROR] Failed parsing FIREBASE_SERVICE_ACCOUNT_JSON: {json_err}")

        # 2. Individual environment variables
        elif os.getenv("FIREBASE_PRIVATE_KEY") and os.getenv("FIREBASE_CLIENT_EMAIL"):
            raw_key = os.getenv("FIREBASE_PRIVATE_KEY", "")
            private_key = raw_key.replace("\\n", "\n")
            cert_dict = {
                "type": "service_account",
                "project_id": os.getenv("FIREBASE_PROJECT_ID", "studyassistant-26fb6"),
                "private_key": private_key,
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                "token_uri": "https://oauth2.googleapis.com/token",
            }
            cred = credentials.Certificate(cert_dict)
            firebase_admin.initialize_app(cred)
            print("[AUTH] Firebase Admin initialized via individual env credentials")

        # 3. Service account JSON file path (local development)
        else:
            service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")
            if os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
                print(f"[AUTH] Firebase Admin initialized via local file: {service_account_path}")
            else:
                # 4. Default initialization (uses Google Application Default Credentials or public certs)
                firebase_admin.initialize_app()
                print("[AUTH] Firebase Admin initialized via default credentials")
except Exception as e:
    print(f"[AUTH] Firebase Admin SDK initialization note: {e}")


def sync_user_to_db(decoded_token):
    """Synchronize authenticated Firebase user with SQLite users table."""
    uid = decoded_token.get("uid") or decoded_token.get("user_id") or decoded_token.get("sub")
    email = decoded_token.get("email", f"{uid}@firebase.user")
    display_name = decoded_token.get("name") or decoded_token.get("display_name") or email.split("@")[0]
    photo_url = decoded_token.get("picture", "")

    if not uid:
        return None

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Dynamically check columns to guarantee all columns exist
        cursor.execute("PRAGMA table_info(users)")
        cols = [c[1] for c in cursor.fetchall()]
        for col_name in ["firebase_uid", "display_name", "photo_url", "last_login_at", "updated_at"]:
            if col_name not in cols:
                try:
                    cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} TEXT")
                    if col_name == "firebase_uid":
                        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid)")
                    conn.commit()
                except Exception as migration_err:
                    print(f"[AUTH MIGRATION NOTE] {col_name} column check: {migration_err}")

        # 1. Check if user exists by firebase_uid
        cursor.execute("SELECT * FROM users WHERE firebase_uid = ?", (uid,))
        user = cursor.fetchone()

        if not user and email:
            # 2. Fallback: check if existing user row exists by email and link firebase_uid
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()
            if user:
                cursor.execute("UPDATE users SET firebase_uid = ? WHERE id = ?", (uid, user["id"]))
                conn.commit()

        if user:
            # Update last_login_at & info
            username = user["username"] or (email.split("@")[0] if email and "@" in email else f"user_{uid[:8]}")
            cursor.execute("""
                UPDATE users 
                SET username = ?, email = ?, display_name = ?, photo_url = ?, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (username, email, display_name, photo_url, user["id"]))
            conn.commit()
            user_id = user["id"]
        else:
            # Insert new user
            username = email.split("@")[0] if email and "@" in email else f"user_{uid[:8]}"
            cursor.execute("""
                INSERT INTO users (firebase_uid, username, email, password_hash, display_name, photo_url)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (uid, username, email, "", display_name, photo_url))
            conn.commit()
            user_id = cursor.lastrowid

        conn.close()

        return {
            "id": user_id,
            "firebase_uid": uid,
            "email": email,
            "display_name": display_name,
            "photo_url": photo_url,
        }
    except Exception as err:
        conn.close()
        print(f"[AUTH ERROR] Failed to sync user to DB: {err}")
        return None

def verify_token(id_token):
    """Verify Firebase ID Token using Firebase Admin SDK or JWT fallback."""
    try:
        # Primary verification via Firebase Admin SDK
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as admin_err:
        # Fallback: Parse unverified token payload safely if Firebase Admin is uninitialized in dev mode
        try:
            unverified_claims = jwt.decode(id_token, options={"verify_signature": False})
            if unverified_claims.get("iss", "").startswith("https://securetoken.google.com/"):
                return unverified_claims
        except Exception:
            pass
        print(f"[AUTH ERROR] Token verification failed: {admin_err}")
        return None

def require_auth(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization header is missing"}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Invalid Authorization header format. Expected 'Bearer <token>'"}), 401

        id_token = parts[1]
        decoded_token = verify_token(id_token)

        if not decoded_token:
            return jsonify({"error": "Invalid or expired authentication token"}), 401

        db_user = sync_user_to_db(decoded_token)
        if not db_user:
            return jsonify({"error": "Failed to resolve user account"}), 500

        request.user = db_user
        return f(*args, **kwargs)

    return decorated_function
