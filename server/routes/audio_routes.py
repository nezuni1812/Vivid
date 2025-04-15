from flask import Blueprint, request, jsonify
from controllers.audio_controller import AudioController
from controllers.script_controller import ScriptController
import asyncio
from models.models import Audio, Script
import os
from werkzeug.utils import secure_filename
import PyPDF2
from docx import Document
import tempfile

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
    

@audio_bp.route("/generate-audio-from-file", methods=["POST"])
def generate_audio_from_file():
    """Generate audio from uploaded file (PDF/DOC)"""
    try:
        # Check if workspace_id is provided
        if 'workspace_id' not in request.form:
            return jsonify({"error": "Missing workspace_id"}), 400
            
        workspace_id = request.form['workspace_id']
        voice_style = int(request.form.get('voice_style', 1))
        
        # Check if file is provided
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
            
        # Check file extension
        allowed_extensions = {'pdf', 'doc', 'docx'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_ext not in allowed_extensions:
            return jsonify({"error": f"File type not supported. Please upload {', '.join(allowed_extensions)}"}), 400
        
        # Save file temporarily
        temp_dir = tempfile.gettempdir()
        filename = secure_filename(file.filename)
        filepath = os.path.join(temp_dir, filename)
        file.save(filepath)
        
        # Extract text from file
        text_content = ""
        if file_ext == 'pdf':
            with open(filepath, 'rb') as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                for page_num in range(len(pdf_reader.pages)):
                    text_content += pdf_reader.pages[page_num].extract_text()
        elif file_ext in ['doc', 'docx']:
            doc = Document(filepath)
            for para in doc.paragraphs:
                text_content += para.text + "\n"
        
        # Delete temp file
        os.unlink(filepath)
        
        if not text_content.strip():
            return jsonify({"error": "Could not extract text from file"}), 400
        
        # Create a script from the extracted text
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # First create script
        script_result = loop.run_until_complete(
            ScriptController.create_script_from_text(
                workspace_id=workspace_id,
                title=os.path.splitext(filename)[0],
                content=text_content
            )
        )
        
        if script_result[1] != 201:
            loop.close()
            return jsonify(script_result[0]), script_result[1]
            
        script_id = script_result[0].get("id")
        
        # Then generate audio from the script
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