import secrets
from flask import Flask
from flask_cors import CORS
from config.database import init_db
from routes.clip_routes import clip_bp
from routes.user_routes import user_bp
from routes.workspace_routes import workspace_bp
from routes.published_clip_routes import published_clip_bp
from routes.audio_routes import audio_bp
from routes.script_routes import script_bp
from routes.tiktok_routes import tiktok_bp 
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

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

if __name__ == "__main__":
    app.run(debug=True, port=5000, use_reloader=False)