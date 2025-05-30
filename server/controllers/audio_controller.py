from services.audio.audio_service import process_script_to_audio_and_timings
from services.audio.speech_to_text_service import analyze_audio
from services.storage.storage_service import upload_to_r2, delete_from_r2
from controllers.script_controller import ScriptController
from models.models import Audio, Script, Workspace
import os
import tempfile
from pydub import AudioSegment
import json  # Thêm dòng này vào đầu file

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
        


    @staticmethod
    async def speech_to_text(workspace_id, audio_file, language_value, update_existing=False):
        try:
            # Phân tích file âm thanh
            result_text, timings_string = analyze_audio(audio_file, language_value)
            
            # Tạo title từ tên file
            title = os.path.basename(audio_file).split('.')[0]
            
            # Kiểm tra nếu update_existing=True và đã có audio tồn tại
            if update_existing:
                # Tìm workspace object trước
                workspace = Workspace.objects(id=workspace_id).first()
                if not workspace:
                    return {"error": f"Không tìm thấy workspace với ID {workspace_id}"}, 404
                    
                # Tìm audio hiện có
                existing_audio = Audio.objects(workspace_id=workspace).first()
                if existing_audio:
                    # Lấy script hiện có và cập nhật nội dung
                    script = existing_audio.script_id
                    script.generated_script = result_text
                    script.save()
                    
                    # Chuyển đổi file sang định dạng MP3
                    temp_mp3 = os.path.join(tempfile.gettempdir(), f"{title}_converted.mp3")
                    audio = AudioSegment.from_file(audio_file)
                    audio.export(temp_mp3, format="mp3")
                    
                    try:
                        # Xóa file âm thanh cũ nếu cần
                        if existing_audio.audio_url:
                            await delete_from_r2(existing_audio.audio_url)
                        
                        # Upload file mới
                        file_name = f"audios/{workspace_id}/{title.replace(' ', '_')}.mp3"
                        audio_url = await upload_to_r2(temp_mp3, file_name)
                        
                        # Cập nhật audio hiện có
                        existing_audio.audio_url = audio_url
                        existing_audio.timings = timings_string
                        existing_audio.save()
                        
                        return {
                            "status": "success",
                            "script_id": str(script.id),
                            "audio_url": audio_url,
                            "text": result_text,
                            "timings": eval(timings_string)
                        }, 200
                    finally:
                        # Đảm bảo xóa file tạm sau khi hoàn thành
                        if os.path.exists(temp_mp3):
                            os.remove(temp_mp3)
            
            # Xử lý tạo mới nếu không update hoặc không tìm thấy audio hiện có
            # Tạo script từ văn bản đã nhận dạng
            script_result = await ScriptController.create_script_from_text(
                workspace_id=workspace_id,
                title=title,
                content=result_text,
                language=language_value
            )
            
            # Lấy script_id từ kết quả trả về
            script_id = script_result[0].get("script_id")
            
            # Chuyển đổi file sang định dạng MP3
            temp_mp3 = os.path.join(tempfile.gettempdir(), f"{title}_converted.mp3")
            audio = AudioSegment.from_file(audio_file)
            audio.export(temp_mp3, format="mp3")

            try:
                # Upload to storage - QUAN TRỌNG: Upload file đã chuyển đổi
                file_name = f"audios/{workspace_id}/{title.replace(' ', '_')}.mp3"
                audio_url = await upload_to_r2(temp_mp3, file_name)  # Sử dụng temp_mp3 thay vì audio_file

                # Save to database
                audio = Audio(
                    workspace_id=workspace_id,
                    script_id=script_id,
                    audio_url=audio_url,
                    timings=timings_string,
                    status="completed"
                )
                audio.save()

                return {
                    "status": "success",
                    "script_id": script_id,
                    "audio_url": audio_url,
                    "text": result_text,
                    "timings": eval(timings_string)
                }, 200
                
            finally:
                # Đảm bảo xóa file tạm sau khi hoàn thành
                if os.path.exists(temp_mp3):
                    os.remove(temp_mp3)
                
        except Exception as e:
            return {"error": str(e)}, 500
    
    @staticmethod
    def get_audio_by_workspace_id(workspace_id_string):
        """Get audio dựa vào string ID của workspace"""
        try:
            from bson.objectid import ObjectId
            import json
            from models.models import Workspace, Audio
            
            # Bước 1: Tìm workspace bằng string ID
            workspace = Workspace.objects(id=workspace_id_string).first()
            if not workspace:
                return {"error": f"Không tìm thấy workspace với ID {workspace_id_string}"}, 404
            
            # Bước 2: Tìm audio bằng object workspace (quan trọng!)
            audio = Audio.objects(workspace_id=workspace).first()
            if not audio:
                return {"message": "Không có audio nào cho workspace này"}, 200
            
            # Bước 3: Xử lý dữ liệu audio
            try:
                timings = json.loads(audio.timings) if isinstance(audio.timings, str) else audio.timings
            except:
                timings = audio.timings
                
            # Trả về dữ liệu audio
            result = {
                "audio_id": str(audio.id),
                "workspace_id": str(audio.workspace_id.id),
                "script_id": str(audio.script_id.id),
                "audio_url": audio.audio_url,
                "timings": timings,
                "status": audio.status,
                "voice_style": audio.voice_style
            }
            
            return result, 200
            
        except Exception as e:
            print(f"Lỗi trong get_audio_by_workspace_id: {str(e)}")
            return {"error": str(e)}, 500