from flask import Blueprint, request, jsonify
from controllers.audio_controller import AudioController
import asyncio
from models.models import Audio
import os
from werkzeug.utils import secure_filename
from docx import Document
from flask_cors import cross_origin
import tempfile 

audio_bp = Blueprint('audio', __name__)

@audio_bp.route("/scripts/<script_id>/generate_audio", methods=["POST", "OPTIONS"])
@cross_origin(origins=["http://localhost:5173"], methods=["POST", "OPTIONS"], allow_headers=["Content-Type"])
def generate_audio(script_id):
    """Generate audio from a script with custom speed, pitch, and volume"""
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        data = request.get_json()
        required_fields = ["speed", "pitch", "volume"]

        if not all(field in data for field in required_fields):
            return jsonify({"error": "Thiếu các trường bắt buộc (speed, pitch, volume)"}), 400

        # Validate input types
        speed = float(data["speed"])
        pitch = float(data["pitch"])
        volume = float(data["volume"])

        # Thêm engine và gender, với giá trị mặc định
        engine = data.get("engine", "gtts")  # Mặc định là gtts nếu không cung cấp
        gender = data.get("gender", "female")  # Mặc định là female nếu không cung cấp
        
        # Kiểm tra giá trị engine hợp lệ
        if engine not in ["gtts", "edge_tts"]:
            return jsonify({"error": "Engine phải là 'gtts' hoặc 'edge_tts'"}), 400

        # Kiểm tra giá trị gender hợp lệ
        if gender not in ["male", "female"]:
            return jsonify({"error": "Gender phải là 'male' hoặc 'female'"}), 400
        
        # Optional: Validate ranges
        if not (0.5 <= speed <= 2.0):
            return jsonify({"error": "Tốc độ phải nằm trong khoảng 0.5 đến 2.0"}), 400
        if not (0.5 <= pitch <= 2.0):
            return jsonify({"error": "Âm điệu phải nằm trong khoảng 0.5 đến 2.0"}), 400
        if not (-12.0 <= volume <= 12.0):
            return jsonify({"error": "Âm lượng phải nằm trong khoảng -12.0 đến 12.0 dB"}), 400

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        result, status = loop.run_until_complete(
            AudioController.generate_audio(
                script_id=script_id,
                engine=engine,  
                gender=gender,  
                speed=speed,
                pitch=pitch,
                volume=volume
            )
        )
        loop.close()

        return jsonify(result), status

    except ValueError:
        return jsonify({"error": "Giá trị speed, pitch, hoặc volume không hợp lệ"}), 400
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
            # "voice_style": audio.voice_style,
            # "status": audio.status,
            # "created_at": audio.created_at.isoformat()
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@audio_bp.route("/generate-audio-from-file", methods=["POST", "OPTIONS"])
@cross_origin(origins=["http://localhost:5173"], methods=["POST", "OPTIONS"], allow_headers=["Content-Type"])
def generate_audio_from_file():
    """Generate script and audio from uploaded audio file"""
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        # Kiểm tra workspace_id
        if 'workspace_id' not in request.form:
            return jsonify({"error": "Missing workspace_id"}), 400
            
        workspace_id = request.form['workspace_id']
        language = request.form.get('language', 'vietnamese')  # Mặc định là tiếng Việt
        
        # Kiểm tra file
        if 'audio_file' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
            
        file = request.files['audio_file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
            
        # Kiểm tra định dạng file
        allowed_extensions = {'mp3', 'wav', 'ogg', 'm4a', 'flac'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_ext not in allowed_extensions:
            return jsonify({"error": f"File type not supported. Please upload {', '.join(allowed_extensions)}"}), 400
        
        # Lưu file tạm
        temp_dir = tempfile.gettempdir()
        filename = secure_filename(file.filename)
        filepath = os.path.join(temp_dir, filename)
        file.save(filepath)
        
        # Xử lý file âm thanh
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        result, status = loop.run_until_complete(
            AudioController.speech_to_text(
                workspace_id=workspace_id,
                audio_file=filepath,
                language_value=language
            )
        )
        
        loop.close()
        
        # Xóa file tạm
        os.unlink(filepath)
        
        return jsonify(result), status
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    