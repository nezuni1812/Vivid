import asyncio
import edge_tts
from gtts import gTTS
from pydub import AudioSegment
from mutagen.mp3 import MP3
import re
import io
import ffmpeg
import json
import tempfile
import os

# Hàm áp dụng các hiệu ứng âm thanh (giữ nguyên)
def apply_audio_effects_to_chunk(chunk, speed=1.0, pitch=1.0, volume=0.0):
    """Áp dụng tốc độ, âm điệu, và cường độ lên chunk trong bộ nhớ và trả về chunk đã chỉnh sửa"""
    try:
        if not (0.5 <= speed <= 2.0):
            raise ValueError(f"Speed phải trong khoảng 0.5 đến 2.0, nhận được: {speed}")
        if not (0.5 <= pitch <= 2.0):
            raise ValueError(f"Pitch phải trong khoảng 0.5 đến 2.0, nhận được: {pitch}")
        if not (-12.0 <= volume <= 12.0):
            raise ValueError(f"Volume phải trong khoảng -12.0 đến 12.0, nhận được: {volume}")

        mp3_buffer_input = io.BytesIO()
        chunk.export(mp3_buffer_input, format="mp3")
        mp3_buffer_input.seek(0)
        
        mp3_buffer_output = io.BytesIO()
        speed_filter = f"atempo={speed}"
        pitch_filter = f"asetrate=44100*{pitch},aresample=44100"
        volume_filter = f"volume={volume}dB"
        audio_filters = ",".join([pitch_filter, speed_filter, volume_filter])
        
        stream = ffmpeg.input('pipe:', format='mp3')
        stream = ffmpeg.output(stream, 'pipe:', af=audio_filters, format="mp3")
        
        out, err = ffmpeg.run(
            stream,
            input=mp3_buffer_input.read(),
            capture_stdout=True,
            capture_stderr=True
        )
        mp3_buffer_output.write(out)
        mp3_buffer_output.seek(0)
        
        styled_chunk = AudioSegment.from_mp3(mp3_buffer_output)
        return styled_chunk
    except ffmpeg.Error as e:
        print(f"Lỗi khi áp dụng hiệu ứng âm thanh: {e.stderr.decode()}")
        return None
    except ValueError as e:
        print(f"Lỗi giá trị đầu vào: {e}")
        return None

# Hàm tạo các chunk âm thanh
async def generate_audio_chunks_in_memory(script, language, engine="gtts", gender="female", speed=1.0, pitch=1.0, volume=0.0):
    # Danh sách ngôn ngữ được gTTS hỗ trợ
    gtts_languages = {
        "afrikaans": "af", "arabic": "ar", "bengali": "bn", "bulgarian": "bg", "catalan": "ca",
        "chinese": "zh-cn", "croatian": "hr", "czech": "cs", "danish": "da", "dutch": "nl",
        "english": "en", "estonian": "et", "finnish": "fi", "french": "fr", "german": "de",
        "greek": "el", "gujarati": "gu", "hindi": "hi", "hungarian": "hu", "icelandic": "is",
        "indonesian": "id", "italian": "it", "japanese": "ja", "korean": "ko", "latvian": "lv",
        "lithuanian": "lt", "malay": "ms", "malayalam": "ml", "norwegian": "no", "polish": "pl",
        "portuguese": "pt", "romanian": "ro", "russian": "ru", "serbian": "sr", "slovak": "sk",
        "slovenian": "sl", "spanish": "es", "swahili": "sw", "swedish": "sv", "tamil": "ta",
        "telugu": "te", "thai": "th", "turkish": "tr", "ukrainian": "uk", "urdu": "ur",
        "vietnamese": "vi", "welsh": "cy"
    }

    # Danh sách giọng nói edge-tts theo ngôn ngữ và giới tính
    edge_tts_voices = {
        "af-za": {"female": "af-ZA-AdriNeural", "male": "af-ZA-WillemNeural"},
        "sq-al": {"female": "sq-AL-AnilaNeural", "male": "sq-AL-IlirNeural"},
        "am-et": {"female": "am-ET-MekdesNeural", "male": "am-ET-AmehaNeural"},
        "ar-dz": {"female": "ar-DZ-AminaNeural", "male": "ar-DZ-IsmaelNeural"},
        "ar-bh": {"female": "ar-BH-LailaNeural", "male": "ar-BH-AliNeural"},
        "ar-eg": {"female": "ar-EG-SalmaNeural", "male": "ar-EG-ShakirNeural"},
        "ar-iq": {"female": "ar-IQ-RanaNeural", "male": "ar-IQ-BasselNeural"},
        "ar-jo": {"female": "ar-JO-SanaNeural", "male": "ar-JO-TaimNeural"},
        "ar-kw": {"female": "ar-KW-NouraNeural", "male": "ar-KW-FahedNeural"},
        "ar-lb": {"female": "ar-LB-LaylaNeural", "male": "ar-LB-RamiNeural"},
        "ar-ly": {"female": "ar-LY-ImanNeural", "male": "ar-LY-OmarNeural"},
        "ar-ma": {"female": "ar-MA-MounaNeural", "male": "ar-MA-JamalNeural"},
        "ar-om": {"female": "ar-OM-AyshaNeural", "male": "ar-OM-AbdullahNeural"},
        "ar-qa": {"female": "ar-QA-AmalNeural", "male": "ar-QA-MoazNeural"},
        "ar-sa": {"female": "ar-SA-ZariyahNeural", "male": "ar-SA-HamedNeural"},
        "ar-sy": {"female": "ar-SY-AmanyNeural", "male": "ar-SY-LaithNeural"},
        "ar-tn": {"female": "ar-TN-ReemNeural", "male": "ar-TN-HediNeural"},
        "ar-ae": {"female": "ar-AE-FatimaNeural", "male": "ar-AE-HamdanNeural"},
        "ar-ye": {"female": "ar-YE-MaryamNeural", "male": "ar-YE-SalehNeural"},
        "az-az": {"female": "az-AZ-BanuNeural", "male": "az-AZ-BabekNeural"},
        "bn-bd": {"female": "bn-BD-NabanitaNeural", "male": "bn-BD-PradeepNeural"},
        "bn-in": {"female": "bn-IN-TanishaaNeural", "male": "bn-IN-BashkarNeural"},
        "bs-ba": {"female": "bs-BA-VesnaNeural", "male": "bs-BA-GoranNeural"},
        "bg-bg": {"female": "bg-BG-KalinaNeural", "male": "bg-BG-BorislavNeural"},
        "my-mm": {"female": "my-MM-NilarNeural", "male": "my-MM-ThihaNeural"},
        "ca-es": {"female": "ca-ES-JoanaNeural", "male": "ca-ES-EnricNeural"},
        "zh-hk": {"female": "zh-HK-HiuMaanNeural", "male": "zh-HK-WanLungNeural"},
        "zh-cn": {"female": "zh-CN-XiaoxiaoNeural", "male": "zh-CN-YunxiNeural"},
        "zh-cn-liaoning": {"female": "zh-CN-liaoning-XiaobeiNeural"},
        "zh-tw": {"female": "zh-TW-HsiaoYuNeural", "male": "zh-TW-YunJheNeural"},
        "zh-cn-shaanxi": {"female": "zh-CN-shaanxi-XiaoniNeural"},
        "hr-hr": {"female": "hr-HR-GabrijelaNeural", "male": "hr-HR-SreckoNeural"},
        "cs-cz": {"female": "cs-CZ-VlastaNeural", "male": "cs-CZ-AntoninNeural"},
        "da-dk": {"female": "da-DK-ChristelNeural", "male": "da-DK-JeppeNeural"},
        "nl-be": {"female": "nl-BE-DenaNeural", "male": "nl-BE-ArnaudNeural"},
        "nl-nl": {"female": "nl-NL-ColetteNeural", "male": "nl-NL-MaartenNeural"},
        "en-au": {"female": "en-AU-NatashaNeural", "male": "en-AU-WilliamNeural"},
        "en-ca": {"female": "en-CA-ClaraNeural", "male": "en-CA-LiamNeural"},
        "en-hk": {"female": "en-HK-YanNeural", "male": "en-HK-SamNeural"},
        "en-in": {"female": "en-IN-NeerjaNeural", "male": "en-IN-PrabhatNeural"},
        "en-ie": {"female": "en-IE-EmilyNeural", "male": "en-IE-ConnorNeural"},
        "en-ke": {"female": "en-KE-AsiliaNeural", "male": "en-KE-ChilembaNeural"},
        "en-nz": {"female": "en-NZ-MollyNeural", "male": "en-NZ-MitchellNeural"},
        "en-ng": {"female": "en-NG-EzinneNeural", "male": "en-NG-AbeoNeural"},
        "en-ph": {"female": "en-PH-RosaNeural", "male": "en-PH-JamesNeural"},
        "en-sg": {"female": "en-SG-LunaNeural", "male": "en-SG-WayneNeural"},
        "en-za": {"female": "en-ZA-LeahNeural", "male": "en-ZA-LukeNeural"},
        "en-tz": {"female": "en-TZ-ImaniNeural", "male": "en-TZ-ElimuNeural"},
        "en-gb": {"female": "en-GB-SoniaNeural", "male": "en-GB-RyanNeural"},
        "en-us": {"female": "en-US-AriaNeural", "male": "en-US-GuyNeural"},
        "et-ee": {"female": "et-EE-AnuNeural", "male": "et-EE-KertNeural"},
        "fil-ph": {"female": "fil-PH-BlessicaNeural", "male": "fil-PH-AngeloNeural"},
        "fi-fi": {"female": "fi-FI-NooraNeural", "male": "fi-FI-HarriNeural"},
        "fr-be": {"female": "fr-BE-CharlineNeural", "male": "fr-BE-GerardNeural"},
        "fr-ca": {"female": "fr-CA-SylvieNeural", "male": "fr-CA-AntoineNeural"},
        "fr-fr": {"female": "fr-FR-DeniseNeural", "male": "fr-FR-HenriNeural"},
        "fr-ch": {"female": "fr-CH-ArianeNeural", "male": "fr-CH-FabriceNeural"},
        "gl-es": {"female": "gl-ES-SabelaNeural", "male": "gl-ES-RoiNeural"},
        "ka-ge": {"female": "ka-GE-EkaNeural", "male": "ka-GE-GiorgiNeural"},
        "de-at": {"female": "de-AT-IngridNeural", "male": "de-AT-JonasNeural"},
        "de-de": {"female": "de-DE-KatjaNeural", "male": "de-DE-ConradNeural"},
        "de-ch": {"female": "de-CH-LeniNeural", "male": "de-CH-JanNeural"},
        "el-gr": {"female": "el-GR-AthinaNeural", "male": "el-GR-NestorasNeural"},
        "gu-in": {"female": "gu-IN-DhwaniNeural", "male": "gu-IN-NiranjanNeural"},
        "he-il": {"female": "he-IL-HilaNeural", "male": "he-IL-AvriNeural"},
        "hi-in": {"female": "hi-IN-SwaraNeural", "male": "hi-IN-MadhurNeural"},
        "hu-hu": {"female": "hu-HU-NoemiNeural", "male": "hu-HU-TamasNeural"},
        "is-is": {"female": "is-IS-GudrunNeural", "male": "is-IS-GunnarNeural"},
        "id-id": {"female": "id-ID-GadisNeural", "male": "id-ID-ArdiNeural"},
        "ga-ie": {"female": "ga-IE-OrlaNeural", "male": "ga-IE-ColmNeural"},
        "it-it": {"female": "it-IT-IsabellaNeural", "male": "it-IT-DiegoNeural"},
        "ja-jp": {"female": "ja-JP-NanamiNeural", "male": "ja-JP-KeitaNeural"},
        "jv-id": {"female": "jv-ID-SitiNeural", "male": "jv-ID-DimasNeural"},
        "kn-in": {"female": "kn-IN-SapnaNeural", "male": "kn-IN-GaganNeural"},
        "kk-kz": {"female": "kk-KZ-AigulNeural", "male": "kk-KZ-DauletNeural"},
        "km-kh": {"female": "km-KH-SreymomNeural", "male": "km-KH-PisethNeural"},
        "ko-kr": {"female": "ko-KR-SunHiNeural", "male": "ko-KR-InJoonNeural"},
        "lo-la": {"female": "lo-LA-KeomanyNeural", "male": "lo-LA-ChanthavongNeural"},
        "lv-lv": {"female": "lv-LV-EveritaNeural", "male": "lv-LV-NilsNeural"},
        "lt-lt": {"female": "lt-LT-OnaNeural", "male": "lt-LT-LeonasNeural"},
        "mk-mk": {"female": "mk-MK-MarijaNeural", "male": "mk-MK-AleksandarNeural"},
        "ms-my": {"female": "ms-MY-YasminNeural", "male": "ms-MY-OsmanNeural"},
        "ml-in": {"female": "ml-IN-SobhanaNeural", "male": "ml-IN-MidhunNeural"},
        "mt-mt": {"female": "mt-MT-GraceNeural", "male": "mt-MT-JosephNeural"},
        "mr-in": {"female": "mr-IN-AarohiNeural", "male": "mr-IN-ManoharNeural"},
        "mn-mn": {"female": "mn-MN-YesuiNeural", "male": "mn-MN-BataaNeural"},
        "ne-np": {"female": "ne-NP-HemkalaNeural", "male": "ne-NP-SagarNeural"},
        "nb-no": {"female": "nb-NO-PernilleNeural", "male": "nb-NO-FinnNeural"},
        "ps-af": {"female": "ps-AF-LatifaNeural", "male": "ps-AF-GulNawazNeural"},
        "fa-ir": {"female": "fa-IR-DilaraNeural", "male": "fa-IR-FaridNeural"},
        "pl-pl": {"female": "pl-PL-ZofiaNeural", "male": "pl-PL-MarekNeural"},
        "pt-br": {"female": "pt-BR-FranciscaNeural", "male": "pt-BR-AntonioNeural"},
        "pt-pt": {"female": "pt-PT-RaquelNeural", "male": "pt-PT-DuarteNeural"},
        "ro-ro": {"female": "ro-RO-AlinaNeural", "male": "ro-RO-EmilNeural"},
        "ru-ru": {"female": "ru-RU-SvetlanaNeural", "male": "ru-RU-DmitryNeural"},
        "sr-rs": {"female": "sr-RS-SophieNeural", "male": "sr-RS-NicholasNeural"},
        "si-lk": {"female": "si-LK-ThiliniNeural", "male": "si-LK-SameeraNeural"},
        "sk-sk": {"female": "sk-SK-ViktoriaNeural", "male": "sk-SK-LukasNeural"},
        "sl-si": {"female": "sl-SI-PetraNeural", "male": "sl-SI-RokNeural"},
        "so-so": {"female": "so-SO-UbaxNeural", "male": "so-SO-MuuseNeural"},
        "es-ar": {"female": "es-AR-ElenaNeural", "male": "es-AR-TomasNeural"},
        "es-bo": {"female": "es-BO-SofiaNeural", "male": "es-BO-MarceloNeural"},
        "es-cl": {"female": "es-CL-CatalinaNeural", "male": "es-CL-LorenzoNeural"},
        "es-co": {"female": "es-CO-SalomeNeural", "male": "es-CO-GonzaloNeural"},
        "es-cr": {"female": "es-CR-MariaNeural", "male": "es-CR-JuanNeural"},
        "es-cu": {"female": "es-CU-BelkysNeural", "male": "es-CU-ManuelNeural"},
        "es-do": {"female": "es-DO-RamonaNeural", "male": "es-DO-EmilioNeural"},
        "es-ec": {"female": "es-EC-AndreaNeural", "male": "es-EC-LuisNeural"},
        "es-sv": {"female": "es-SV-LorenaNeural", "male": "es-SV-RodrigoNeural"},
        "es-gq": {"female": "es-GQ-TeresaNeural", "male": "es-GQ-JavierNeural"},
        "es-gt": {"female": "es-GT-MartaNeural", "male": "es-GT-AndresNeural"},
        "es-hn": {"female": "es-HN-KarlaNeural", "male": "es-HN-CarlosNeural"},
        "es-mx": {"female": "es-MX-DaliaNeural", "male": "es-MX-JorgeNeural"},
        "es-ni": {"female": "es-NI-YolandaNeural", "male": "es-NI-FedericoNeural"},
        "es-pa": {"female": "es-PA-MargaritaNeural", "male": "es-PA-RobertoNeural"},
        "es-py": {"female": "es-PY-TaniaNeural", "male": "es-PY-MarioNeural"},
        "es-pe": {"female": "es-PE-CamilaNeural", "male": "es-PE-AlexNeural"},
        "es-pr": {"female": "es-PR-KarinaNeural", "male": "es-PR-VictorNeural"},
        "es-es": {"female": "es-ES-ElviraNeural", "male": "es-ES-AlvaroNeural"},
        "es-us": {"female": "es-US-PalomaNeural", "male": "es-US-AlonsoNeural"},
        "es-uy": {"female": "es-UY-ValentinaNeural", "male": "es-UY-MateoNeural"},
        "es-ve": {"female": "es-VE-PaolaNeural", "male": "es-VE-SebastianNeural"},
        "su-id": {"female": "su-ID-TutiNeural", "male": "su-ID-JajangNeural"},
        "sw-ke": {"female": "sw-KE-ZuriNeural", "male": "sw-KE-RafikiNeural"},
        "sw-tz": {"female": "sw-TZ-RehemaNeural", "male": "sw-TZ-DaudiNeural"},
        "sv-se": {"female": "sv-SE-SofieNeural", "male": "sv-SE-MattiasNeural"},
        "ta-in": {"female": "ta-IN-PallaviNeural", "male": "ta-IN-ValluvarNeural"},
        "ta-my": {"female": "ta-MY-KaniNeural", "male": "ta-MY-SuryaNeural"},
        "ta-sg": {"female": "ta-SG-VenbaNeural", "male": "ta-SG-AnbuNeural"},
        "ta-lk": {"female": "ta-LK-SaranyaNeural", "male": "ta-LK-KumarNeural"},
        "te-in": {"female": "te-IN-ShrutiNeural", "male": "te-IN-MohanNeural"},
        "th-th": {"female": "th-TH-PremwadeeNeural", "male": "th-TH-NiwatNeural"},
        "tr-tr": {"female": "tr-TR-EmelNeural", "male": "tr-TR-AhmetNeural"},
        "uk-ua": {"female": "uk-UA-PolinaNeural", "male": "uk-UA-OstapNeural"},
        "ur-in": {"female": "ur-IN-GulNeural", "male": "ur-IN-SalmanNeural"},
        "ur-pk": {"female": "ur-PK-UzmaNeural", "male": "ur-PK-AsadNeural"},
        "uz-uz": {"female": "uz-UZ-MadinaNeural", "male": "uz-UZ-SardorNeural"},
        "vi-vn": {"female": "vi-VN-HoaiMyNeural", "male": "vi-VN-NamMinhNeural"},
        "cy-gb": {"female": "cy-GB-NiaNeural", "male": "cy-GB-AledNeural"},
        "zu-za": {"female": "zu-ZA-ThandoNeural", "male": "zu-ZA-ThembaNeural"}
    }

    # Chọn giọng nói dựa trên engine
    if engine == "gtts":
        language_code = gtts_languages.get(language.lower())
        if not language_code:
            print(f"Ngôn ngữ '{language}' không được gTTS hỗ trợ.")
            return None, None
    elif engine == "edge_tts":
        voices = edge_tts_voices.get(language.lower())
        if not voices:
            print(f"Ngôn ngữ '{language}' không được edge-tts hỗ trợ.")
            return None, None
        voice = voices.get(gender.lower(), voices.get("female", voices.get("male")))
    else:
        print(f"Engine '{engine}' không được hỗ trợ. Chọn 'gtts' hoặc 'edge_tts'.")
        return None, None

    # Chia script thành các câu
    sentences = [s.strip() + '.' for s in re.split(r'[.!?]+(?=\s)', script) if s.strip()]
    chunks = []

    for i, sentence in enumerate(sentences, 1):
        temp_file = None
        try:
            if engine == "gtts":
                # Tạo giọng nói với gTTS (dùng BytesIO)
                tts = gTTS(sentence, lang=language_code, slow=False)
                mp3_buffer = io.BytesIO()
                tts.write_to_fp(mp3_buffer)
                mp3_buffer.seek(0)
                if mp3_buffer.getbuffer().nbytes == 0:
                    raise ValueError(f"Buffer rỗng cho chunk {i}")
                chunk = AudioSegment.from_mp3(mp3_buffer)
            else:
                # Tạo giọng nói với edge-tts (dùng file tạm)
                rate = (speed - 1.0) * 100
                rate_str = f"{rate:+.0f}%"
                pitch_hz = (pitch - 1.0) * 100
                pitch_str = f"{pitch_hz:+.0f}Hz"
                communicate = edge_tts.Communicate(sentence, voice, rate=rate_str, pitch=pitch_str)
                
                # Tạo file tạm
                with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp:
                    temp_file = temp.name
                    await communicate.save(temp_file)
                
                # Kiểm tra xem file có tồn tại và có dữ liệu không
                if not os.path.exists(temp_file) or os.path.getsize(temp_file) == 0:
                    raise ValueError(f"File tạm rỗng cho chunk {i}")
                
                # Đọc file tạm vào AudioSegment
                chunk = AudioSegment.from_file(temp_file, format="mp3")

            # Áp dụng hiệu ứng âm thanh
            if engine == "gtts" and (speed != 1.0 or pitch != 1.0 or volume != 0.0):
                styled_chunk = apply_audio_effects_to_chunk(chunk, speed, pitch, volume)
                if styled_chunk is None:
                    print(f"Bỏ qua chunk {i} do lỗi áp dụng hiệu ứng")
                    continue
                chunk = styled_chunk
            elif engine == "edge_tts" and volume != 0.0:
                chunk = chunk + volume

            chunks.append(chunk)
            print(f"Chunk {i}: {sentence} - Độ dài: {len(chunk)/1000:.2f}s")
        except Exception as e:
            print(f"Lỗi tạo chunk {i}: {e}")
            continue
        finally:
            # Xóa file tạm nếu tồn tại
            if temp_file and os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except Exception as e:
                    print(f"Lỗi khi xóa file tạm cho chunk {i}: {e}")

    if not chunks:
        print("Không tạo được chunk nào")
        return None, None
    return sentences, chunks

# Hàm ghép các chunk (giữ nguyên)
def combine_and_time_chunks_in_memory(chunks, output_file="output.mp3"):
    if chunks is None:
        print("Không có chunks để ghép do lỗi trước đó")
        return None
    
    combined_audio = AudioSegment.empty()
    timings = []
    cumulative_start_time = 0.0
    
    for i, chunk in enumerate(chunks, 1):
        duration = len(chunk) / 1000
        cumulative_end_time = cumulative_start_time + duration
        timings.append({
            "start_time": round(cumulative_start_time, 2),
            "end_time": round(cumulative_end_time, 2),
            "content": f"Chunk {i}"
        })
        combined_audio += chunk
        cumulative_start_time = cumulative_end_time
    
    combined_audio.export(output_file, format="mp3")
    print(f"Đã tạo file âm thanh: {output_file}")
    return timings

# Hàm chính (giữ nguyên)
async def process_script_to_audio_and_timings(script, language, engine="gtts", gender="female", speed=1.0, pitch=1.0, volume=0.0, output_file="output.mp3"):
    result = await generate_audio_chunks_in_memory(script, language, engine, gender, speed, pitch, volume)
    if not result:
        print("Lỗi trong quá trình tạo chunk, không thể tiếp tục")
        return None, None
    sentences, chunks = result
    
    timings = combine_and_time_chunks_in_memory(chunks, output_file)
    if timings is None:
        return None, None
    
    for i, timing in enumerate(timings):
        timing["content"] = sentences[i]
    
    timings_string = json.dumps(timings, ensure_ascii=False, indent=4)
    
    audio = MP3(output_file)
    duration_seconds = audio.info.length
    
    print("Timings:\n", timings_string)
    print(f"Tổng thời gian từ timings: {timings[-1]['end_time']:.2f} giây")
    print(f"Độ dài từ metadata (mutagen): {duration_seconds:.2f} giây")
    
    return output_file, timings_string