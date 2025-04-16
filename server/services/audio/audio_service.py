from gtts import gTTS
from pydub import AudioSegment
from mutagen.mp3 import MP3
import re
import io
import ffmpeg

# Hàm áp dụng các hiệu ứng âm thanh lên một chunk trong bộ nhớ
def apply_audio_effects_to_chunk(chunk, speed=1.0, pitch=1.0, volume=0.0):
    """Áp dụng tốc độ, âm điệu, và cường độ lên chunk trong bộ nhớ và trả về chunk đã chỉnh sửa"""
    try:
        # Chuyển chunk từ AudioSegment sang buffer MP3
        mp3_buffer_input = io.BytesIO()
        chunk.export(mp3_buffer_input, format="mp3")
        mp3_buffer_input.seek(0)
        
        # Tạo buffer đầu ra
        mp3_buffer_output = io.BytesIO()
        
        # Tạo bộ lọc FFmpeg
        # - speed: Sử dụng atempo (giá trị từ 0.5 đến 2.0, có thể kết hợp nhiều atempo để mở rộng phạm vi)
        # - pitch: Sử dụng asetrate (tỷ lệ mẫu * pitch) và aresample để giữ chất lượng
        # - volume: Sử dụng volume filter (đơn vị dB)
        speed_filter = f"atempo={speed}"
        pitch_filter = f"asetrate=44100*{pitch},aresample=44100"
        volume_filter = f"volume={volume}dB"
        audio_filters = ",".join([pitch_filter, speed_filter, volume_filter])
        
        # Sử dụng FFmpeg để áp dụng bộ lọc
        stream = ffmpeg.input('pipe:', format='mp3')
        stream = ffmpeg.output(
            stream,
            'pipe:',
            af=audio_filters,
            format="mp3"
        )
        
        # Chạy FFmpeg với input/output qua pipe
        out, err = ffmpeg.run(
            stream,
            input=mp3_buffer_input.read(),
            capture_stdout=True,
            capture_stderr=True
        )
        mp3_buffer_output.write(out)
        mp3_buffer_output.seek(0)
        
        # Chuyển lại thành AudioSegment
        styled_chunk = AudioSegment.from_file(mp3_buffer_output, format="mp3")
        return styled_chunk
    except ffmpeg.Error as e:
        print("Lỗi khi áp dụng hiệu ứng âm thanh:", e.stderr.decode())
        return None  # Trả về None nếu lỗi

# Hàm tạo các chunk âm thanh trong bộ nhớ từ script và áp dụng hiệu ứng
def generate_audio_chunks_in_memory(script, language, speed=1.0, pitch=1.0, volume=0.0):
    # Danh sách các ngôn ngữ được gTTS hỗ trợ
    supported_languages = {
        "afrikaans": "af",
        "arabic": "ar",
        "bengali": "bn",
        "bulgarian": "bg",
        "catalan": "ca",
        "chinese": "zh-cn",
        "croatian": "hr",
        "czech": "cs",
        "danish": "da",
        "dutch": "nl",
        "english": "en",
        "estonian": "et",
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
        "welsh": "cy",
    }

    # Kiểm tra ngôn ngữ được hỗ trợ
    language_code = supported_languages.get(language.lower())
    if not language_code:
        print(f"Ngôn ngữ '{language}' không được gTTS hỗ trợ.")
        return None, None

    # Chia script thành các câu
    sentences = [s.strip() + '.' for s in re.split(r'[.!?]+(?=\s)', script) if s.strip()]
    chunks = []

    for i, sentence in enumerate(sentences, 1):
        try:
            # Tạo giọng nói với gTTS
            tts = gTTS(sentence, lang=language_code, slow=False)
            mp3_buffer = io.BytesIO()
            tts.write_to_fp(mp3_buffer)
            mp3_buffer.seek(0)
            chunk = AudioSegment.from_file(mp3_buffer, format="mp3")

            # Áp dụng hiệu ứng âm thanh nếu có thay đổi
            if speed != 1.0 or pitch != 1.0 or volume != 0.0:
                styled_chunk = apply_audio_effects_to_chunk(chunk, speed, pitch, volume)
                if styled_chunk is None:
                    print(f"Bỏ qua chunk {i} do lỗi áp dụng hiệu ứng")
                    return None, None
                chunk = styled_chunk

            chunks.append(chunk)
            print(f"Chunk {i}: {sentence} - Độ dài: {len(chunk)/1000:.2f}s")
        except Exception as e:
            print(f"Lỗi tạo chunk {i}: {e}")
            return None, None

    return sentences, chunks

# Hàm ghép các chunk trong bộ nhớ và tính thời gian
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

# Hàm chính
def process_script_to_audio_and_timings(script, language, speed=1.0, pitch=1.0, volume=0.0, output_file="output.mp3"):
    result = generate_audio_chunks_in_memory(script, language, speed, pitch, volume)
    if not result:
        print("Lỗi trong quá trình tạo chunk, không thể tiếp tục")
        return None, None
    sentences, chunks = result
    
    timings = combine_and_time_chunks_in_memory(chunks, output_file)
    if timings is None:
        return None, None
    
    for i, timing in enumerate(timings):
        timing["content"] = sentences[i]
    
    timings_string = "[\n"
    for item in timings:
        timings_string += f"    {{'start_time': {item['start_time']}, 'end_time': {item['end_time']}, 'content': '{item['content']}'}},\n"
    timings_string = timings_string.rstrip(",\n") + "\n]"
    
    # Đo độ dài file bằng mutagen
    audio = MP3(output_file)
    duration_seconds = audio.info.length
    
    print("Timings:\n", timings_string)
    print(f"Tổng thời gian từ timings: {timings[-1]['end_time']:.2f} giây")
    print(f"Độ dài từ metadata (mutagen): {duration_seconds:.2f} giây")
    
    return output_file, timings_string