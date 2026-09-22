import os
import sys
import time
import subprocess
import tempfile
import wave
import numpy as np
import sounddevice as sd
import pyttsx3
import keyboard
from openai import OpenAI
from faster_whisper import WhisperModel

# Load environment variables from .env if present
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    if key.strip() not in os.environ:
                        os.environ[key.strip()] = val.strip()

load_env()

# 1. Initialize OmniRoute Client
omni_base_url = os.getenv("OMNIROUTE_BASE_URL", "http://localhost:20128/v1")
omni_api_key = os.getenv("OMNIROUTE_API_KEY", "sk-70f94128e961d179-494109-3414df9b")

omni = OpenAI(
    base_url=omni_base_url,
    api_key=omni_api_key
)

# 2. Local TTS Setup (Native Windows SAPI5)
tts = pyttsx3.init()
tts.setProperty('rate', 190)  # Snappy, natural pace
voices = tts.getProperty('voices')
# Select standard English voice if available
if len(voices) > 1:
    tts.setProperty('voice', voices[0].id)

def speak(text: str):
    print(f"\n[Lewis]: {text}")
    tts.say(text)
    tts.runAndWait()

# 3. Fast Local Speech-to-Text Model (CPU int8 or CUDA)
print("[*] Loading Faster-Whisper model into memory...")
try:
    stt_model = WhisperModel("base.en", device="cpu", compute_type="int8")
    print("[✓] Lewis Voice Engine Ready.")
except Exception as e:
    print(f"[!] Warning: Could not initialize base.en model ({e}), trying tiny.en...")
    stt_model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
    print("[✓] Lewis Voice Engine Ready (tiny.en fallback).")

# 4. OS Automation Tools
def execute_system_task(command_text: str):
    cmd = command_text.lower().strip()
    if "open vs code" in cmd or "open code" in cmd:
        subprocess.Popen(["code"], shell=True)
        return "Opening Visual Studio Code."
    elif "open chrome" in cmd or "open browser" in cmd:
        subprocess.Popen(["start", "chrome"], shell=True)
        return "Opening Google Chrome."
    elif "open terminal" in cmd or "open cmd" in cmd:
        subprocess.Popen(["start", "cmd"], shell=True)
        return "Launching terminal."
    elif "open explorer" in cmd or "open files" in cmd:
        subprocess.Popen(["explorer"], shell=True)
        return "Opening File Explorer."
    elif "open notepad" in cmd:
        subprocess.Popen(["notepad"], shell=True)
        return "Opening Notepad."
    return None

# 5. Microphone Recording Buffer
SAMPLE_RATE = 16000

def record_audio():
    print("\n[🎙️ Listening...] (Hold Alt + V while speaking)")
    recording = []
    
    with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, dtype='float32') as stream:
        while keyboard.is_pressed('alt+v'):
            chunk, _ = stream.read(1024)
            recording.append(chunk)
            time.sleep(0.01)
            
    if not recording:
        return None
        
    audio_data = np.concatenate(recording, axis=0)
    # Filter out empty/silent accidental clicks
    if np.max(np.abs(audio_data)) < 0.03:
        return None

    # Write temporarily for faster-whisper transcription
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        temp_path = f.name

    with wave.open(temp_path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes((audio_data * 32767).astype(np.int16).tobytes())

    # Transcribe with Whisper
    segments, _ = stt_model.transcribe(temp_path, vad_filter=True)
    transcript = " ".join([seg.text for seg in segments]).strip()
    
    try:
        os.remove(temp_path)
    except Exception:
        pass
        
    return transcript

# 6. Main Interaction Loop
print("\n" + "="*50)
print("  LEWIS PERSONAL VOICE AGENT ACTIVE")
print("  Gateway: " + omni_base_url)
print("  Hold [ Alt + V ] -> Speak -> Release key")
print("="*50 + "\n")

while True:
    try:
        if keyboard.is_pressed('alt+v'):
            user_text = record_audio()
            if not user_text or not user_text.strip():
                continue

            print(f"\n[You]: {user_text}")

            # Check if this is a direct system task
            system_action = execute_system_task(user_text)
            if system_action:
                speak(system_action)
                continue

            # Query OmniRoute via Lewis
            try:
                response = omni.chat.completions.create(
                    model="auto",
                    messages=[
                        {
                            "role": "system", 
                            "content": "You are Lewis, a personal local voice assistant. "
                                       "Keep voice replies concise, sharp, and conversational (1 to 3 sentences max) so they sound natural when spoken aloud."
                        },
                        {"role": "user", "content": user_text}
                    ],
                    max_tokens=150
                )
                reply = response.choices[0].message.content
            except Exception as api_err:
                print(f"[!] API Error: {api_err}")
                reply = f"I could not reach the language model on OmniRoute. Please ensure the server is active on {omni_base_url}."

            speak(reply)

        time.sleep(0.05)
    except KeyboardInterrupt:
        print("\nLewis voice shutting down.")
        sys.exit(0)
