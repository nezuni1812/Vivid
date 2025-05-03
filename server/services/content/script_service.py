from google import genai
from dotenv import load_dotenv
import os
import re

load_dotenv()

def sanitize_text(text):
    """Làm sạch văn bản, loại bỏ tất cả ký tự đặc biệt"""
    if not text:
        return text
    # Thay thế các dấu gạch ngang đặc biệt
    text = text.replace('–', '-').replace('—', '-')
    # Chỉ giữ lại chữ cái, số, khoảng trắng và dấu câu cơ bản (trừ ngoặc kép và đơn)
    text = re.sub(r'[^\w\s.,!?;:-]', '', text)
    # Loại bỏ khoảng trắng thừa
    text = ' '.join(text.split())
    return text

def create_script_with_gemini(topic, style, length,  lang):
    """Tạo kịch bản với Gemini dựa trên dữ liệu Wiki hoặc khái niệm gốc"""
    client = genai.Client()
    if style == 1:
        style =  "fun voice for kids"
        target_audience =  "children"
    elif style == 2:
        style = "serious voice for educational content"
        target_audience = "students"
    elif style == 3:
        style = "serious voice for scientific documents"
        target_audience = "scientists"

    prompt = f"Write a {length} words science text in the language {lang} about {topic}. The text should be {style} and written for reading aloud. Use correct punctuation and grammar, ensuring a clear topic sentence, detailed explanation with definitions, analysis, examples, or comparisons, a concluding summary highlighting its importance or applications. The target audience is {target_audience}. Exclude any references to visuals, sound effects, video elements, calls to subscribe, or future videos. Focus on clear and engaging prose suitable for an audio format. The text should conclude naturally with a summary of the topic.  **Do not include any headers, subheadings, bullet points, numbered lists, or other formatting markers.  The text should be a single, continuous paragraph or a series of short, cohesive paragraphs.**"

    try:    
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt]
        )
        return sanitize_text(response.text)
    except Exception as e:
        print(f"Lỗi khi tạo kịch bản với Gemini: {e}")
        return f"This is a script about {topic} (generated without Gemini due to an error)."
    
def create_title_with_gemini(topic, style, lang):
    """Tạo tiêu đề với Gemini dựa trên dữ liệu Wiki hoặc khái niệm gốc"""
    client = genai.Client()
    if style == 1:
        style =  "fun voice for kids"
    elif style == 2:
        style = "serious voice for educational content"
    elif style == 3:
        style = "serious voice for scientific documents"

    prompt = f"Tạo duy nhất 1 tiêu đề video (không thêm gì khác) trong ngôn ngữ {lang} về {topic}. Tiêu đề có phong cách dành cho {style}."

    try:    
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt]
        )
        return sanitize_text(response.text)
    except Exception as e:
        print(f"Lỗi khi tạo kịch bản với Gemini: {e}")
        return f"This is a script about {topic} (generated without Gemini due to an error)."
    
def create_description_with_gemini(topic, style, lang):
    client = genai.Client()
    if style == 1:
        style =  "fun voice for kids"
    elif style == 2:
        style = "serious voice for educational content"
    elif style == 3:
        style = "serious voice for scientific documents"

    prompt = f"Tạo duy nhất 1 mô tả video ngắn cỡ 30 chữ (không thêm gì khác) trong ngôn ngữ {lang} về {topic}. Mô tả có phong cách dành cho {style} có kèm theo cái hashtag có dấu # để đăng mạng xã hội."

    try:    
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt]
        )
        return sanitize_text(response.text)
    except Exception as e:
        print(f"Lỗi khi tạo kịch bản với Gemini: {e}")
        return f"This is a script about {topic} (generated without Gemini due to an error)."
    