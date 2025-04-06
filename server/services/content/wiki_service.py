import wikipedia
import wikipedia.exceptions
import warnings

def get_wikipedia_summary(topic, sentences=30):
    """Lấy summary từ Wikipedia"""
    try:
        warnings.filterwarnings("ignore", category=UserWarning)
        result = wikipedia.summary(topic, sentences=sentences, auto_suggest=False)
        return result
    except wikipedia.exceptions.DisambiguationError as e:
        first_option = e.options[0]
        print(f"Từ khóa '{topic}' không rõ ràng, tự động chọn: '{first_option}'")
        try:
            result = wikipedia.summary(first_option, sentences=sentences, auto_suggest=False)
            return result
        except wikipedia.exceptions.PageError:
            return None
    except wikipedia.exceptions.PageError:
        return None