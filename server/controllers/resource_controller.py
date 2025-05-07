from models.models import Resource, Workspace
from bson.objectid import ObjectId

class ResourceController:
    @staticmethod
    def create_resource(workspace_id, resource_url, resource_type, status="processing"):
        """Tạo mới một resource"""
        try:
            # Kiểm tra workspace tồn tại
            workspace = Workspace.objects(id=workspace_id).first()
            if not workspace:
                return {"error": f"Workspace with ID {workspace_id} not found"}, 404
            
            # Tạo resource mới
            resource = Resource(
                workspace_id=workspace,
                resource_url=resource_url,
                resource_type=resource_type,
                status=status
            )
            resource.save()
            
            return {
                "resource_id": str(resource.id),
                "workspace_id": str(resource.workspace_id.id),
                "resource_url": resource.resource_url,
                "resource_type": resource.resource_type,
                "status": resource.status,
                "created_at": resource.created_at.isoformat()
            }, 201
            
        except Exception as e:
            return {"error": str(e)}, 500
    
    @staticmethod
    def get_resource(resource_id):
        """Lấy thông tin của một resource"""
        try:
            resource = Resource.objects(id=resource_id).first()
            if not resource:
                return {"error": f"Resource with ID {resource_id} not found"}, 404
            
            return {
                "resource_id": str(resource.id),
                "workspace_id": str(resource.workspace_id.id),
                "resource_url": resource.resource_url,
                "resource_type": resource.resource_type,
                "status": resource.status,
                "created_at": resource.created_at.isoformat()
            }, 200
            
        except Exception as e:
            return {"error": str(e)}, 500
    
    @staticmethod
    def update_resource(resource_id, data):
        """Cập nhật thông tin của một resource"""
        try:
            resource = Resource.objects(id=resource_id).first()
            if not resource:
                return {"error": f"Resource with ID {resource_id} not found"}, 404
            
            # Cập nhật các trường có thể sửa đổi
            if "resource_url" in data:
                resource.resource_url = data["resource_url"]
            
            if "resource_type" in data and data["resource_type"] in ["image", "video", "audio"]:
                resource.resource_type = data["resource_type"]
            
            if "status" in data and data["status"] in ["draft", "processing", "completed"]:
                resource.status = data["status"]
            
            # Lưu thay đổi
            resource.save()
            
            return {
                "resource_id": str(resource.id),
                "workspace_id": str(resource.workspace_id.id),
                "resource_url": resource.resource_url,
                "resource_type": resource.resource_type,
                "status": resource.status,
                "created_at": resource.created_at.isoformat()
            }, 200
            
        except Exception as e:
            return {"error": str(e)}, 500
    
    @staticmethod
    def delete_resource(resource_id):
        """Xóa một resource"""
        try:
            resource = Resource.objects(id=resource_id).first()
            if not resource:
                return {"error": f"Resource with ID {resource_id} not found"}, 404
            
            resource.delete()
            
            return {"message": f"Resource with ID {resource_id} has been deleted"}, 200
            
        except Exception as e:
            return {"error": str(e)}, 500
    
    @staticmethod
    def list_resources(workspace_id=None, resource_type=None):
        """Lấy danh sách resources, có thể lọc theo workspace và resource_type"""
        try:
            # Xây dựng query dựa trên các tham số lọc
            query = {}
            
            if workspace_id:
                workspace = Workspace.objects(id=workspace_id).first()
                if not workspace:
                    return {"error": f"Workspace with ID {workspace_id} not found"}, 404
                query["workspace_id"] = workspace
            
            if resource_type and resource_type in ["image", "video", "audio"]:
                query["resource_type"] = resource_type
            
            # Thực hiện truy vấn
            resources = Resource.objects(**query)
            
            result = []
            for resource in resources:
                result.append({
                    "resource_id": str(resource.id),
                    "workspace_id": str(resource.workspace_id.id),
                    "resource_url": resource.resource_url,
                    "resource_type": resource.resource_type,
                    "status": resource.status,
                    "created_at": resource.created_at.isoformat()
                })
            
            return result, 200
            
        except Exception as e:
            return {"error": str(e)}, 500