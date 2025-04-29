from models.models import Audio, Resource, Script, Workspace
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
        if kind == "script":
            try:
                script = Script.objects(workspace_id=workspace_id).first() 
                if not script:
                    return {"error": "Script not found"}, 404
                
                return {
                    "id": str(script.id),
                    "prompt": getattr(script, "prompt", None), 
                    "clip_url": getattr(script, "clip_url", None),
                    "status": getattr(script, "status", None),
                    "title": getattr(script, "title", None),
                    "source_content": getattr(script, "source_content", None),
                    "generated_script": getattr(script, "generated_script", None),
                    "language": getattr(script, "language", None),
                    "style": getattr(script, "style", None),
                    "created_at": script.created_at.isoformat() if script.created_at else None,
                    "updated_at": script.updated_at.isoformat() if script.updated_at else None
                }, 200
            except Exception as e:
                return {"error": str(e)}, 500
        elif kind == "audio":
            try:
                audio = Audio.objects(workspace_id=workspace_id).first()
                if not audio:
                    return {"error": "Audio not found"}, 404
                
                return {
                    "id": str(audio.id),
                    "script_id": str(audio.script_id.id) if audio.script_id else None,
                    "audio_url": audio.audio_url,
                    "timings": audio.timings,
                    "voice_style": audio.voice_style,
                    "status": audio.status,
                    "created_at": audio.created_at.isoformat() if audio.created_at else None,
                }, 200
            except Exception as e:
                return {"error": str(e)}, 500
        
        elif kind == "resource":
            try:
                resources = Resource.objects(workspace_id=workspace_id)
                if not resources:
                    return {"error": "Resource not found"}, 404
                
                return [{
                    "id": str(resource.id),
                    "status": resource.status,
                    "resource_url": resource.resource_url,
                    "resource_type": resource.resource_type,
                    "created_at": resource.created_at.isoformat() if resource.created_at else None,
                }
                for resource in resources
                ], 200
            except Exception as e:
                return {"error": str(e)}, 500
                
        return {"error": f"Does not match any kind: {kind}"}, 500

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