from models.models import User

class UserController:
    @staticmethod
    def create_user(firebase_uid, username, email, role="user"):
        try:
            user = User(
                firebase_uid=firebase_uid,
                username=username,
                email=email,
                role=role
            )
            user.save()
            return {
                    "user_id": str(user.id),
                    "firebase_uid": firebase_uid,
                    "username": username,
                    "email": email,
                    "role": role,
                }, 201
        except Exception as e:
            # user có thê đã tồn tại trong db, nếu có thì trả về thông tin user đó
            existing_user = User.objects(firebase_uid=firebase_uid).first()
            if existing_user:
                return {
                    "user_id": str(existing_user.id),
                    "firebase_uid": existing_user.firebase_uid,
                    "username": existing_user.username,
                    "email": existing_user.email,
                    "role": existing_user.role,
                }, 201
            else: 
                return {"error": str(e)}, 500

    @staticmethod
    def get_user(user_id):
        try:
            user = User.objects(id=user_id).first()
            if not user:
                return {"error": "User not found"}, 404
            return {
                "id": str(user.id),
                "firebase_uid": user.firebase_uid,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat()
            }, 200
        except Exception as e:
            return {"error": str(e)}, 500

    @staticmethod
    def update_user(user_id, data):
        try:
            user = User.objects(id=user_id).first()
            if not user:
                return {"error": "User not found"}, 404
            
            allowed_fields = ["username", "email", "role"]
            update_data = {k: v for k, v in data.items() if k in allowed_fields}
            
            user.update(**update_data)
            user.reload()
            
            return {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "role": user.role
            }, 200
        except Exception as e:
            return {"error": str(e)}, 500

    @staticmethod
    def delete_user(user_id):
        try:
            user = User.objects(id=user_id).first()
            if not user:
                return {"error": "User not found"}, 404
            
            user.delete()
            return {"message": "User deleted successfully"}, 200
        except Exception as e:
            return {"error": str(e)}, 500

    @staticmethod
    def list_users():
        try:
            users = User.objects()
            return [{
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat()
            } for user in users], 200
        except Exception as e:
            return {"error": str(e)}, 500