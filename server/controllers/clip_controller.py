from models.models import Clip, Workspace
from services.storage.storage_service import upload_to_r2
import os
from datetime import datetime

class ClipController:
    @staticmethod
    async def create_clip(workspace_id, prompt, video_file):
        """Create a new clip with uploaded video file"""
        try:
            # Validate workspace
            workspace = Workspace.objects(id=workspace_id).first()
            if not workspace:
                raise Exception("Workspace not found")

            # Save temp file
            temp_path = f"temp_{video_file.filename}"
            video_file.save(temp_path)

            try:
                # Upload to storage
                file_name = f"clips/{workspace_id}/{video_file.filename}"
                clip_url = await upload_to_r2(temp_path, file_name)

                # Create clip record
                new_clip = Clip(
                    workspace_id=workspace,
                    prompt=prompt,
                    clip_url=clip_url,
                    status="completed",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                new_clip.save()

                return {
                    "clip_id": str(new_clip.id),
                    "prompt": new_clip.prompt,
                    "clip_url": new_clip.clip_url,
                    "status": new_clip.status,
                    "created_at": new_clip.created_at.isoformat()
                }

            finally:
                # Clean up temp file
                if os.path.exists(temp_path):
                    os.remove(temp_path)

        except Exception as e:
            raise Exception(f"Error creating clip: {str(e)}")

    @staticmethod
    def get_clip(clip_id):
        """Get clip details by ID"""
        try:
            clip = Clip.objects(id=clip_id).first()
            if not clip:
                raise Exception("Clip not found")

            return {
                "clip_id": str(clip.id),
                "workspace_id": str(clip.workspace_id.id),
                "prompt": clip.prompt,
                "clip_url": clip.clip_url,
                "status": clip.status,
                "created_at": clip.created_at.isoformat(),
                "updated_at": clip.updated_at.isoformat()
            }
        except Exception as e:
            raise Exception(f"Error getting clip: {str(e)}")

    @staticmethod
    def list_clips(workspace_id=None):
        """List all clips, optionally filtered by workspace"""
        try:
            query = {}
            if workspace_id:
                workspace = Workspace.objects(id=workspace_id).first()
                if not workspace:
                    raise Exception("Workspace not found")
                query["workspace_id"] = workspace

            clips = Clip.objects(**query)
            return [{
                "clip_id": str(clip.id),
                "workspace_id": str(clip.workspace_id.id),
                "prompt": clip.prompt,
                "clip_url": clip.clip_url,
                "status": clip.status,
                "created_at": clip.created_at.isoformat(),
                "updated_at": clip.updated_at.isoformat()
            } for clip in clips]
        except Exception as e:
            raise Exception(f"Error listing clips: {str(e)}")

    @staticmethod
    def delete_clip(clip_id):
        """Delete a clip by ID"""
        try:
            clip = Clip.objects(id=clip_id).first()
            if not clip:
                raise Exception("Clip not found")

            # TODO: Delete file from storage
            clip.delete()
            return {"message": "Clip deleted successfully"}
        except Exception as e:
            raise Exception(f"Error deleting clip: {str(e)}")

    @staticmethod
    def update_clip(clip_id, data):
        """Update clip details"""
        try:
            clip = Clip.objects(id=clip_id).first()
            if not clip:
                raise Exception("Clip not found")

            allowed_fields = ["prompt", "status"]
            update_data = {k: v for k, v in data.items() if k in allowed_fields}
            update_data["updated_at"] = datetime.utcnow()

            clip.update(**update_data)
            clip.reload()

            return {
                "clip_id": str(clip.id),
                "workspace_id": str(clip.workspace_id.id),
                "prompt": clip.prompt,
                "clip_url": clip.clip_url,
                "status": clip.status,
                "created_at": clip.created_at.isoformat(),
                "updated_at": clip.updated_at.isoformat()
            }
        except Exception as e:
            raise Exception(f"Error updating clip: {str(e)}")