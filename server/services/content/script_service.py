from google import genai
from dotenv import load_dotenv
import os
import re
import requests

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
        print("Đang chuyển sang sử dụng Llama làm mô hình dự phòng...")
        return create_script_with_llama(topic, style, length, lang)
    
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
        print("Đang chuyển sang sử dụng Llama làm mô hình dự phòng...")
        return create_title_with_llama(topic, style, lang)

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
        print("Đang chuyển sang sử dụng Llama làm mô hình dự phòng...")
        return create_description_with_llama(topic, style, lang)

def create_script_with_llama(topic, style, length, lang):
    """Tạo kịch bản với Llama dựa trên dữ liệu Wiki hoặc khái niệm gốc"""
    # Xác định phong cách dựa trên style
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
        # Lấy thông tin xác thực từ biến môi trường
        ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
        AUTH_TOKEN = os.environ.get("CLOUDFLARE_AUTH_TOKEN")
        
        # Kiểm tra xem có đủ thông tin xác thực không
        if not ACCOUNT_ID or not AUTH_TOKEN:
            raise ValueError("Missing Cloudflare credentials")
            
        # Gửi yêu cầu đến API Cloudflare
        response = requests.post(
            f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct",
            headers={"Authorization": f"Bearer {AUTH_TOKEN}"},
            json={
                "messages": [
                    {"role": "system", "content": "You are a friendly assistant"},
                    {"role": "user", "content": prompt}
                ]
            }
        )
        
        # Kiểm tra xem yêu cầu có thành công không
        response.raise_for_status()
        
        # Phân tích kết quả JSON
        result = response.json()
        
        # Truy cập nội dung từ phản hồi JSON
        # Cloudflare Workers AI thường có cấu trúc phản hồi là: {'result': {'response': 'content'}}
        if 'result' in result and 'response' in result['result']:
            content = result['result']['response']
        else:
            # Cấu trúc khác có thể là: {'success': true, 'result': 'content'}
            content = result.get('result', '')
            
        return sanitize_text(content)
        
    except requests.exceptions.RequestException as e:
        print(f"Lỗi kết nối API Cloudflare: {e}")
        return f"This is a script about {topic} (generated without Llama due to a connection error)."
    except ValueError as e:
        print(f"Lỗi cấu hình: {e}")
        return f"This is a script about {topic} (generated without Llama due to a configuration error)."
    except Exception as e:
        print(f"Lỗi khi tạo kịch bản với Llama: {e}")
        return f"This is a script about {topic} (generated without Llama due to an error)."


def create_title_with_llama(topic, style, lang):
    """Tạo tiêu đề với Llama khi Gemini gặp lỗi"""
    # Xác định phong cách dựa trên style
    if style == 1:
        style = "fun voice for kids"
    elif style == 2:
        style = "serious voice for educational content"
    elif style == 3:
        style = "serious voice for scientific documents"

    prompt = f"Create exactly 1 video title (nothing else) in {lang} language about {topic}. The title should have a style for {style}."

    try:
        # Lấy thông tin xác thực từ biến môi trường
        ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
        AUTH_TOKEN = os.environ.get("CLOUDFLARE_AUTH_TOKEN")
        
        # Kiểm tra xem có đủ thông tin xác thực không
        if not ACCOUNT_ID or not AUTH_TOKEN:
            raise ValueError("Missing Cloudflare credentials")
            
        # Gửi yêu cầu đến API Cloudflare
        response = requests.post(
            f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct",
            headers={"Authorization": f"Bearer {AUTH_TOKEN}"},
            json={
                "messages": [
                    {"role": "system", "content": "You are a friendly assistant"},
                    {"role": "user", "content": prompt}
                ]
            }
        )
        
        # Kiểm tra xem yêu cầu có thành công không
        response.raise_for_status()
        
        # Phân tích kết quả JSON
        result = response.json()
        
        # Truy cập nội dung từ phản hồi JSON
        if 'result' in result and 'response' in result['result']:
            content = result['result']['response']
        else:
            content = result.get('result', '')
            
        return sanitize_text(content)
        
    except Exception as e:
        print(f"Lỗi khi tạo tiêu đề với Llama: {e}")
        return f"Video about {topic}"
    
def create_description_with_llama(topic, style, lang):
    """Tạo mô tả với Llama khi Gemini gặp lỗi"""
    # Xác định phong cách dựa trên style
    if style == 1:
        style = "fun voice for kids"
    elif style == 2:
        style = "serious voice for educational content"
    elif style == 3:
        style = "serious voice for scientific documents"

    prompt = f"Create exactly 1 short video description of about 30 words (nothing else) in {lang} language about {topic}. The description should have a style for {style} and include hashtags with # symbol for social media."

    try:
        # Lấy thông tin xác thực từ biến môi trường
        ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
        AUTH_TOKEN = os.environ.get("CLOUDFLARE_AUTH_TOKEN")
        
        # Kiểm tra xem có đủ thông tin xác thực không
        if not ACCOUNT_ID or not AUTH_TOKEN:
            raise ValueError("Missing Cloudflare credentials")
            
        # Gửi yêu cầu đến API Cloudflare
        response = requests.post(
            f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct",
            headers={"Authorization": f"Bearer {AUTH_TOKEN}"},
            json={
                "messages": [
                    {"role": "system", "content": "You are a friendly assistant"},
                    {"role": "user", "content": prompt}
                ]
            }
        )
        
        # Kiểm tra xem yêu cầu có thành công không
        response.raise_for_status()
        
        # Phân tích kết quả JSON
        result = response.json()
        
        # Truy cập nội dung từ phản hồi JSON
        if 'result' in result and 'response' in result['result']:
            content = result['result']['response']
        else:
            content = result.get('result', '')
            
        return sanitize_text(content)
        
    except Exception as e:
        print(f"Lỗi khi tạo mô tả với Llama: {e}")
        return f"Khám phá {topic} trong video giáo dục này. #giáodục #{topic.replace(' ', '')}"