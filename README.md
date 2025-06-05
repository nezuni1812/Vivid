# Vivid - Software Design Project (HCMUS)

An AI-powered application for making pop-sci videos based on user topics or voice recording, with support for automation upload to social media platforms and tracking user engagement on YouTube, TikTok, and Facebook.

## Video demo
[![Vivid - Phần mềm tự động hóa tạo Video bằng AI on YouTube](https://img.youtube.com/vi/BcLDmO-cOaM/0.jpg)](https://www.youtube.com/watch?v=BcLDmO-cOaM)
## Features
- Google OAuth for user authentication
- Generate scripts:
    - Based on user keywords/topics/voice recording
    - Supports multiple languages, including Vietnamese
    - Target audience selection, e.g., students, general public, kids
    - Text-to-Speech (TTS) for script reading
- Image generation and video finding based on script segments
- Video editing UI for users to customize their videos
- Upload videos to social media platforms (YouTube, TikTok, Facebook)
- Track user engagement on social media platforms

## How to run

The project needs both the backend and frontend to run. Follow the instructions below to set up both parts.

### Backend

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Vivid
   # go to the backend directory
   cd server
   ```
2. Create a virtual environment:
   ```bash
    python -m venv venv
   ```
3. Activate the virtual environment:
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS and Linux:
     ```bash
     source venv/bin/activate
     ```
4. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```
5. Set up environment variables:
   Copy the `.env.example` file to `.env` and fill in the required values.

6. Run the server:
   ```bash
   python app.py
   ```

### Frontend

1. Go to the frontend directory:
   ```bash
   # from the root directory of the project
   cd client
   ```
2. Install the required packages:
   ```bash
    npm i
   ```
3. Set up environment variables:
   Copy the `.env.example` file to `.env` and fill in the required values.
4. Run the frontend:
   ```bash
    npm run dev
   ```
5. Open your browser and go to `http://localhost:5173` to see the application.

