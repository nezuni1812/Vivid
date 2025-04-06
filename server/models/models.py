from mongoengine import Document, StringField, ReferenceField, DateTimeField, IntField
from datetime import datetime

# Model Users
class User(Document):
    firebase_uid = StringField(required=True, unique=True)
    username = StringField(max_length=50, required=True, unique=False)
    email = StringField(required=True, unique=True)
    role = StringField(default="user", choices=["user", "admin"])
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {"collection": "users"}

# Model Workspaces
class Workspace(Document):
    user_id = ReferenceField(User, required=True)
    name = StringField(max_length=100, required=True)
    description = StringField()
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {"collection": "workspaces"}

# Model Clips
class Clip(Document):
    workspace_id = ReferenceField(Workspace, required=True)
    prompt = StringField(required=True)
    clip_url = StringField()
    status = StringField(default="draft", choices=["draft", "processing", "completed"])
    created_at = DateTimeField(default=datetime.now)
    updated_at = DateTimeField(default=datetime.now)

    meta = {"collection": "clips"}

# Model PublishedClips
class PublishedClip(Document):
    clip_id = ReferenceField(Clip, required=True)
    platform = StringField(required=True, choices=["YouTube", "TikTok", "Facebook"])
    external_id = StringField(required=True)
    url = StringField(required=True)
    metadata = StringField()  # Lưu dưới dạng JSON string nếu cần
    published_at = DateTimeField(default=datetime.now)

    meta = {"collection": "published_clips"}

class Script(Document):
    workspace_id = ReferenceField(Workspace, required=True)
    title = StringField(required=True)
    source_content = StringField(required=True)  # Original text/wiki content
    generated_script = StringField()  # AI generated script
    language = StringField(default="en")
    style = IntField(default=1)  # 1: serious, 2: fun
    status = StringField(default="draft", choices=["draft", "processing", "completed", "error"])
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {"collection": "scripts"}

class Audio(Document):
    workspace_id = ReferenceField(Workspace, required=True)
    script_id = ReferenceField(Script, required=True)
    audio_url = StringField(required=True)
    timings = StringField(required=True)  # JSON string of timing data
    voice_style = IntField(default=1)
    status = StringField(default="processing", choices=["processing", "completed", "error"])
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {"collection": "audios"}