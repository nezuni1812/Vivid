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

def create_script_with_gemini(topic, wiki_data=None, lang = "en", style = 1, long = "100"):
    """Tạo kịch bản với Gemini dựa trên dữ liệu Wiki hoặc khái niệm gốc"""
    client = genai.Client()
    if style == 1:
        style = "serious voice for scientific documents"
        target_audience = "adults"
    elif style == 2:
        style = "fun voice for kids"
        target_audience = "children"

    if wiki_data:
        prompt = f"Write a {long} words science text in the language is {lang} about {wiki_data}. The text should be {style} (e.g., humorous, serious, educational, easy to understand) and written for reading aloud. Use correct punctuation and grammar, ensuring a clear topic sentence, detailed explanation with definitions, analysis, examples, or comparisons, a concluding summary highlighting its importance or applications. The target audience is {target_audience}. Exclude any references to visuals, sound effects, video elements, calls to subscribe, or future videos. Focus on clear and engaging prose suitable for an audio format. The text should conclude naturally with a summary of the topic.  **Do not include any headers, subheadings, bullet points, numbered lists, or other formatting markers.  The text should be a single, continuous paragraph or a series of short, cohesive paragraphs.**"
    else:    
        prompt = f"Write a {long} words science text in the language is {lang} about '{topic}'. The text should be {style} (e.g., humorous, serious, educational, easy to understand) and written for reading aloud. Use correct punctuation and grammar, ensuring a clear topic sentence, detailed explanation with definitions, analysis, examples, or comparisons, a concluding summary highlighting its importance or applications. The target audience is {target_audience}. Exclude any references to visuals, sound effects, video elements, calls to subscribe, or future videos. Focus on clear and engaging prose suitable for an audio format. The text should conclude naturally with a summary of the topic.  **Do not include any headers, subheadings, bullet points, numbered lists, or other formatting markers.  The text should be a single, continuous paragraph or a series of short, cohesive paragraphs.**" 
    try:    
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt]
        )
        return sanitize_text(response.text)
    except Exception as e:
        print(f"Lỗi khi tạo kịch bản với Gemini: {e}")
        return f"This is a script about {topic} (generated without Gemini due to an error)."