import asyncio
import base64
import json
from flask import Blueprint, request, jsonify, send_from_directory
from pydantic import BaseModel
from google import genai
from google.genai import types
import requests
from PIL import Image
from io import BytesIO
import os
from dotenv import load_dotenv
import uuid
from urllib.parse import urljoin

from models.models import Clip, Resource
from services.storage.storage_service import upload_to_r2, upload_blob_to_r2

load_dotenv()

creation_bp = Blueprint('creation', __name__)
IMAGE_FOLDER = 'temp_images'
os.makedirs(IMAGE_FOLDER, exist_ok=True)

@creation_bp.route('/images/<filename>')
def serve_image(filename):
    return send_from_directory(IMAGE_FOLDER, filename)

print("Creation blueprint registered")
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

@creation_bp.route("/creations", methods=["POST"])
def new_creations():
    # Get json from request body
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    print("Data:", data)
    # return jsonify({"content": "good request"}), 200
    workspace = request.args.get("workspace_id")
    if not workspace:
        return jsonify({"error": "No workspace_id provided"}), 400
    
    oldClips = Resource.objects(workspace_id=workspace)
    if oldClips:
        for clip in oldClips:
            # TODO: please remove the old cloudflare image file if its an image
            clip.delete()
    
    newClips = [Resource(workspace_id=workspace, resource_url="", status="processing", resource_type="image") for scriptSegment in data]
    for clip in newClips:
        clip.save()

    script_content = determine_illustration_content(json.dumps(data, ensure_ascii=False, indent=2))
    print("Script content:", script_content)
    materials = [None for _ in range(len(data))]
    materials = asyncio.run(get_all_vid_segment(script_content, materials))
    print("Videos done:", materials)
    for idx in range(len(materials)):
        if materials[idx] is not None:
            newClips[idx].resource_url = materials[idx]
            newClips[idx].resource_type = "video"
            newClips[idx].status = "completed"
            newClips[idx].save();
    
    materials = asyncio.run(get_all_image_segment(script_content, materials))
    # for idx in range(len(script_content)):
    #     if materials[idx] is not None:
    #         script_content[idx].content = materials[idx]
    print("All done")
    for idx in range(len(materials)):
        if materials[idx] is not None:
            newClips[idx].resource_url = materials[idx]
            # newClips[idx].resource_type = "image"
            newClips[idx].status = "completed"
            newClips[idx].save();
    
    return jsonify(materials), 200

@creation_bp.route("/creations/create-image", methods=["POST"])
def create_image():
    print("Creating image on user prompt")
    data = request.get_json()
    if not data or "prompt" not in data:
        return jsonify({"error": "No data provided"}), 400
    
    print("Data:", data)
    return jsonify({"content": "good request"}), 200

    filename = asyncio.run(get_image(data["prompt"]))
    print("Generating image with description:", data["prompt"], " with filename:", filename)
    return jsonify({"content": filename}), 200

@creation_bp.route("/creations/save", methods=["POST"])
def save_video():
    print("Saving video")
    # data = request.files
    # if not data:
    #     return jsonify({"error": "No data provided"}), 400
    
    # take video blob from key file from multipart/form-data
    blob = request.files['file']
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    # take filename from form data
    filename = request.form.get('filename')
    if not request.form.get('filename'):
        return jsonify({"error": "No filename provided"}), 400
    
    video_url = asyncio.run(upload_blob_to_r2(blob, filename))
    print("Video URL:", video_url)
    return jsonify({"content": video_url}), 200
    
    
@creation_bp.route("/creations/edit", methods=["POST"])
def gen_on_prompt():
    print("Generating on prompt")
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    if (data["what"] == "image" and "script" in data):
        filename = data.get("filename", None)  
        if (filename is not None):
            filename = filename.split("/")[-1]
            
        filename = asyncio.run(get_image(data["script"], filename=filename, additional=data.get("prompt", None)))
        print("Generating image with description:", data["prompt"], " with filename:", filename)
        return jsonify({"what": "image", "content": filename}), 200
    
    # return jsonify({"what": "script", "content": "http://localhost/2098u53g84u.png"}), 200
    return jsonify({"error": "Bad request"}), 400
    
class Script(BaseModel):
    start_time: str
    end_time: str
    content: str
    type: str
    description: str
    
def determine_illustration_content(scripts, style=1) -> list[Script]:
    
    print("Determining illustration content")
    response = client.models.generate_content(
        model="models/gemini-2.0-flash-exp",
        contents=[
            """
            From the script, determine each element in the script should best be illustrated with an image or a video. The script could be in Vietnamese so you can translate to English and infer base on the most important words in the script. 
            If it should be illustrated with an image, return the image description in great details, relating to technical concept, so a image generation AI can understand your prompt. 
            If it should be illustrated with a video, return the video description, it should be keywords, could be something broad like Nature, Tigers, People. 
            Or it could be something specific like Group of people working. 
            Make a copy of the script and add the `type` (video or image), `description` for each element in the script. Always return in JSON format')
            There only at maximum 5 image elements.
            """,
            scripts,
        ],
        config=types.GenerateContentConfig(
            response_modalities=['Text'],
            response_mime_type="application/json",
            response_schema=list[Script]
        )
    )
    
    print("The amount of element with type of image:", len([script for script in response.parsed if script.type == "image"]))
    return response.parsed

async def get_all_vid_segment(script_list, materials):
    tasks = []
    for script_idx in range(len(script_list)):
        if script_list[script_idx].type == 'video':
            async def task(idx=script_idx):
                video = await get_video(script_list[idx].description)
                materials[idx] = video
            tasks.append(task())
            
    results = await asyncio.gather(*tasks)

    return materials

async def get_all_image_segment(script_list, materials):
    tasks = []
    for script_idx in range(len(script_list)):
        if script_list[script_idx].type == 'image':
            async def task(idx=script_idx):
                base64_image = await get_image(script_list[idx].description)
                materials[idx] = base64_image
            tasks.append(task())
            
    results = await asyncio.gather(*tasks)

    return materials

async def get_video(description) -> str:
    print(f"Searching for video with description: {description}")
    result = requests.get("https://api.pexels.com/videos/search", params={'query': description}, headers={"Authorization": os.getenv("PEXELS_API_KEY")})
    if result.status_code == 200:
        data = result.json()
        for vid in data["videos"]:
            if vid["duration"] > 5:
                for video_file in vid["video_files"]:
                    if 2048 > video_file["height"] >= 1080:
                        print(f"{description}: {video_file['link']}")
                        # print(vi["link"])
                        return video_file["link"]
                
    else:
        print(f"Error: {result.status_code}")
    return None;

async def get_image(description, filename=None, additional=None) -> str:
    print(f"Generating image with description: {description}")
    response = client.models.generate_content(
    model="models/gemini-2.0-flash-exp",
        contents=[
            f"""Return the image description in great details, relating to technical concept about the following concept, so a image generation AI can understand your prompt: {description}""",
            ],
        config=types.GenerateContentConfig(response_modalities=['Text'])
    )
    
    prompt_content = [
        f"""Generate 1 single image about the following description""",
        f"and satisfies the following requirements: {additional}" if additional else " ",
        ": ",
        response.text,
    ]
    print("Prompt content:", prompt_content)
    try:
        finalresponse = client.models.generate_content(
            model="models/gemini-2.0-flash-exp",
            contents=prompt_content,
            config=types.GenerateContentConfig(response_modalities=['Text', 'Image'])
        )
    except Exception as e:
        print("Error:", e)
        return None
    for part in finalresponse.candidates[0].content.parts:
        if part.text is not None:
            print(part.text)
        elif part.inline_data is not None:
            print("Image generated")
            image = Image.open(BytesIO(part.inline_data.data))
            if (filename is None):
                filename = f"{uuid.uuid4().hex}.png"
            filepath = os.path.join(IMAGE_FOLDER, filename)
            image.save(filepath)
            image_url = await upload_to_r2(filepath, filename)
            print("Image URL:", image_url)
            return image_url
            return urljoin(os.getenv("BASE_URL"), f"/images/{filename}")
            return f"{IMAGE_FOLDER}/{filename}"
        
    return ""
        
def encode_image_to_data_url(image_bytes):
    mime = get_mime_type(image_bytes)
    b64 = base64.b64encode(image_bytes).decode('utf-8')
    return f"data:{mime};base64,{b64}"

def get_mime_type(image_bytes):
    if image_bytes.startswith(b'\x89PNG'):
        return 'image/png'
    elif image_bytes.startswith(b'\xff\xd8'):
        return 'image/jpeg'
    else:
        return 'application/octet-stream'  # fallback
