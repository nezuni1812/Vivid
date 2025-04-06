from flask import Flask
from flask_cors import CORS
from config.database import init_db
from routes.clip_routes import clip_bp
from routes.user_routes import user_bp
from routes.workspace_routes import workspace_bp
from routes.published_clip_routes import published_clip_bp
from routes.audio_routes import audio_bp
from routes.script_routes import script_bp

app = Flask(__name__)
cors = CORS(app, resources={
    r"/*": {
        "origins": "http://localhost:5173"
    }
})

# Khởi tạo database
init_db()

# Đăng ký các blueprint
app.register_blueprint(clip_bp)
app.register_blueprint(user_bp)
app.register_blueprint(workspace_bp)
app.register_blueprint(published_clip_bp)
app.register_blueprint(audio_bp)
app.register_blueprint(script_bp)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

if __name__ == "__main__":
    app.run(debug=True)