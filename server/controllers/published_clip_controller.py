from bson import ObjectId
from models.models import Clip, PublishedClip, Workspace
import json

class PublishedClipController:
    @staticmethod
    def create_published_clip(clip_id, platform, external_id, url, metadata=None):
        try:
            published_clip = PublishedClip(
                clip_id=clip_id,
                platform=platform,
                external_id=external_id,
                url=url,
                metadata=json.dumps(metadata) if metadata else None
            )
            published_clip.save()
            return {"published_clip_id": str(published_clip.id)}, 201
        except Exception as e:
            return {"error": str(e)}, 500

    @staticmethod
    def get_published_clip(published_clip_id):
        try:
            published_clip = PublishedClip.objects(id=published_clip_id).first()
            if not published_clip:
                return {"error": "Published clip not found"}, 404
            return {
                "id": str(published_clip.id),
                "clip_id": str(published_clip.clip_id.id),
                "platform": published_clip.platform,
                "external_id": published_clip.external_id,
                "url": published_clip.url,
                "metadata": json.loads(published_clip.metadata) if published_clip.metadata else None,
                "published_at": published_clip.published_at.isoformat()
            }, 200
        except Exception as e:
            return {"error": str(e)}, 500

    @staticmethod
    def update_published_clip(published_clip_id, data):
        try:
            published_clip = PublishedClip.objects(id=published_clip_id).first()
            if not published_clip:
                return {"error": "Published clip not found"}, 404
            
            allowed_fields = ["external_id", "url", "metadata"]
            if "metadata" in data:
                data["metadata"] = json.dumps(data["metadata"])
            update_data = {k: v for k, v in data.items() if k in allowed_fields}
            
            published_clip.update(**update_data)
            published_clip.reload()
            
            return {
                "id": str(published_clip.id),
                "platform": published_clip.platform,
                "external_id": published_clip.external_id,
                "url": published_clip.url
            }, 200
        except Exception as e:
            return {"error": str(e)}, 500

    @staticmethod
    def delete_published_clip(published_clip_id):
        try:
            published_clip = PublishedClip.objects(id=published_clip_id).first()
            if not published_clip:
                return {"error": "Published clip not found"}, 404
            
            published_clip.delete()
            return {"message": "Published clip deleted successfully"}, 200
        except Exception as e:
            return {"error": str(e)}, 500

    @staticmethod
    def list_published_clips(clip_id=None, platform=None):
        try:
            query = {}
            if clip_id:
                query["clip_id"] = clip_id
            if platform:
                query["platform"] = platform
            
            published_clips = PublishedClip.objects(**query)
            return [{
                "id": str(clip.id),
                "clip_id": str(clip.clip_id.id),
                "platform": clip.platform,
                "external_id": clip.external_id,
                "url": clip.url,
                "metadata": json.loads(clip.metadata) if clip.metadata else None,
                "published_at": clip.published_at.isoformat()
            } for clip in published_clips], 200
        except Exception as e:
            return {"error": str(e)}, 500
    
    @staticmethod
    def get_user_published_clips(user_id, platform_type=None):
        try:
            # Lấy tất cả workspace của user
            user_workspaces = Workspace.objects(user_id=user_id)
            workspace_ids = [workspace.id for workspace in user_workspaces]
            
            # Lấy tất cả clips thuộc các workspace của user
            user_clips = Clip.objects(workspace_id__in=workspace_ids)
            clip_ids = [clip.id for clip in user_clips]
            
            # Tạo query cho published clips
            published_clips_query = {"clip_id__in": clip_ids}
            if platform_type:
                published_clips_query["platform"] = platform_type
            
            # Lấy các published clips của user
            published_clips = PublishedClip.objects(**published_clips_query)
 
            # Tạo dictionary để tra cứu nhanh
            clips_dict = {str(clip.id): clip for clip in user_clips}
            workspaces_dict = {str(workspace.id): workspace for workspace in user_workspaces}
            
            # Format kết quả
            result = []
            for pub_clip in published_clips:
                clip = clips_dict.get(str(pub_clip.clip_id.id))
                workspace = None
                if clip:
                    workspace = workspaces_dict.get(str(clip.workspace_id.id))
                
                clip_data = {
                    "_id": str(pub_clip.id),
                    "clip_id": str(pub_clip.clip_id.id),
                    "platform": pub_clip.platform,
                    "external_id": pub_clip.external_id,
                    "url": pub_clip.url,
                    "published_at": pub_clip.published_at.isoformat()
                }
                
                # Thêm metadata nếu có
                if pub_clip.metadata:
                    try:
                        clip_data["metadata"] = json.loads(pub_clip.metadata)
                    except:
                        clip_data["metadata"] = pub_clip.metadata
                else:
                    clip_data["metadata"] = None
                
                # Thêm thông tin từ clip và workspace
                if clip:
                    clip_data["clip_prompt"] = clip.prompt
                if workspace:
                    clip_data["workspace_name"] = workspace.name
                
                result.append(clip_data)
            
            return result, 200
        except Exception as e:
            return {"error": str(e)}, 500
