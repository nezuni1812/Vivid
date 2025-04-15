from flask import Blueprint, request, jsonify
from controllers.script_controller import ScriptController
import asyncio
import os
from werkzeug.utils import secure_filename
import PyPDF2
from docx import Document
import tempfile


script_bp = Blueprint('script', __name__)


@script_bp.route("/scripts/generate", methods=["POST"])
def generate_script():
    try:
        data = request.get_json()
        required_fields = ["workspace_id", "title", "style", "length"]
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            ScriptController.generate_script(
                data["workspace_id"],
                data["title"],
                data["style"],
                data["length"]
            )
        )
        loop.close()

        return jsonify({
            "id": result[0].get("id"),
            "script": result[0].get("script"),
            "title": result[0].get("title"),
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@script_bp.route("/generate-script-from-file", methods=["POST"])
def generate_script_from_file():
    """Generate script from uploaded file (PDF/DOC)"""
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
        ScriptController.save_new_script(
            workspace_id=workspace_id,
            title=os.path.splitext(filename)[0],
            content=text_content
        )
        # Check if script creation was successful
        if script_result[1] != 201:
            loop.close()
            return jsonify(script_result[0]), script_result[1]
            
        return jsonify({
        "id": script_result[0].get("id"),
        "script": text_content,
        "title": os.path.splitext(filename)[0]
    }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500