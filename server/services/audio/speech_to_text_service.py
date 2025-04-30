import whisper
from pydub import AudioSegment
import os
from google import genai
import json

# Ánh xạ từ value trong mảng languages sang mã ISO 639-1 cho Whisper
language_mapping_whisper = {
    "afrikaans": "af",
    "arabic": "ar",
    "bengali": "bn",
    "bulgarian": "bg",
    "catalan": "ca",
    "chinese": "zh",
    "croatian": "hr",
    "czech": "cs",
    "danish": "da",
    "dutch": "nl",
    "english": "en",
    "estonian": "et...",
    "finnish": "fi",
    "french": "fr",
    "german": "de",
    "greek": "el",
    "gujarati": "gu",
    "hindi": "hi",
    "hungarian": "hu",
    "icelandic": "is",
    "indonesian": "id",
    "italian": "it",
    "japanese": "ja",
    "korean": "ko",
    "latvian": "lv",
    "lithuanian": "lt",
    "malay": "ms",
    "malayalam": "ml",
    "norwegian": "no",
    "polish": "pl",
    "portuguese": "pt",
    "romanian": "ro",
    "russian": "ru",
    "serbian": "sr",
    "slovak": "sk",
    "slovenian": "sl",
    "spanish": "es",
    "swahili": "sw",
    "swedish": "sv",
    "tamil": "ta",
    "telugu": "te",
    "thai": "th",
    "turkish": "tr",
    "ukrainian": "uk",
    "urdu": "ur",
    "vietnamese": "vi",
    "welsh": "cy"
}

def correct_script(text):
    client = genai.Client()
    
    prompt = f"Sửa chính tả (không thêm gì khác): {text}"

    try:    
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt]
        )
        return response.text
    
    except Exception as e:
        print(f"Lỗi khi sửa chính tả kịch bản với Gemini: {e}")
        return f"This is a script about (generated without Gemini due to an error)."
    

def analyze_audio(audio_file, language_value="vietnamese"):
    """
    Phân tích file âm thanh, trả về mảng timings giống định dạng của bạn.
    :param audio_file: Đường dẫn tới file âm thanh (mp3, wav, ...).
    :param language_value: Giá trị từ mảng languages (ví dụ: 'vietnamese', 'english').
    :return: Mảng timings với các trường start_time, end_time, content.
    """
    # Lấy mã ngôn ngữ từ ánh xạ
    language_code = language_mapping_whisper.get(language_value)
    if not language_code:
        raise ValueError(f"Ngôn ngữ '{language_value}' không được hỗ trợ bởi Whisper.")

    # Load mô hình Whisper
    model = whisper.load_model("base")  # Có thể chọn "small", "medium", "large"

    # Đọc file âm thanh
    audio = AudioSegment.from_file(audio_file)
    
    # Chuyển đổi sang định dạng wav cho Whisper
    temp_file = "temp.wav"
    audio.export(temp_file, format="wav")
    
    # Nhận diện giọng nói với ngôn ngữ được chỉ định
    result = model.transcribe(temp_file, language=language_code, verbose=True)

    # Xóa file tạm
    os.remove(temp_file)
    
    # Tạo mảng timings theo định dạng của bạn
    timings = [
        {
            "start_time": round(segment["start"], 2),  # Làm tròn 2 chữ số thập phân
            "end_time": round(segment["end"], 2),      # Làm tròn 2 chữ số thập phân
            "content": correct_script(segment["text"].strip())         # Nội dung câu
        } for segment in result["segments"] if segment["text"].strip()
    ]
    
    timings_string = json.dumps(timings, ensure_ascii=False, indent=4)
    
    result_text = " ".join([segment["text"] for segment in result["segments"] if segment["text"].strip()])

    return result_text, timings_string
