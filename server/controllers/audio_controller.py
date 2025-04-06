from services.audio.audio_service import process_script_to_audio_and_timings
from services.storage.storage_service import upload_to_r2
import os
from datetime import datetime
from models.models import Audio, Script, Workspace

class AudioController:
    @staticmethod
    async def generate_audio(script_id, voice_style=1):
        try:
            # Get script
            script = Script.objects(id=script_id).first()
            if not script:
                raise Exception("Script not found")

            # Generate audio and timing
            temp_file = f"temp_{script.title.replace(' ', '_')}.mp3"
            output_file, timings_string = process_script_to_audio_and_timings(
                script.generated_script,
                script.language,
                voice_style,
                temp_file
            )

            if not output_file:
                raise Exception("Failed to generate audio file")

            try:
                # Upload to storage
                file_name = f"audios/{script.workspace_id.id}/{script.title.replace(' ', '_')}.mp3"
                audio_url = await upload_to_r2(temp_file, file_name)

                # Save to database
                audio = Audio(
                    workspace_id=script.workspace_id,
                    script_id=script,
                    audio_url=audio_url,
                    timings=timings_string,
                    voice_style=voice_style,
                    status="completed"
                )
                audio.save()

                return {
                    "audio_id": str(audio.id),
                    "audio_url": audio_url,
                    "timings": eval(timings_string)
                }, 201

            finally:
                # Clean up temp file
                if os.path.exists(temp_file):
                    os.remove(temp_file)

        except Exception as e:
            return {"error": str(e)}, 500