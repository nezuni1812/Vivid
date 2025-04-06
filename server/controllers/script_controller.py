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

            # Process language and translation
            original_text, detected_lang = await detect_language_and_input(title)
            english_topic = await translate_to_english(original_text)
            
            # Get Wiki data
            wiki_data = get_wikipedia_summary(english_topic, sentences=30)
            
            # Generate script
            generated_script = create_script_with_gemini(
                english_topic, 
                wiki_data, 
                detected_lang, 
                style, 
                length
            )

            # Save to database
            script = Script(
                workspace_id=workspace,
                title=title,
                source_content=wiki_data or original_text,
                generated_script=generated_script,
                language=detected_lang,
                style=style,
                status="completed"
            )
            script.save()

            return {
                "script_id": str(script.id),
                "title": title,
                "script": generated_script,
                "language": detected_lang,
                "style": style
            }, 201

        except Exception as e:
            return {"error": str(e)}, 500