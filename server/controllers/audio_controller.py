from services.audio.audio_service import process_script_to_audio_and_timings
from services.storage.storage_service import upload_to_r2, delete_from_r2
import os
from datetime import datetime
from models.models import Audio, Script, Workspace

class AudioController:
    @staticmethod
    async def generate_audio(script_id, engine="gtts", gender="female", speed=1.0, pitch=1.0, volume=0.0):
        try:
            # Dictionary ánh xạ mã ngôn ngữ ngắn sang locale edge-tts
            language_map = {
                "afrikaans": "af-za",
                "arabic": "ar-sa",
                "bengali": "bn-bd",
                "bulgarian": "bg-bg",
                "catalan": "ca-es",
                "chinese": "zh-cn",
                "croatian": "hr-hr",
                "czech": "cs-cz",
                "danish": "da-dk",
                "dutch": "nl-nl",
                "english": "en-us",
                "estonian": "et-ee",
                "finnish": "fi-fi",
                "french": "fr-fr",
                "german": "de-de",
                "greek": "el-gr",
                "gujarati": "gu-in",
                "hindi": "hi-in",
                "hungarian": "hu-hu",
                "icelandic": "is-is",
                "indonesian": "id-id",
                "italian": "it-it",
                "japanese": "ja-jp",
                "korean": "ko-kr",
                "latvian": "lv-lv",
                "lithuanian": "lt-lt",
                "malay": "ms-my",
                "malayalam": "ml-in",
                "norwegian": "nb-no",
                "polish": "pl-pl",
                "portuguese": "pt-br",
                "romanian": "ro-ro",
                "russian": "ru-ru",
                "serbian": "sr-rs",
                "slovak": "sk-sk",
                "slovenian": "sl-si",
                "spanish": "es-es",
                "swahili": "sw-ke",
                "swedish": "sv-se",
                "tamil": "ta-in",
                "telugu": "te-in",
                "thai": "th-th",
                "turkish": "tr-tr",
                "ukrainian": "uk-ua",
                "urdu": "ur-pk",
                "vietnamese": "vi-vn",
                "welsh": "cy-gb",
            }

            # Get script
            script = Script.objects(id=script_id).first()
            if not script:
                raise Exception("Script not found")
            
            # Map language to edge-tts locale if needed
            language = script.language.lower()
            if engine == "edge_tts":
                language = language_map.get(language, language)
                # Kiểm tra xem locale có được hỗ trợ bởi edge-tts không
                supported_locales = [
                    "af-za", "sq-al", "am-et", "ar-dz", "ar-bh", "ar-eg", "ar-iq", "ar-jo", "ar-kw",
                    "ar-lb", "ar-ly", "ar-ma", "ar-om", "ar-qa", "ar-sa", "ar-sy", "ar-tn", "ar-ae",
                    "ar-ye", "az-az", "bn-bd", "bn-in", "bs-ba", "bg-bg", "my-mm", "ca-es", "zh-hk",
                    "zh-cn", "zh-cn-liaoning", "zh-tw", "zh-cn-shaanxi", "hr-hr", "cs-cz", "da-dk",
                    "nl-be", "nl-nl", "en-au", "en-ca", "en-hk", "en-in", "en-ie", "en-ke", "en-nz",
                    "en-ng", "en-ph", "en-sg", "en-za", "en-tz", "en-gb", "en-us", "et-ee", "fil-ph",
                    "fi-fi", "fr-be", "fr-ca", "fr-fr", "fr-ch", "gl-es", "ka-ge", "de-at", "de-de",
                    "de-ch", "el-gr", "gu-in", "he-il", "hi-in", "hu-hu", "is-is", "id-id", "ga-ie",
                    "it-it", "ja-jp", "jv-id", "kn-in", "kk-kz", "km-kh", "ko-kr", "lo-la", "lv-lv",
                    "lt-lt", "mk-mk", "ms-my", "ml-in", "mt-mt", "mr-in", "mn-mn", "ne-np", "nb-no",
                    "ps-af", "fa-ir", "pl-pl", "pt-br", "pt-pt", "ro-ro", "ru-ru", "sr-rs", "si-lk",
                    "sk-sk", "sl-si", "so-so", "es-ar", "es-bo", "es-cl", "es-co", "es-cr", "es-cu",
                    "es-do", "es-ec", "es-sv", "es-gq", "es-gt", "es-hn", "es-mx", "es-ni", "es-pa",
                    "es-py", "es-pe", "es-pr", "es-es", "es-us", "es-uy", "es-ve", "su-id", "sw-ke",
                    "sw-tz", "sv-se", "ta-in", "ta-my", "ta-sg", "ta-lk", "te-in", "th-th", "tr-tr",
                    "uk-ua", "ur-in", "ur-pk", "uz-uz", "vi-vn", "cy-gb", "zu-za"
                ]
                if language not in supported_locales:
                    raise Exception(f"Ngôn ngữ '{language}' không được edge-tts hỗ trợ")
                
            existing_audio = Audio.objects(workspace_id=script.workspace_id, script_id=script).first()
            if existing_audio:
                await delete_from_r2(existing_audio.audio_url)
                existing_audio.delete()


            # Generate audio and timing
            temp_file = f"temp_{script.title.replace(' ', '_')}.mp3"
            output_file, timings_string = await process_script_to_audio_and_timings(
                script.generated_script,
                language,
                engine=engine,
                gender=gender,
                speed=speed,
                pitch=pitch,
                volume=volume,
                output_file=temp_file
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