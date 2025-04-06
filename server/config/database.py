from mongoengine import connect
import os
from dotenv import load_dotenv

load_dotenv()

def init_db():
    MONGODB_URI = os.getenv("CONNECTION_STRING")
    connect(host=MONGODB_URI, db="vivid")