from flask import Blueprint, request, jsonify
from controllers.resource_controller import ResourceController
from flask_cors import cross_origin

resource_bp = Blueprint('resource', __name__)

@resource_bp.route("/resources", methods=["POST", "OPTIONS"])
@cross_origin(origins=["http://localhost:5173"], methods=["POST", "OPTIONS"], allow_headers=["Content-Type"])
def create_resource():
    """Tạo mới một resource"""
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    data = request.get_json()
    required_fields = ["workspace_id", "resource_url", "resource_type"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    response, status_code = ResourceController.create_resource(
        data["workspace_id"],
        data["resource_url"],
        data["resource_type"],
        data.get("status", "processing")
    )
    return jsonify(response), status_code

@resource_bp.route("/resources/<resource_id>", methods=["GET"])
def get_resource(resource_id):
    """Lấy thông tin của một resource"""
    response, status_code = ResourceController.get_resource(resource_id)
    return jsonify(response), status_code

@resource_bp.route("/resources/<resource_id>", methods=["PUT", "OPTIONS"])
@cross_origin(origins=["http://localhost:5173"], methods=["PUT", "OPTIONS"], allow_headers=["Content-Type"])
def update_resource(resource_id):
    """Cập nhật thông tin của một resource"""
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    data = request.get_json()
    response, status_code = ResourceController.update_resource(resource_id, data)
    return jsonify(response), status_code

@resource_bp.route("/resources/<resource_id>", methods=["DELETE", "OPTIONS"])
@cross_origin(origins=["http://localhost:5173"], methods=["DELETE", "OPTIONS"], allow_headers=["Content-Type"])
def delete_resource(resource_id):
    """Xóa một resource"""
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    response, status_code = ResourceController.delete_resource(resource_id)
    return jsonify(response), status_code

@resource_bp.route("/resources", methods=["GET"])
def list_resources():
    """Lấy danh sách resources, có thể lọc theo workspace và resource_type"""
    workspace_id = request.args.get("workspace_id")
    resource_type = request.args.get("resource_type")
    
    response, status_code = ResourceController.list_resources(
        workspace_id, 
        resource_type
    )
    
    return jsonify(response), status_code

# Thêm route mới vào cuối file

@resource_bp.route("/workspaces/<workspace_id>/resources", methods=["GET"])
def get_resources_by_workspace(workspace_id):
    """Lấy tất cả resources của một workspace cụ thể"""
    try:
        # Có thể lọc thêm theo resource_type nếu cần
        resource_type = request.args.get("resource_type")
        
        response, status_code = ResourceController.list_resources(
            workspace_id,
            resource_type
        )
        
        return jsonify(response), status_code
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500