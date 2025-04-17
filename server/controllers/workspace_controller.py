from models.models import Script, Workspace
from flask import jsonify
from bson import ObjectId

class WorkspaceController:
    @staticmethod
    def create_workspace(name, description, owner_id):
        try:
            workspace = Workspace(
                name=name,
                description=description,
                user_id=owner_id
            )
            workspace.save()
            return {
                "id": str(workspace.id),
                "name": workspace.name,
                "description": workspace.description,
                "user_id": str(workspace.user_id.id),
                "created_at": workspace.created_at.isoformat(),
                "updated_at": workspace.updated_at.isoformat()
            }, 201
        except Exception as e:
            return {"error": str(e)}, 500

    @staticmethod
    def get_workspace_data(workspace_id, kind):
        # kind: what kind of requested data: script, audio, clip, timing,  
        # if kind == "script":
        #     try:
                
                
        try:
            script = Script.objects(workspace_id=workspace_id).first() 
            if not script:
                return {"error": "Script not found"}, 404
            
            return {
                "id": str(script.id),
                "prompt": script.prompt,
                "clip_url": script.clip_url,
                "status": script.status,
                "created_at": script.created_at.isoformat() if script.created_at else None,
                "updated_at": script.updated_at.isoformat() if script.updated_at else None
            }, 200
        except Exception as e:
            return {"error": str(e)}, 500

    @staticmethod
    def get_workspace(workspace_id):
        try:
            workspace = Workspace.objects(id=workspace_id).first()
            if not workspace:
                return {"error": "Workspace not found"}, 404
            return {
                "id": str(workspace.id),
                "name": workspace.name,
                "description": workspace.description,
                "owner_id": str(workspace.user_id.id)
            }, 200
        except Exception as e:
            return {"error": str(e)}, 500

    @staticmethod
    def update_workspace(workspace_id, data):
        try:
            workspace = Workspace.objects(id=workspace_id).first()
            if not workspace:
                return {"error": "Workspace not found"}, 404
            
            workspace.update(**data)
            workspace.reload()
            
            return {
                "id": str(workspace.id),
                "name": workspace.name,
                "description": workspace.description
            }, 200
        except Exception as e:
            return {"error": str(e)}, 500

    @staticmethod
    def delete_workspace(workspace_id):
        try:
            workspace = Workspace.objects(id=workspace_id).first()
            if not workspace:
                return {"error": "Workspace not found"}, 404
            
            workspace.delete()
            return {"message": "Workspace deleted successfully"}, 200
        except Exception as e:
            return {"error": str(e)}, 500

    @staticmethod
    def list_workspaces(user_id=None):
        try:
            query = {}
            if user_id:
                # Chuyển đổi chuỗi user_id thành ObjectId
                query["user_id"] = ObjectId(user_id)
                    
            workspaces = Workspace.objects(**query)
            return [{
                "id": str(w.id),
                "name": w.name,
                "description": w.description,
                "user_id": str(w.user_id.id) if w.user_id else None,
                "created_at": w.created_at.isoformat() if w.created_at else None,
                "updated_at": w.updated_at.isoformat() if w.updated_at else None
            } for w in workspaces], 200
        except Exception as e:
            return {"error": str(e)}, 500