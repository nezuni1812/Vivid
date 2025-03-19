import asyncio
from modules.input_handler import detect_language_and_input
from modules.translator import translate_to_english
from modules.wiki_crawler import get_wikipedia_summary
from modules.script_generator import create_script_with_gemini
from modules.audio_generator import process_script_to_audio_and_timings

async def process_science_concept(user_input, long, style):
    """Xử lý khái niệm khoa học từ đầu vào đến đầu ra"""
    # Bước 1: Nhận đầu vào và phát hiện ngôn ngữ
    original_text, detected_lang = await detect_language_and_input(user_input)
    
    # Bước 2: Dịch sang tiếng Anh
    english_topic = await translate_to_english(original_text)
    
    # Bước 3: Crawl dữ liệu từ Wikipedia
    wiki_data = get_wikipedia_summary(english_topic, sentences=30)
    if wiki_data:
        print("Dữ liệu từ Wikipedia:", wiki_data[:200] + "...")
    else:
        print(f"Không tìm thấy dữ liệu Wikipedia cho '{english_topic}'")
    
    # Bước 4: Tạo kịch bản với Gemini
    script = create_script_with_gemini(english_topic, wiki_data, detected_lang, style, long)
    print("Kịch bản:", script)
    output_file = "output.mp3"

    # Bước 5: Tạo file âm thanh với ngôn ngữ gốc
    output_file, timings_string = process_script_to_audio_and_timings(script, detected_lang, style, output_file)
    # In kết quả
    if output_file and timings_string:
        print(f"File MP3: {output_file}")
        print("\nChuỗi object thời gian và nội dung từng câu:")
        print(timings_string)
    else:
        print("Có lỗi xảy ra trong quá trình xử lý.")


if __name__ == "__main__":
    # style 1: serious voice for scientific documents
    # style 2: fun voice for kids
    style = 1
    long = 300
    user_input = "Cách dùng flex box trong CSS"  # Thay bằng đầu vào mong muốn
    asyncio.run(process_science_concept(user_input, long, style))  
