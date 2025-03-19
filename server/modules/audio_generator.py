from gtts import gTTS
from pydub import AudioSegment
from mutagen.mp3 import MP3
import re
import io
import ffmpeg

# Hàm áp dụng style speed lên một chunk trong bộ nhớ
def add_style_speech_to_chunk(chunk, style):
    """Áp dụng style speed lên chunk trong bộ nhớ và trả về chunk đã chỉnh sửa"""
    try:
        # Chuyển chunk từ AudioSegment sang buffer MP3
        mp3_buffer_input = io.BytesIO()
        chunk.export(mp3_buffer_input, format="mp3")
        mp3_buffer_input.seek(0)
        
        # Tạo buffer đầu ra
        mp3_buffer_output = io.BytesIO()
        
        # Sử dụng ffmpeg để áp dụng bộ lọc
        stream = ffmpeg.input('pipe:', format='mp3')
        stream = ffmpeg.output(
            stream,
            'pipe:',
            af="asetrate=44100*0.6,aresample=44100,atempo=1.1" if style == 1 else 
              "asetrate=44100*0.65,aresample=44100,atempo=1.13",
            format="mp3"
        )
        
        # Chạy ffmpeg với input/output qua pipe
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
        print("Lỗi khi áp dụng style:", e.stderr.decode())
        return None  # Trả về None nếu lỗi

# Hàm tạo các chunk âm thanh trong bộ nhớ từ script và áp dụng style
def generate_audio_chunks_in_memory(script, language, style=None):
    sentences = [s.strip() + '.' for s in re.split(r'[.!?]+(?=\s)', script) if s.strip()]
    chunks = []
    
    for i, sentence in enumerate(sentences, 1):
        try:
            tts = gTTS(sentence, lang=language, slow=False)
            mp3_buffer = io.BytesIO()
            tts.write_to_fp(mp3_buffer)
            mp3_buffer.seek(0)
            chunk = AudioSegment.from_file(mp3_buffer, format="mp3")
            
            # Áp dụng style nếu có
            if style in [1, 2]:
                styled_chunk = add_style_speech_to_chunk(chunk, style)
                if styled_chunk is None:  # Kiểm tra lỗi từ add_style_speech_to_chunk
                    print(f"Bỏ qua chunk {i} do lỗi áp dụng style")
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
def process_script_to_audio_and_timings(script, language, style=None, output_file="output.mp3"):
    result = generate_audio_chunks_in_memory(script, language, style)
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

