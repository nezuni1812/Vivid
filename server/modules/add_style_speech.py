from gtts import gTTS
import ffmpeg

def add_style_speech(style, input_file, output_file):
    input_file = input_file  # File âm thanh gốc
    output_file = output_file    # File đầu ra
    try:
        stream = ffmpeg.input(input_file)
        if(style == 1):
            stream = ffmpeg.output(stream, output_file,
                            af="asetrate=44100*0.6,aresample=44100,atempo=1.1",
                            format="mp3"
            )
        elif(style == 2):
            stream = ffmpeg.output(stream, output_file, 
                            af="asetrate=44100*0.65,aresample=44100,atempo=1.13", 
                            format="mp3")

        ffmpeg.run(stream)
    except ffmpeg.Error as e:
        print("Lỗi:", e.stderr.decode())

