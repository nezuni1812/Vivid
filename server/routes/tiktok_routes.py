import secrets
import hashlib
import requests
from flask import Blueprint, request, redirect, jsonify, session
from flask_cors import cross_origin
import urllib.parse
import os
from dotenv import load_dotenv
import logging
import time
import re

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
tiktok_bp = Blueprint('tiktok', __name__)

# TikTok configuration
CLIENT_KEY = os.getenv("TIKTOK_CLIENT_KEY")
CLIENT_SECRET = os.getenv("TIKTOK_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
SCOPES = "user.info.basic,user.info.profile,user.info.stats,video.list,video.publish,video.upload"
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:5173")
UPLOAD_CONTENT_API_URL = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/"
DIRECT_POST_API_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/"
STATUS_API_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/"

def validate_redirect_uri(uri):
    import re
    pattern = r'^(http|https)://(localhost|127\.0\.0\.1)(:\d+|\:\*)/[a-zA-Z0-9/]*$'
    if not re.match(pattern, uri):
        raise ValueError("Invalid redirect URI")
    return uri

# Validate REDIRECT_URI at module level
REDIRECT_URI = validate_redirect_uri(REDIRECT_URI)

def generate_random_string(length):
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    return ''.join(secrets.choice(characters) for _ in range(length))

def generate_code_verifier():
    return generate_random_string(64)

def generate_code_challenge(verifier):
    return hashlib.sha256(verifier.encode('utf-8')).hexdigest()

@tiktok_bp.route("/auth/init/", methods=["GET", "OPTIONS"])
@cross_origin(origins=["http://localhost:5173"], methods=["GET", "OPTIONS"], allow_headers=["Content-Type"], supports_credentials=True)
def auth_init():
    if request.method == "OPTIONS":
        return jsonify({}), 200

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

@tiktok_bp.route("/callback/", methods=["GET", "OPTIONS"])
@cross_origin(origins=["http://localhost:5173"], methods=["GET", "OPTIONS"], allow_headers=["Content-Type"], supports_credentials=True)
def callback():
    if request.method == "OPTIONS":
        return jsonify({}), 200

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

@tiktok_bp.route("/upload-video/", methods=["POST", "OPTIONS"])
@cross_origin(origins=["http://localhost:5173"], methods=["POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"], supports_credentials=True)
def upload_video():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            logger.error("Missing or invalid Authorization header")
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        access_token = auth_header.split(" ")[1]
        logger.info(f"Access token: {access_token}")

        source_type = request.form.get("source_type", "FILE_UPLOAD")
        publish_type = request.form.get("publish_type", "UPLOAD_CONTENT")  # Default to UPLOAD_CONTENT
        video_url = request.form.get("video_url") if source_type == "PULL_FROM_URL" else None
        video_file = request.files.get("video_file") if source_type == "FILE_UPLOAD" else None

        if source_type == "FILE_UPLOAD" and not video_file:
            logger.error("No video file provided")
            return jsonify({"error": "No video file provided"}), 400
        if source_type == "PULL_FROM_URL" and not video_url:
            logger.error("No video URL provided")
            return jsonify({"error": "No video URL provided"}), 400
        if publish_type not in ["UPLOAD_CONTENT", "DIRECT_POST"]:
            logger.error(f"Invalid publish_type: {publish_type}")
            return jsonify({"error": "Invalid publish_type, must be UPLOAD_CONTENT or DIRECT_POST"}), 400

        # Validate video_url for PULL_FROM_URL
        if source_type == "PULL_FROM_URL":
            # Ensure URL is valid and publicly accessible
            url_pattern = r'^https?://[^\s<>"]+|www\.[^\s<>"]+$'
            if not re.match(url_pattern, video_url):
                logger.error(f"Invalid video URL format: {video_url}")
                return jsonify({"error": "Invalid video URL format"}), 400

            # Verify URL accessibility
            try:
                head_response = requests.head(video_url, timeout=5, allow_redirects=True)
                if head_response.status_code != 200:
                    logger.error(f"Video URL inaccessible, status: {head_response.status_code}")
                    return jsonify({"error": "Video URL is inaccessible", "details": f"HTTP {head_response.status_code}"}), 400
                
                # Check Content-Type
                content_type = head_response.headers.get("Content-Type", "").lower()
                if not content_type.startswith("video/"):
                    logger.warning(f"Unexpected Content-Type: {content_type}")
                    # Allow proceeding but log for debugging
            except requests.RequestException as e:
                logger.error(f"Failed to validate video URL: {str(e)}")
                return jsonify({"error": "Failed to validate video URL", "details": str(e)}), 400

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # Select API URL based on publish_type
        api_url = UPLOAD_CONTENT_API_URL if publish_type == "UPLOAD_CONTENT" else DIRECT_POST_API_URL

        if source_type == "FILE_UPLOAD":
            video_size = len(video_file.read())
            video_file.seek(0)
            payload = {
                "source_info": {
                    "source": "FILE_UPLOAD",
                    "video_size": video_size,
                    "chunk_size": video_size,
                    "total_chunk_count": 1
                }
            }
        else:
            payload = {
                "source_info": {
                    "source": "PULL_FROM_URL",
                    "video_url": video_url
                }
            }

        logger.info(f"Initiating video upload with publish_type: {publish_type}, source_type: {source_type}, payload: {payload}")
        response = requests.post(api_url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

        if data.get("error", {}).get("code") != "ok":
            logger.error(f"Failed to initiate upload: {data.get('error')}")
            return jsonify({"error": "Failed to initiate upload", "details": data.get("error")}), 500

        publish_id = data.get("data", {}).get("publish_id")
        if not publish_id:
            logger.error("No publish_id returned")
            return jsonify({"error": "No publish_id returned"}), 500

        logger.info(f"Video upload initiated, publish_id: {publish_id}")

        if source_type == "FILE_UPLOAD":
            upload_url = data.get("data", {}).get("upload_url")
            if not upload_url:
                logger.error("No upload_url returned")
                return jsonify({"error": "No upload_url returned"}), 500

            try:
                upload_headers = {
                    "Content-Range": f"bytes 0-{video_size-1}/{video_size}",
                    "Content-Type": "video/mp4"
                }
                logger.info(f"Uploading video to {upload_url}")
                upload_response = requests.put(upload_url, headers=upload_headers, data=video_file)
                upload_response.raise_for_status()
                logger.info("Video file uploaded successfully")
            except requests.RequestException as e:
                logger.error(f"Failed to upload video file: {str(e)}")
                return jsonify({"error": "Failed to upload video file", "details": str(e)}), 500

        # Status check loop
        status_payload = {"publish_id": publish_id}
        max_attempts = 20
        attempt = 0
        status = None
        valid_terminal_states = ["SEND_TO_USER_INBOX", "PUBLISH_COMPLETE"]
        error_states = ["FAILED", "REJECTED"]

        while attempt < max_attempts:
            try:
                status_response = requests.post(STATUS_API_URL, headers=headers, json=status_payload)
                status_response.raise_for_status()
                status_data = status_response.json()
                status = status_data.get("data", {}).get("status")
                logger.info(f"Status check {attempt + 1}: {status}, Full response: {status_data}")

                if status in valid_terminal_states:
                    logger.info(f"Reached terminal state: {status}")
                    break
                elif status in error_states:
                    logger.error(f"Upload failed with status: {status}")
                    return jsonify({"error": "Upload failed", "details": status_data.get("data")}), 500
                elif status in ["PROCESSING_UPLOAD", "PROCESSING_DOWNLOAD"]:
                    logger.info(f"Still processing: {status}")
                else:
                    logger.warning(f"Unknown status: {status}")

                time.sleep(10)
                attempt += 1
            except requests.RequestException as e:
                logger.error(f"Error checking status: {str(e)}")
                return jsonify({"error": "Error checking status", "details": str(e)}), 500

        if status not in valid_terminal_states:
            logger.error(f"Upload did not reach a terminal state, final status: {status}")
            return jsonify({"error": "Upload did not complete", "details": status}), 500

        notification_message = (
            "Video uploaded successfully as a draft. "
            "Please check your TikTok app's inbox notifications to review and post the video."
        ) if status == "SEND_TO_USER_INBOX" else (
            "Video posted successfully to your TikTok profile."
        )
        logger.info(notification_message)

        return jsonify({
            "success": True,
            "publish_id": publish_id,
            "message": notification_message,
            "status": status
        }), 200

    except requests.RequestException as e:
        logger.error(f"API error: {str(e)}, Response: {response.text if 'response' in locals() else 'No response'}")
        return jsonify({"error": "API error", "details": str(e), "response": response.text if 'response' in locals() else None}), 500
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "Unexpected error", "details": str(e)}), 500