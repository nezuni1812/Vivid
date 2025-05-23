import secrets
import asyncio
import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from config.database import init_db
from routes.clip_routes import clip_bp
from routes.user_routes import user_bp
from routes.workspace_routes import workspace_bp
from routes.published_clip_routes import published_clip_bp
from routes.audio_routes import audio_bp
from routes.script_routes import script_bp
from routes.creation_routes import creation_bp
from routes.tiktok_routes import tiktok_bp 
from routes.resource_routes import resource_bp

from dotenv import load_dotenv
import os

load_dotenv()

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

init_db()

app.register_blueprint(clip_bp)
app.register_blueprint(user_bp)
app.register_blueprint(workspace_bp)
app.register_blueprint(published_clip_bp)
app.register_blueprint(audio_bp)
app.register_blueprint(script_bp)
app.register_blueprint(tiktok_bp)  # Register TikTok Blueprint
app.register_blueprint(creation_bp)
app.register_blueprint(resource_bp)

# from services.storage.storage_service import remove_from_r2
# async def foo():
#     print("Hello from foo()")
#     await remove_from_r2(r"audios/67ef5c1032c9368838561563/Keyline%20logo%20(3).png")

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

if __name__ == "__main__":
    app.run(debug=True, port=5000, use_reloader=False)