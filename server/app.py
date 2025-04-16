import secrets
import hashlib
import requests
from flask import Flask, request, redirect, jsonify, session
from flask_cors import CORS
import urllib.parse
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = secrets.token_urlsafe(64)
app.config['SESSION_TYPE'] = 'filesystem'  # Use Redis in production
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = os.getenv("FLASK_ENV") == "production"
app.config['SESSION_COOKIE_HTTPONLY'] = True

CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:5173")
cors = CORS(app, resources={
    r"/*": {
        "origins": [CORS_ORIGIN],
        "methods": ["GET", "POST", "OPTIONS"],
        "supports_credentials": True,
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Set-Cookie"]
    }
})

CLIENT_KEY = os.getenv("TIKTOK_CLIENT_KEY")
CLIENT_SECRET = os.getenv("TIKTOK_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
SCOPES = "user.info.basic,video.list"

def validate_redirect_uri(uri):
    import re
    pattern = r'^(http|https)://(localhost|127\.0\.0\.1)(:\d+|\:\*)/[a-zA-Z0-9/]*$'
    if not re.match(pattern, uri):
        raise ValueError("Invalid redirect URI")
    return uri

REDIRECT_URI = validate_redirect_uri(REDIRECT_URI)

def generate_random_string(length):
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    return ''.join(secrets.choice(characters) for _ in range(length))

def generate_code_verifier():
    return generate_random_string(64)

def generate_code_challenge(verifier):
    return hashlib.sha256(verifier.encode('utf-8')).hexdigest()

@app.route("/auth/init/")
def auth_init():
    try:
        code_verifier = generate_code_verifier()
        code_challenge = generate_code_challenge(code_verifier)
        state = generate_random_string(16)

        session["state"] = state
        session["code_verifier"] = code_verifier
        session.modified = True

        logger.info(f"Generated - state: {state}, code_verifier: {code_verifier}, code_challenge: {code_challenge}")

        auth_url = (
            f'https://www.tiktok.com/v2/auth/authorize/?'
            f'client_key={urllib.parse.quote(CLIENT_KEY)}&'
            f'scope={urllib.parse.quote(SCOPES)}&'
            f'response_type=code&'
            f'redirect_uri={urllib.parse.quote(REDIRECT_URI)}&'
            f'state={urllib.parse.quote(state)}&'
            f'code_challenge={urllib.parse.quote(code_challenge)}&'
            f'code_challenge_method=S256'
        )
        return jsonify({"auth_url": auth_url})
    except Exception as e:
        logger.error(f"Error in auth_init: {str(e)}")
        return jsonify({"error": "Failed to initialize auth", "details": str(e)}), 500

@app.route("/callback/")
def callback():
    code = request.args.get("code")
    state = request.args.get("state")
    error = request.args.get("error")
    error_description = request.args.get("error_description", "")

    logger.info(f"Callback received - code: {code}, state: {state}, error: {error}")

    if error:
        logger.error(f"Callback error from TikTok: {error}, description: {error_description}")
        return redirect(f"{CORS_ORIGIN}/tiktok-callback?error={urllib.parse.quote(error)}&error_description={urllib.parse.quote(error_description)}")

    stored_state = session.get("state")
    code_verifier = session.get("code_verifier")

    session.pop("state", None)
    session.pop("code_verifier", None)
    session.modified = True

    if state != stored_state:
        logger.error(f"State mismatch - received: {state}, stored: {stored_state}")
        return redirect(f"{CORS_ORIGIN}/tiktok-callback?error=csrf_verification_failed")

    if not code or not code_verifier:
        logger.error("Missing code or code_verifier")
        return redirect(f"{CORS_ORIGIN}/tiktok-callback?error=missing_parameters")

    token_data = get_access_token(code, code_verifier, REDIRECT_URI)
    if token_data and "access_token" in token_data:
        logger.info("Successfully obtained access token")
        return redirect(f"{CORS_ORIGIN}/tiktok-callback?access_token={urllib.parse.quote(token_data['access_token'])}")
    else:
        logger.error("Failed to get access token")
        return redirect(f"{CORS_ORIGIN}/tiktok-callback?error=failed_to_obtain_access_token")

def get_access_token(code, code_verifier, redirect_uri):
    url = "https://open.tiktokapis.com/v2/oauth/token/"
    data = {
        "client_key": CLIENT_KEY,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri,
        "code_verifier": code_verifier
    }

    logger.info(f"Token request data: {data}")

    try:
        response = requests.post(url, data=data)
        response.raise_for_status()
        data = response.json()
        if "access_token" not in data:
            logger.error(f"Error in token response: {data}")
            return None
        return {
            "access_token": data.get("access_token"),
            "refresh_token": data.get("refresh_token"),
            "expires_in": data.get("expires_in")
        }
    except requests.RequestException as e:
        logger.error(f"Error getting access token: {str(e)}")
        return None

if __name__ == "__main__":
    app.run(debug=True, port=5000, use_reloader=False)