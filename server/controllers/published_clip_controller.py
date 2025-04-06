from models.models import PublishedClip
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