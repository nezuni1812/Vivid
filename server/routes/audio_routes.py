from flask import Blueprint, request, jsonify
from controllers.audio_controller import AudioController
import asyncio
from models.models import Audio, Script

audio_bp = Blueprint('audio', __name__)

@audio_bp.route("/generate-audio", methods=["POST"])
def generate_audio():
    """Generate audio from existing script"""
    try:
        data = request.get_json()
        if "script_id" not in data:
            return jsonify({"error": "Missing script_id"}), 400

        # Check if script exists    
        script_id = data["script_id"]
        voice_style = data.get("voice_style", 1)

        # Run async in Flask
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            AudioController.generate_audio(
                script_id=script_id,
                voice_style=voice_style
            )
        )
        loop.close()

        return jsonify(result), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@audio_bp.route("/audios/<audio_id>", methods=["GET"])
def get_audio(audio_id):
    """Get audio details by ID"""
    try:
        audio = Audio.objects(id=audio_id).first()
        if not audio:
            return jsonify({"error": "Audio not found"}), 404

        return jsonify({
            "audio_id": str(audio.id),
            "workspace_id": str(audio.workspace_id.id),
            "script_id": str(audio.script_id.id),
            "audio_url": audio.audio_url,
            "timings": eval(audio.timings),
            "voice_style": audio.voice_style,
            "status": audio.status,
            "created_at": audio.created_at.isoformat()
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500