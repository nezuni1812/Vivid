import asyncio
from googletrans import Translator

translator = Translator()

async def translate_to_english(text):
    """Dịch văn bản sang tiếng Anh bất đồng bộ"""
    try:
        translated = await translator.translate(text, dest='en')
        print(f"Đã dịch sang tiếng Anh: '{translated.text}'")
        return translated.text
    except Exception as e:
        print(f"Lỗi dịch thuật: {e}")
        return text  # Trả về nguyên gốc nếu lỗi