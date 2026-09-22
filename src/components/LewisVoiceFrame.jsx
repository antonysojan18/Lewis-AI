import React, { useState, useEffect, useRef } from "react";
import { Mic, Volume2 } from "lucide-react";

export default function LewisVoiceFrame({ children, onVoiceMessage }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = async (event) => {
        const spokenText = event.results[0][0].transcript;
        setTranscript(spokenText);
        await handleVoiceQuery(spokenText);
      };

      recognition.onerror = (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Keyboard Push-To-Talk: Hold Spacebar (when not typing in an input/textarea)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Trigger only if space is held outside of text inputs
      if (
        e.code === "Space" &&
        !isListening &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(e.target?.tagName) &&
        !e.target?.isContentEditable
      ) {
        e.preventDefault();
        startListening();
      }
    };

    const handleKeyUp = (e) => {
      if (
        e.code === "Space" &&
        isListening &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(e.target?.tagName) &&
        !e.target?.isContentEditable
      ) {
        e.preventDefault();
        stopListening();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isListening]);

  const startListening = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsListening(true);
    try {
      recognitionRef.current?.start();
    } catch (e) {
      // Handle cases where recognition is already active
    }
  };

  const stopListening = () => {
    setIsListening(false);
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // ignore
    }
  };

  // Query API & speak response aloud
  const handleVoiceQuery = async (query) => {
    if (!query || !query.trim()) return;

    // If an external chat injector callback is provided, forward it to the conversation too
    if (onVoiceMessage) {
      onVoiceMessage(query);
      return;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "auto",
          messages: [
            {
              role: "system",
              content:
                "You are Lewis, a personal voice assistant. Respond in 1 to 2 crisp, natural sentences suitable for spoken audio.",
            },
            { role: "user", content: query },
          ],
        }),
      });

      const rawText = await res.text();
      // Extract content from SSE data chunks if returned as stream
      let fullText = "";
      if (rawText.includes("data: ")) {
        const lines = rawText.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const parsed = JSON.parse(line.replace("data: ", ""));
              const chunk = parsed.choices?.[0]?.delta?.content || "";
              fullText += chunk;
            } catch {
              // ignore
            }
          }
        }
      } else {
        fullText = rawText;
      }

      const cleanText = fullText.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/[*_#`]/g, "").trim();

      // Native Web Speech Synthesis (Siri voice reply)
      if ("speechSynthesis" in window && cleanText) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        // Prefer natural system voices if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) => v.name.includes("Natural") || v.name.includes("Google UK English Male") || v.name.includes("Samantha") || v.lang.startsWith("en")
        );
        if (preferredVoice) utterance.voice = preferredVoice;

        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error("Voice query failed:", err);
      setIsSpeaking(false);
    }
  };

  const isActive = isListening || isSpeaking;

  return (
    <div
      className={`lewis-voice-frame-root ${isActive ? "siri-border-active" : ""}`}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        transition: "all 0.3s ease",
      }}
    >
      {/* Siri Ambient Screen Corner Wash */}
      {isActive && <div className="siri-corner-wash" />}

      {/* Main App Content */}
      {children}

      {/* Floating Push-to-Talk HUD */}
      <div className="voice-hud-wrap">
        {isActive && (
          <div className="voice-status-pill">
            {isListening ? (
              <>
                <span className="pulse-dot" />
                <span>Listening... (Space)</span>
              </>
            ) : (
              <>
                <Volume2 size={14} style={{ color: "#34d399", animation: "pulseDot 1.2s infinite alternate" }} />
                <span>Lewis Speaking...</span>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onMouseDown={startListening}
          onMouseUp={stopListening}
          onTouchStart={startListening}
          onTouchEnd={stopListening}
          className={`voice-hud-btn ${isListening ? "active" : "idle"}`}
          title="Hold to talk to Lewis (or hold Spacebar outside inputs)"
          aria-label="Push to Talk"
        >
          <Mic size={20} className={isListening ? "animate-bounce" : ""} />
        </button>
      </div>
    </div>
  );
}
