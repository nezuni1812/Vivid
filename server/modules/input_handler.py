from googletrans import Translator
import asyncio

translator = Translator()

async def detect_language_and_input(user_input):
    """Nhận đầu vào từ người dùng và phát hiện ngôn ngữ"""
    try:
        # Gọi đồng bộ trực tiếp vì translator.detect không phải async
        detected = await translator.detect(user_input)
        language = detected.lang
        print(f"Ngôn ngữ đầu vào: {detected}")
        return user_input, language
    except Exception as e:
        print(f"Lỗi phát hiện ngôn ngữ: {e}")
        return user_input, "en"  # Mặc định là tiếng Anh nếu lỗi