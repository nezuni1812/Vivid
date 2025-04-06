from flask import Blueprint, request, jsonify
from controllers.published_clip_controller import PublishedClipController

published_clip_bp = Blueprint('published_clip', __name__)

@published_clip_bp.route("/published-clips", methods=["POST"])
def create_published_clip():
    data = request.get_json()
    required_fields = ["clip_id", "platform", "external_id", "url"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    response, status_code = PublishedClipController.create_published_clip(
        data["clip_id"],
        data["platform"],
        data["external_id"],
        data["url"],
        data.get("metadata")
    )
    return jsonify(response), status_code

@published_clip_bp.route("/published-clips/<published_clip_id>", methods=["GET"])
def get_published_clip(published_clip_id):
    response, status_code = PublishedClipController.get_published_clip(published_clip_id)
    return jsonify(response), status_code

@published_clip_bp.route("/published-clips/<published_clip_id>", methods=["PUT"])
def update_published_clip(published_clip_id):
    data = request.get_json()
    response, status_code = PublishedClipController.update_published_clip(published_clip_id, data)
    return jsonify(response), status_code

@published_clip_bp.route("/published-clips/<published_clip_id>", methods=["DELETE"])
def delete_published_clip(published_clip_id):
    response, status_code = PublishedClipController.delete_published_clip(published_clip_id)
    return jsonify(response), status_code

@published_clip_bp.route("/published-clips", methods=["GET"])
def list_published_clips():
    clip_id = request.args.get("clip_id")
    platform = request.args.get("platform")
    response, status_code = PublishedClipController.list_published_clips(clip_id, platform)
    return jsonify(response), status_code