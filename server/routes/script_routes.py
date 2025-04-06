from flask import Blueprint, request, jsonify
from controllers.script_controller import ScriptController
from controllers.audio_controller import AudioController
import asyncio

script_bp = Blueprint('script', __name__)
audio_bp = Blueprint('audio', __name__)

@script_bp.route("/scripts/generate", methods=["POST"])
def generate_script():
    try:
        data = request.get_json()
        required_fields = ["workspace_id", "title"]
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            ScriptController.generate_script(
                data["workspace_id"],
                data["title"],
                data.get("style", 1),
                data.get("length", 300)
            )
        )
        loop.close()

        return jsonify(result[0]), result[1]
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# filepath: c:\Users\ADMIN\OneDrive\Tài liệu\GitHub\MateTalk\Vivid\server\routes\audio_routes.py
@audio_bp.route("/generate-audio", methods=["POST"])
def generate_audio():
    try:
        data = request.get_json()
        if "script_id" not in data:
            return jsonify({"error": "Missing script_id"}), 400

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            AudioController.generate_audio(
                data["script_id"],
                data.get("voice_style", 1)
            )
        )
        loop.close()

        return jsonify(result[0]), result[1]
    except Exception as e:
        return jsonify({"error": str(e)}), 500