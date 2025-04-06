from flask import Blueprint, request, jsonify
import asyncio
import os
from models.models import Clip, Workspace
from services.storage.storage_service import upload_to_r2

clip_bp = Blueprint('clip', __name__)

@clip_bp.route("/clips", methods=["POST"])
def create_clip():
     # Lấy dữ liệu từ form
    workspace_id = request.form.get("workspace_id")
    prompt = request.form.get("prompt")
    video_file = request.files.get("video_file")

    if not all([workspace_id, prompt, video_file]):
        return jsonify({"error": "Missing required fields"}), 400

    # Kiểm tra workspace tồn tại
    workspace = Workspace.objects(id=workspace_id).first()
    if not workspace:
        return jsonify({"error": "Workspace not found"}), 404

    # Lưu file tạm thời
    file_path = f"temp_{video_file.filename}"
    video_file.save(file_path)

    # Upload file lên R2 async
    async def upload_and_save():
        try:
            file_name = f"clips/{video_file.filename}"
            clip_url = await upload_to_r2(file_path, file_name)

            # Tạo và lưu clip vào MongoDB
            new_clip = Clip(
                workspace_id=workspace,
                prompt=prompt,
                clip_url=clip_url,
                status="completed"
            )
            new_clip.save()

            # Xóa file tạm
            os.remove(file_path)

            return {
                "clip_id": str(new_clip.id),
                "prompt": new_clip.prompt,
                "clip_url": new_clip.clip_url,
                "status": new_clip.status
            }
        except Exception as e:
            return {"error": str(e)}

    # Chạy async trong Flask
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(upload_and_save())
    loop.close()

    if "error" in result:
        return jsonify(result), 500
    return jsonify(result), 201

@clip_bp.route("/clips/<clip_id>", methods=["GET"])
def get_clip(clip_id):
    clip = Clip.objects(id=clip_id).first()
    if not clip:
        return jsonify({"error": "Clip not found"}), 404
    return jsonify({
        "clip_id": str(clip.id),
        "workspace_id": str(clip.workspace_id.id),
        "prompt": clip.prompt,
        "clip_url": clip.clip_url,
        "status": clip.status,
        "created_at": clip.created_at.isoformat(),
        "updated_at": clip.updated_at.isoformat()
    }), 200

@clip_bp.route("/clips", methods=["GET"])
def list_clips():
    clips = Clip.objects()
    return jsonify([{
        "clip_id": str(clip.id),
        "workspace_id": str(clip.workspace_id.id),
        "prompt": clip.prompt,
        "clip_url": clip.clip_url,
        "status": clip.status,
        "created_at": clip.created_at.isoformat(),
        "updated_at": clip.updated_at.isoformat()
    } for clip in clips]), 200