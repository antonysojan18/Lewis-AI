import os
import sys
import subprocess
import json
import psutil
import pyautogui
from openai import OpenAI

# Safety failsafe: slamming mouse to any corner cancels PyAutoGUI
pyautogui.FAILSAFE = True

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

omni_base_url = os.getenv("OMNIROUTE_BASE_URL", "http://localhost:20128/v1")
omni_api_key = os.getenv("OMNIROUTE_API_KEY", "sk-70f94128e961d179-494109-3414df9b")

omni = OpenAI(
    base_url=omni_base_url,
    api_key=omni_api_key
)

# -------------------------------------------------------------
# 1. ACTUAL COMPUTER ACTION HANDLERS
# -------------------------------------------------------------
def run_command(command: str):
    """Executes a shell command and returns output."""
    try:
        res = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
        output = res.stdout if res.stdout else res.stderr
        return output.strip() or "Command completed with no output."
    except Exception as e:
        return f"Execution error: {str(e)}"

def open_application(app_name: str):
    """Launches local software by name."""
    app = app_name.lower().strip()
    apps = {
        "code": "code",
        "vs code": "code",
        "vscode": "code",
        "chrome": "start chrome",
        "browser": "start chrome",
        "terminal": "start cmd",
        "cmd": "start cmd",
        "notepad": "notepad",
        "calculator": "calc",
        "file explorer": "explorer",
        "explorer": "explorer",
        "task manager": "taskmgr",
        "settings": "start ms-settings:"
    }
    cmd = apps.get(app, f"start {app}")
    subprocess.Popen(cmd, shell=True)
    return f"Launched {app_name}."

def manage_file(action: str, path: str, content: str = ""):
    """Reads, writes, or lists files and directories."""
    path = os.path.expanduser(path)
    try:
        if action == "read":
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        elif action == "write":
            parent = os.path.dirname(os.path.abspath(path))
            if parent:
                os.makedirs(parent, exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            return f"Successfully written to {path}"
        elif action == "list":
            return "\n".join(os.listdir(path))
    except Exception as e:
        return f"File operation failed: {str(e)}"

def get_system_stats():
    """Returns real-time CPU, RAM, and Battery percentages."""
    battery = psutil.sensors_battery()
    bat_pct = f"{battery.percent}%" if battery else "Desktop/AC"
    return f"CPU: {psutil.cpu_percent(interval=0.1)}% | RAM: {psutil.virtual_memory().percent}% | Battery: {bat_pct}"

def gui_action(action: str, text: str = ""):
    """Controls screen, mouse, and keyboard directly."""
    try:
        if action == "screenshot":
            temp_dir = os.environ.get("TEMP", os.getcwd())
            shot_path = os.path.join(temp_dir, "lewis_screen.png")
            pyautogui.screenshot(shot_path)
            return f"Screenshot saved to {shot_path}"
        elif action == "type":
            pyautogui.write(text, interval=0.02)
            return f"Typed: {text}"
        elif action == "press_enter":
            pyautogui.press("enter")
            return "Pressed Enter"
        return "Unknown action"
    except Exception as e:
        return f"GUI action failed: {str(e)}"

# -------------------------------------------------------------
# 2. TOOL SCHEMAS FOR OMNIROUTE (FUNCTION CALLING)
# -------------------------------------------------------------
JARVIS_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "run_command",
            "description": "Execute terminal commands, git commands, scripts, or system tasks.",
            "parameters": {
                "type": "object",
                "properties": {"command": {"type": "string"}},
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "open_application",
            "description": "Open applications on the machine (VS Code, Chrome, Explorer, Notepad, etc.)",
            "parameters": {
                "type": "object",
                "properties": {"app_name": {"type": "string"}},
                "required": ["app_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "manage_file",
            "description": "Read, write, or list local files and directories.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": ["read", "write", "list"]},
                    "path": {"type": "string"},
                    "content": {"type": "string"}
                },
                "required": ["action", "path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_system_stats",
            "description": "Query live CPU, RAM, and Battery usage.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "gui_action",
            "description": "Simulate keyboard typing, screenshots, and clicks on screen.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": ["screenshot", "type", "press_enter"]},
                    "text": {"type": "string"}
                },
                "required": ["action"]
            }
        }
    }
]

# Map names to functions
TOOL_MAP = {
    "run_command": run_command,
    "open_application": open_application,
    "manage_file": manage_file,
    "get_system_stats": get_system_stats,
    "gui_action": gui_action
}

# -------------------------------------------------------------
# 3. JARVIS AGENTIC DISPATCHER LOOP
# -------------------------------------------------------------
def execute_jarvis_task(user_instruction: str):
    messages = [
        {
            "role": "system",
            "content": (
                "You are Lewis, a powerful local desktop AI with full access to this machine. "
                "You can execute shell commands, manage files, open programs, and control the screen. "
                "Always choose tool calls when a system action or query is needed. "
                "Be confident, concise, and report actions precisely like Jarvis."
            )
        },
        {"role": "user", "content": user_instruction}
    ]

    candidate_models = ["auto", "qwen/qwen2.5-coder-32b-instruct", "antigravity/claude-sonnet-4-6"]
    response = None
    last_err = None

    for model_name in candidate_models:
        try:
            response = omni.chat.completions.create(
                model=model_name,
                messages=messages,
                tools=JARVIS_TOOLS,
                tool_choice="auto"
            )
            break
        except Exception as e:
            last_err = e
            continue

    if not response:
        return f"Error connecting to OmniRoute: {last_err}"

    msg = response.choices[0].message

    # Handle multi-step execution if the model invokes tools
    if hasattr(msg, 'tool_calls') and msg.tool_calls:
        messages.append(msg)
        for tool_call in msg.tool_calls:
            fn_name = tool_call.function.name
            try:
                args = json.loads(tool_call.function.arguments)
            except Exception:
                args = {}

            handler = TOOL_MAP.get(fn_name)
            if handler:
                print(f"\n⚡ [Lewis Executing]: {fn_name}({args})")
                tool_result = handler(**args)
                print(f"👉 [Output]: {tool_result}")
            else:
                tool_result = f"Unknown tool: {fn_name}"

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": fn_name,
                "content": str(tool_result)
            })

        # Final summary after action completes
        try:
            final_summary = omni.chat.completions.create(
                model="auto",
                messages=messages
            )
            return final_summary.choices[0].message.content
        except Exception as summary_err:
            return f"Action executed successfully. Result: {tool_result}"
    else:
        return msg.content or "Task completed."

if __name__ == "__main__":
    if len(sys.argv) > 1:
        task = " ".join(sys.argv[1:])
        print(f"Executing: {task}")
        result = execute_jarvis_task(task)
        print(f"\n[Lewis Result]:\n{result}")
    else:
        print("Usage: python lewis_os_engine.py <your system task>")
