from flask import Blueprint, request, jsonify
from controllers.user_controller import UserController

user_bp = Blueprint('user', __name__)

@user_bp.route("/users", methods=["POST"])
def create_user():
    data = request.get_json()
    required_fields = ["firebase_uid", "username", "email"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    response, status_code = UserController.create_user(
        data["firebase_uid"],
        data["username"],
        data["email"],
        data.get("role", "user")
    )
    return jsonify(response), status_code

@user_bp.route("/users/<user_id>", methods=["GET"])
def get_user(user_id):
    response, status_code = UserController.get_user(user_id)
    return jsonify(response), status_code

@user_bp.route("/users/<user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.get_json()
    response, status_code = UserController.update_user(user_id, data)
    return jsonify(response), status_code

@user_bp.route("/users/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    response, status_code = UserController.delete_user(user_id)
    return jsonify(response), status_code

@user_bp.route("/users", methods=["GET"])
def list_users():
    response, status_code = UserController.list_users()
    return jsonify(response), status_code