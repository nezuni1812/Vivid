from models.models import Workspace
from flask import jsonify

class WorkspaceController:
    @staticmethod
    def create_workspace(name, description, owner_id):
        try:
            workspace = Workspace(
                name=name,
                description=description,
                owner_id=owner_id
            )
            workspace.save()
            return {"workspace_id": str(workspace.id)}, 201
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
                "owner_id": str(workspace.owner_id)
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
    def list_workspaces(owner_id=None):
        try:
            query = {}
            if owner_id:
                query["owner_id"] = owner_id
                
            workspaces = Workspace.objects(**query)
            return [{
                "id": str(w.id),
                "name": w.name,
                "description": w.description,
                "owner_id": str(w.owner_id)
            } for w in workspaces], 200
        except Exception as e:
            return {"error": str(e)}, 500