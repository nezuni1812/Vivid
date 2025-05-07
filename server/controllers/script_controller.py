from services.language.input_handler_service import detect_language_and_input
from services.language.translator_service import translate_to_english
from services.content.wiki_service import get_wikipedia_summary
from services.content.script_service import create_script_with_gemini, create_title_with_gemini, create_description_with_gemini
from models.models import Script, Workspace, Clip

class ScriptController:
    @staticmethod
    async def generate_script(workspace_id, title, style, length, language):
        try:
            # Validate workspace
            workspace = Workspace.objects(id=workspace_id).first()
            if not workspace:
                raise Exception("Workspace not found")

            
            # original_text, detected_lang = await detect_language_and_input(title)
            # english_topic = await translate_to_english(original_text)
            
            # Get Wiki data
            # wiki_data = get_wikipedia_summary(english_topic, sentences=1)
            # print(f"Wiki data: {wiki_data}")
            # Generate script
            generated_script = create_script_with_gemini(
                title, 
                style, 
                length,
                language
            )
            # print(f"Generated script: {generated_script}")
            # Save to database
            script = Script(
                workspace_id=workspace,
                title=title,
                generated_script=generated_script,
                language=language,
                style=style,
                status="draft"
            )
            script.save()
            print(f"Script saved: {script.id}")
            return {
                "script_id": str(script.id),
                "title": title,
                "script": generated_script,
            }, 201

        except Exception as e:
            return {"error": str(e)}, 500
        # Implement this method in your ScriptController class
    
    @staticmethod
    async def save_new_script(workspace_id, title, content):
        try:
            # Validate workspace
            workspace = Workspace.objects(id=workspace_id).first()
            if not workspace:
                raise Exception("Workspace not found")

            # Create new script
            script = Script(
                workspace_id=workspace,
                title=title,
                generated_script=content,
                style=1,  
                status="draft"
            )
            script.save()

            return {"id": str(script.id), "message": "Script created successfully"}, 201
        except Exception as e:
            return {"error": str(e)}, 500
        
    @staticmethod
    async def change_script_status_completed(script_id, new_script):
        try:
            # Find the script by ID
            script = Script.objects(id=script_id).first()
            if not script:
                raise Exception("Script not found")

            # Update the status to completed
            script.status = "completed"
            script.generated_script = new_script
            script.save()

            return {"message": "Script status updated to completed"}, 200
        except Exception as e:
            return {"error": str(e)}, 500
        
    @staticmethod
    async def create_script_from_text(workspace_id, title, content, language):
        try:
            # Create a new script from the provided text
            script = Script(
                workspace_id=workspace_id,
                title=title,
                generated_script=content,
                style=1,  
                language=language,
                status="draft"
            )
            script.save()
            
            return {"script_id": str(script.id), "message": "Script created successfully"}, 201
        except Exception as e:
            return {"error": str(e)}, 500
        
    @staticmethod
    def get_scripts_by_workspace(workspace_id):
        workspace = Workspace.objects(id=workspace_id).first()
        if not workspace:
            raise Exception("Workspace not found")
    
        scripts = Script.objects(workspace_id=workspace).order_by('-created_at')

        return [
            {
                "id": str(script.id),
                "title": script.title,
                "source_content": script.source_content,
                "created_at": script.created_at.isoformat(),
            }
            for script in scripts
        ]

    @staticmethod
    def create_title_from_script(script_id):
        try:
            # Find the script by ID
            script = Script.objects(id=script_id).first()
            if not script:
                raise Exception("Script not found")

            # Create a title from the script content
            title = create_title_with_gemini(
                script.title, 
                script.style, 
                script.language
            )
            return {"title": title}, 200
        except Exception as e:
            return {"error": str(e)}, 500
        
    @staticmethod
    def create_description_from_script(script_id):
        try:
            # Find the script by ID
            script = Script.objects(id=script_id).first()
            if not script:
                raise Exception("Script not found")

            # Create a title from the script content
            description = create_description_with_gemini(
                script.title, 
                script.style, 
                script.language
            )
            return {"description": description}, 200
        except Exception as e:
            return {"error": str(e)}, 500
        
    @staticmethod
    def create_caption_from_clip(clip_id):
        """Tạo caption từ clip_id bằng cách tìm script qua workspace"""
        try:
            # Bước 1: Tìm clip dựa trên clip_id
            clip = Clip.objects(id=clip_id).first()
            if not clip:
                return {"error": "Không tìm thấy clip"}, 404
            
            # Bước 2: Lấy workspace_id từ clip
            workspace_id = clip.workspace_id
            
            # Bước 3: Tìm script mới nhất trong workspace đó
            script = Script.objects(workspace_id=workspace_id).order_by('-created_at').first()
            if not script:
                # Nếu không tìm thấy script nào, tạo caption từ thông tin clip
                title = clip.prompt.strip()
                description = f"Video khoa học về chủ đề: {clip.prompt}"
                return {"title": title, "description": description}, 200
            
            # Bước 4: Sử dụng các phương thức hiện có để tạo title và description
            title_result, title_status = ScriptController.create_title_from_script(str(script.id))
            if title_status != 200:
                title = clip.prompt.strip()  # Sử dụng prompt nếu không tạo được title
            else:
                title = title_result.get("title")
                
            desc_result, desc_status = ScriptController.create_description_from_script(str(script.id))
            if desc_status != 200:
                description = f"Video khoa học về chủ đề: {clip.prompt}"  # Mô tả mặc định
            else:
                description = desc_result.get("description")
            
            return {"title": title, "description": description, "script_id": str(script.id)}, 200
            
        except Exception as e:
            print(f"Lỗi trong create_caption_from_clip: {str(e)}")
            return {"error": str(e)}, 500