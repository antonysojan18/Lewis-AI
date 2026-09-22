import os
import sys
import time
import wave
import tempfile
import pyaudio
import numpy as np
import pyttsx3
from openai import OpenAI
from faster_whisper import WhisperModel
import openwakeword
from openwakeword.model import Model

# Load environment variables from .env if present
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    if key.strip() not in os.environ:
                        os.environ[key.strip()] = val.strip()

load_env()

# 1. OmniRoute Gateway Connection
omni_base_url = os.getenv("OMNIROUTE_BASE_URL", "http://localhost:20128/v1")
omni_api_key = os.getenv("OMNIROUTE_API_KEY", "sk-70f94128e961d179-494109-3414df9b")

omni = OpenAI(
    base_url=omni_base_url,
    api_key=omni_api_key
)

# 2. Local Voice Feedback (Windows SAPI5)
tts = pyttsx3.init()
tts.setProperty('rate', 190)
voices = tts.getProperty('voices')
if len(voices) > 1:
    tts.setProperty('voice', voices[0].id)

def speak(text: str):
    print(f"\n[Lewis]: {text}")
    tts.say(text)
    tts.runAndWait()

# 3. Audio & Model Initialization
print("[*] Verifying openWakeWord models...")
try:
    openwakeword.utils.download_models()
except Exception as dl_err:
    print(f"[i] Model check info: {dl_err}")

# Load wake-word model
print("[*] Initializing Wake-Word detection models ('alexa', 'hey_jarvis')...")
wake_model = Model(wakeword_models=["alexa", "hey_jarvis"], inference_framework="onnx")

print("[*] Loading Faster-Whisper transcription engine...")
try:
    whisper = WhisperModel("base.en", device="cpu", compute_type="int8")
except Exception:
    whisper = WhisperModel("tiny.en", device="cpu", compute_type="int8")

CHUNK = 1280  # 80ms frames required by openWakeWord
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000

p = pyaudio.PyAudio()
mic_stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)

# Import OS Engine if available for real task execution
try:
    import lewis_os_engine
    has_os_engine = True
except Exception:
    has_os_engine = False

def record_user_command(timeout_seconds=5):
    """Records your follow-up command once the wake-word is detected."""
    print("🎙️ [Lewis Activated] Listening for command...")
    frames = []
    # Play subtle alert sound
    sys.stdout.write('\a')
    sys.stdout.flush()

    silence_threshold = 450
    silent_chunks = 0
    max_silent_chunks = int((RATE / CHUNK) * 1.5)  # 1.5s of silence marks end of command

    for _ in range(0, int((RATE / CHUNK) * timeout_seconds)):
        try:
            data = mic_stream.read(CHUNK, exception_on_overflow=False)
            frames.append(data)
            
            # Audio energy check for VAD
            audio_chunk = np.frombuffer(data, dtype=np.int16)
            if np.max(np.abs(audio_chunk)) < silence_threshold:
                silent_chunks += 1
            else:
                silent_chunks = 0

            if silent_chunks > max_silent_chunks and len(frames) > int((RATE / CHUNK) * 1.0):
                break
        except Exception as read_err:
            print(f"[!] Audio read error: {read_err}")
            break

    if not frames:
        return ""

    # Save to temp wave and transcribe
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        temp_wav = f.name

    wf = wave.open(temp_wav, 'wb')
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(p.get_sample_size(FORMAT))
    wf.setframerate(RATE)
    wf.writeframes(b''.join(frames))
    wf.close()

    try:
        segments, _ = whisper.transcribe(temp_wav, vad_filter=True)
        command = " ".join([s.text for s in segments]).strip()
    except Exception as trans_err:
        print(f"[!] Transcription error: {trans_err}")
        command = ""

    try:
        os.remove(temp_wav)
    except Exception:
        pass
        
    return command

print("\n" + "="*50)
print("  LEWIS BACKGROUND SENTRY DAEMON ACTIVE")
print("  Say 'Hey Jarvis' or 'Alexa' to activate...")
print("="*50 + "\n")

# Main Listening Loop
while True:
    try:
        audio_data = mic_stream.read(CHUNK, exception_on_overflow=False)
        audio_frame = np.frombuffer(audio_data, dtype=np.int16)

        # Feed frame to wake-word model
        prediction = wake_model.predict(audio_frame)

        # Trigger if confidence exceeds 0.5
        for model_name, score in prediction.items():
            if score >= 0.5:
                print(f"\n⚡ [Wake Word Detected]: {model_name} (Confidence: {score:.2f})")
                command = record_user_command()
                if not command or not command.strip():
                    print("[i] No follow-up voice command detected.")
                    continue

                print(f"\n[You]: {command}")

                # First attempt OS execution via Lewis OS Engine if requested
                reply = None
                if has_os_engine:
                    try:
                        reply = lewis_os_engine.execute_jarvis_task(command)
                    except Exception as os_err:
                        print(f"[i] OS engine pass-through: {os_err}")

                # Fallback to direct conversational response
                if not reply:
                    try:
                        response = omni.chat.completions.create(
                            model="auto",
                            messages=[
                                {
                                    "role": "system",
                                    "content": "You are Lewis, a personal computer AI. Give sharp, concise voice replies (1-2 sentences)."
                                },
                                {"role": "user", "content": command}
                            ]
                        )
                        reply = response.choices[0].message.content
                    except Exception as api_err:
                        reply = "I heard you, but I could not reach the OmniRoute model server."

                speak(reply)
                
                # Clear audio stream buffer to avoid double triggers
                try:
                    available = mic_stream.get_read_available()
                    if available > 0:
                        mic_stream.read(available, exception_on_overflow=False)
                except Exception:
                    pass

    except KeyboardInterrupt:
        print("\n[!] Shutting down Lewis Background Service...")
        break
    except Exception as loop_err:
        print(f"[!] Background error: {loop_err}")
        time.sleep(0.1)

mic_stream.stop_stream()
mic_stream.close()
p.terminate()
