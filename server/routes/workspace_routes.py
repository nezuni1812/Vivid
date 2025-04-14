from flask import Blueprint, request, jsonify
from controllers.workspace_controller import WorkspaceController

workspace_bp = Blueprint('workspace', __name__)

@workspace_bp.route("/workspaces", methods=["POST"])
def create_workspace():
    data = request.get_json()
    name = data.get("name")
    description = data.get("description")
    owner_id = data.get("user_id")

    if not all([name, owner_id]):
        return jsonify({"error": "Missing required fields"}), 400

    response, status_code = WorkspaceController.create_workspace(name, description, owner_id)
    return jsonify(response), status_code

@workspace_bp.route("/workspaces/<workspace_id>", methods=["GET"])
def get_workspace(workspace_id):
    response, status_code = WorkspaceController.get_workspace(workspace_id)
    return jsonify(response), status_code

@workspace_bp.route("/workspaces/<workspace_id>", methods=["PUT"])
def update_workspace(workspace_id):
    data = request.get_json()
    response, status_code = WorkspaceController.update_workspace(workspace_id, data)
    return jsonify(response), status_code

@workspace_bp.route("/workspaces/<workspace_id>", methods=["DELETE"])
def delete_workspace(workspace_id):
    response, status_code = WorkspaceController.delete_workspace(workspace_id)
    return jsonify(response), status_code

@workspace_bp.route("/workspaces", methods=["GET"])
def list_workspaces():
    owner_id = request.args.get("user_id")
    response, status_code = WorkspaceController.list_workspaces(owner_id)
    return jsonify(response), status_code