from flask import Blueprint, request, jsonify
from flask_cors import cross_origin  # Thêm import cross_origin
from controllers.script_controller import ScriptController
import asyncio
import os
from werkzeug.utils import secure_filename
import PyPDF2
from docx import Document
import tempfile


script_bp = Blueprint('script', __name__)


@script_bp.route("/scripts/generate", methods=["POST", "OPTIONS"])
@cross_origin(origins=["http://localhost:5173"], methods=["POST", "OPTIONS"], allow_headers=["Content-Type"])
def generate_script():
    if request.method == "OPTIONS":
        # Trả về phản hồi cho yêu cầu preflight
        return jsonify({}), 200

    try:
        data = request.get_json()
        required_fields = ["workspace_id", "title", "style", "length", "language"]
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        # Chuyển đổi style từ chuỗi sang số
        if data["style"] == "children":
            style_value = 1
        elif data["style"] == "general":
            style_value = 2
        elif data["style"] == "advanced":
            style_value = 3
        else:
            style_value = data["style"]  # Giữ nguyên nếu là số

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Kiểm tra xem đã có script nào với workspace_id này chưa
        from models.models import Script, Workspace
        
        workspace = Workspace.objects(id=data["workspace_id"]).first()
        if not workspace:
            return jsonify({"error": f"Không tìm thấy workspace với ID {data['workspace_id']}"}), 404
            
        existing_script = Script.objects(workspace_id=workspace).first()
        update_existing = False
        
        if existing_script:
            update_existing = True
            script_id = str(existing_script.id)
        
        result = loop.run_until_complete(
            ScriptController.generate_script(
                data["workspace_id"],
                data["title"],
                style_value,
                data["length"],
                data["language"],
                update_existing=update_existing
            )
        )
        loop.close()

        return jsonify({
            "id": result[0].get("script_id"),
            "script": result[0].get("script"),
            "title": result[0].get("title"),
            "updated": update_existing
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@script_bp.route("/generate-script-from-file", methods=["POST", "OPTIONS"])
@cross_origin(origins=["http://localhost:5173"], methods=["POST", "OPTIONS"], allow_headers=["Content-Type"])
def generate_script_from_file():
    """Generate script from uploaded file (PDF/DOC)"""
    if request.method == "OPTIONS":
        # Trả về phản hồi cho yêu cầu preflight
        return jsonify({}), 200

    try:
        # Check if workspace_id is provided
        if 'workspace_id' not in request.form:
            return jsonify({"error": "Missing workspace_id"}), 400
            
        workspace_id = request.form['workspace_id']
        language = request.form.get('language', 'en')
        style = request.form.get('style', 'general')  # Default to 'general'

        # Map style to integer
        style_mapping = {
            "children": 1,
            "general": 2,
            "advanced": 3
        }
        style_value = style_mapping.get(style.lower(), 2)  # Default to 2 (general) if invalid

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
        
        # Kiểm tra xem đã có script nào với workspace_id này chưa
        from models.models import Script, Workspace
        
        workspace = Workspace.objects(id=workspace_id).first()
        if not workspace:
            return jsonify({"error": f"Không tìm thấy workspace với ID {workspace_id}"}), 404
            
        existing_script = Script.objects(workspace_id=workspace).first()
        update_existing = False
        
        if existing_script:
            update_existing = True
        
        # Create a script from the extracted text
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # First create script
        script_result = loop.run_until_complete(
            ScriptController.create_script_from_text(
                workspace_id=workspace_id,
                title=os.path.splitext(filename)[0],
                content=text_content,
                language=language,
                style=style_value,
                update_existing=update_existing
            )
        )
        loop.close()

        # Check if script creation was successful
        if script_result[1] not in [200, 201]:
            return jsonify(script_result[0]), script_result[1]
            
        return jsonify({
            "id": script_result[0].get("script_id"),
            "script": text_content,
            "title": os.path.splitext(filename)[0],
            "style": style,
            "language": language,
            "updated": update_existing
        }), script_result[1]

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


@script_bp.route("/scripts/<script_id>/complete", methods=["POST", "OPTIONS"])
@cross_origin(origins=["http://localhost:5173"], methods=["POST", "OPTIONS"], allow_headers=["Content-Type"])
def complete_script(script_id):
    """Change the status of a script to completed"""
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        data = request.get_json()
        if not data or "new_script" not in data:
            return jsonify({"error": "Thiếu new_script trong body yêu cầu"}), 400

        new_script = data["new_script"]
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        result, status = loop.run_until_complete(
            ScriptController.change_script_status_completed(script_id, new_script)
        )
        loop.close()

        return jsonify(result), status

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@script_bp.route("/scripts", methods=["GET"])
def get_scripts_by_workspace():
    workspace_id = request.args.get("workspace_id")

    try:
        scripts = ScriptController.get_scripts_by_workspace(workspace_id)
        return jsonify(scripts), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
@script_bp.route("/caption/<script_id>", methods=["GET", "OPTIONS"])
@cross_origin(origins=["http://localhost:5173"], methods=["GET", "OPTIONS"], allow_headers=["Content-Type"])
def create_caption_from_script(script_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        # Lấy title và description
        title_result, title_status = ScriptController.create_title_from_script(script_id)
        description_result, desc_status = ScriptController.create_description_from_script(script_id)
        
        # Kiểm tra kết quả trả về
        if title_status != 200:
            return jsonify({"error": "Lỗi khi tạo tiêu đề", "details": title_result}), title_status
            
        if desc_status != 200:
            return jsonify({"error": "Lỗi khi tạo mô tả", "details": description_result}), desc_status
        
        # Nếu thành công, trả về cả title và description trong một JSON response
        return jsonify({
            "title": title_result.get("title"),
            "description": description_result.get("description")
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Lỗi khi tạo caption: {str(e)}"}), 500
    
@script_bp.route("/caption-from-clip/<clip_id>", methods=["GET", "OPTIONS"])
@cross_origin(origins=["http://localhost:5173"], methods=["GET", "OPTIONS"], allow_headers=["Content-Type"])
def create_caption_from_clip(clip_id):
    """Tạo caption (title và description) cho video dựa trên clip_id"""
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        # Sử dụng phương thức mới trong controller
        result, status = ScriptController.create_caption_from_clip(clip_id)
        return jsonify(result), status
        
    except Exception as e:
        return jsonify({"error": f"Lỗi khi tạo caption: {str(e)}"}), 500