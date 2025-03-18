# audio_analyzer.py
from pydub import AudioSegment
from pydub.silence import split_on_silence

def analyze_sentence_timings(mp3_file):
    """Phân tích thời gian kết thúc của từng câu trong file MP3"""
    # Load file MP3
    audio = AudioSegment.from_mp3(mp3_file)
    
    # Phát hiện khoảng dừng (silence)
    # min_silence_len: độ dài tối thiểu của khoảng dừng (ms)
    # silence_thresh: ngưỡng âm lượng dưới đó được coi là im lặng (dBFS)
    chunks = split_on_silence(
        audio,
        min_silence_len=600,
        silence_thresh=-40,
        keep_silence=300  # Giữ lại 200ms im lặng ở mỗi đầu để tự nhiên hơn
    )
    
    # Tính thời gian kết thúc của từng câu
    timings = []
    current_time = 0
    for i, chunk in enumerate(chunks, 1):
        duration = len(chunk) / 1000  # Chuyển từ ms sang giây
        current_time += duration
        timings.append((f"Câu {i}", round(current_time, 2)))
    
    return timings