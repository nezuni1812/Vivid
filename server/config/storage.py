import boto3
import os
from dotenv import load_dotenv

load_dotenv()

def init_storage_client():
    R2_ENDPOINT_URL = os.getenv("R2_ENDPOINT_URL")
    R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
    R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")

    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY
    )