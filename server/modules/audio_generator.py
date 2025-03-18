from gtts import gTTS
from pydub import AudioSegment
from pydub.silence import split_on_silence
import re

def generate_audio(script, language, output_file):
    """Tạo file âm thanh từ kịch bản với ngôn ngữ đầu vào"""
    try:
        tts = gTTS(script, lang=language, slow=False)
        tts.save(output_file)
        print(f"Đã tạo file âm thanh: {output_file}")
        return output_file
    except Exception as e:
        print(f"Lỗi tạo file âm thanh: {e}")
        return None

def analyze_sentence_timings(mp3_file, script):
    """Phân tích thời gian bắt đầu và kết thúc của từng câu trong file MP3"""
    # Tách văn bản thành danh sách câu
    sentences = [s.strip() + '.' for s in re.split(r'[.!?]+(?=\s)', script) if s.strip()]
    audio = AudioSegment.from_mp3(mp3_file)
    
    # Phát hiện khoảng dừng (silence)
    chunks = split_on_silence(
        audio,
        min_silence_len=500,
        silence_thresh=-40,
        keep_silence=200
    )
    
    # Tính thời gian và ghép với nội dung, giới hạn số câu
    timings = []
    current_start_time = 0.0
    min_chunks = min(len(chunks), len(sentences))  # Giới hạn số chunk không vượt quá số câu
    
    for i, chunk in enumerate(chunks[:min_chunks], 1):
        duration = len(chunk) / 1000  # Chuyển từ ms sang giây
        current_end_time = current_start_time + duration
        content = sentences[i-1]
        timings.append({
            "start_time": round(current_start_time, 2),
            "end_time": round(current_end_time, 2),
            "content": content
        })
        current_start_time = current_end_time
    
    # Chuyển timings thành chuỗi object (dạng Python list)
    timings_string = "[\n"
    for item in timings:
        timings_string += f"    {{'start_time': {item['start_time']}, 'end_time': {item['end_time']}, 'content': '{item['content']}'}},\n"
    timings_string += "]"
    
    return timings_string

def process_script_to_audio_and_timings(script, language, output_file):
    """Chuyển script thành MP3 và phân tích thời gian từng câu, trả về file và chuỗi object"""
    # Tạo file MP3
    mp3_file = generate_audio(script, language, output_file)
    if not mp3_file:
        return None, None
    
    # Phân tích thời gian và tạo chuỗi object
    timings_string = analyze_sentence_timings(mp3_file, script)
    
    # Trả về tuple (file MP3, chuỗi object)
    return mp3_file, timings_string
