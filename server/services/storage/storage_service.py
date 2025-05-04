import asyncio
import os
from config.storage import init_storage_client
from dotenv import load_dotenv

load_dotenv()

s3_client = init_storage_client()
R2_BUCKET = os.getenv("R2_BUCKET")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL")  # Thêm biến môi trường mới

async def upload_blob_to_r2(blob, file_name):
    """Upload blob to R2 storage and return public URL"""
    loop = asyncio.get_event_loop()
    try:
        # Save blob to a temporary file
        temp_file_path = os.path.join("temp_images", file_name)
        os.makedirs(os.path.dirname(temp_file_path) or ".", exist_ok=True)
        with open(temp_file_path, "wb") as f:
            f.write(blob.read())

        # Upload file to R2
        await loop.run_in_executor(None, lambda: s3_client.upload_file(
            temp_file_path, R2_BUCKET, file_name
        ))
        
        # Remove the temporary file
        # os.remove(temp_file_path)
        
        # Return public URL format
        return f"{R2_PUBLIC_URL}/{file_name}"
        
    except Exception as e:
        raise Exception(f"Upload failed: {str(e)}")

async def upload_to_r2(file_path, file_name):
    """Upload file to R2 storage and return public URL"""
    loop = asyncio.get_event_loop()
    try:
        # Upload file to R2
        await loop.run_in_executor(None, lambda: s3_client.upload_file(
            file_path, R2_BUCKET, file_name
        ))
        
        # Return public URL format
        return f"{R2_PUBLIC_URL}/{file_name}"
        
    except Exception as e:
        raise Exception(f"Upload failed: {str(e)}")
    
async def delete_from_r2(url):
    """Delete file from R2 storage"""
    loop = asyncio.get_event_loop()
    try:
        # Extract file name from URL
        file_name = url.split("/")[-1]
    except Exception as e:
        raise Exception(f"Delete failed: {str(e)}")
        
async def remove_from_r2(url_path):
    """Remove file from R2 storage"""
    file_name = url_path  # Extract file name from URL

    loop = asyncio.get_event_loop()
    try:
        # Delete file from R2
        await loop.run_in_executor(None, lambda: s3_client.delete_object(
            Bucket=R2_BUCKET, Key=file_name
        ))
        
    except Exception as e:
        raise Exception(f"Delete failed: {str(e)}")