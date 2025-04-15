from services.language.input_handler_service import detect_language_and_input
from services.language.translator_service import translate_to_english
from services.content.wiki_service import get_wikipedia_summary
from services.content.script_service import create_script_with_gemini
from models.models import Script, Workspace

class ScriptController:
    @staticmethod
    async def generate_script(workspace_id, title, style=1, length=300):
        try:
            # Validate workspace
            workspace = Workspace.objects(id=workspace_id).first()
            if not workspace:
                raise Exception("Workspace not found")

            
            original_text, detected_lang = await detect_language_and_input(title)
            english_topic = await translate_to_english(original_text)
            
            # Get Wiki data
            wiki_data = get_wikipedia_summary(english_topic, sentences=1)
            print(f"Wiki data: {wiki_data}")
            # Generate script
            generated_script = create_script_with_gemini(
                english_topic, 
                wiki_data, 
                detected_lang, 
                style, 
                length
            )
            print(f"Generated script: {generated_script}")
            # Save to database
            script = Script(
                workspace_id=workspace,
                title=title,
                generated_script=generated_script,
                style=style,
                status="draft"
            )
            script.save()

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
    async def change_script_status_completed(script_id):
        try:
            # Find the script by ID
            script = Script.objects(id=script_id).first()
            if not script:
                raise Exception("Script not found")

            # Update the status to completed
            script.status = "completed"
            script.save()

            return {"message": "Script status updated to completed"}, 200
        except Exception as e:
            return {"error": str(e)}, 500
        
    @staticmethod
    async def create_script_from_text(workspace_id, title, content):
        try:
            # Create a new script from the provided text
            script = Script(
                workspace_id=workspace_id,
                title=title,
                generated_script=content,
                style=1,  
                status="draft"
            )
            script.save()
            
            return {"id": str(script.id), "message": "Script created successfully"}, 201
        except Exception as e:
            return {"error": str(e)}, 500