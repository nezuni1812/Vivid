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

app = Flask(__name__)
# cors = CORS(app, resources={
#     r"/*": {
#         "origins": "http://localhost:5173"
#     }
# })
CORS(app)

# Khởi tạo database
init_db()

# Đăng ký các blueprint
app.register_blueprint(clip_bp)
app.register_blueprint(user_bp)
app.register_blueprint(workspace_bp)
app.register_blueprint(published_clip_bp)
app.register_blueprint(audio_bp)
app.register_blueprint(script_bp)
app.register_blueprint(creation_bp)


# from services.storage.storage_service import remove_from_r2
# async def foo():
#     print("Hello from foo()")
#     await remove_from_r2(r"audios/67ef5c1032c9368838561563/Keyline%20logo%20(3).png")

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

if __name__ == "__main__":
    # Chạy hàm foo() trong Flask
    # loop = asyncio.new_event_loop()
    # asyncio.set_event_loop(loop)
    # loop.run_until_complete(foo())
    # loop.close()
    app.run(debug=True)