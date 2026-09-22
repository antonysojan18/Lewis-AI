import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ChevronRight, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
  systemPrompt,
  setSystemPrompt,
  onClearAllSessions,
}) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState(null);

  if (!isOpen) return null;

  const handleTestKeys = async () => {
    setIsValidating(true);
    setValidationResults(null);

    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'all' }),
      });

      const data = await res.json();
      setValidationResults(data.results || {});
    } catch (err) {
      setValidationResults({ error: err.message });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal settings-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">WORKSPACE CONTROL</p>
            <h2>Platform settings</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        {/* Provider Connections Section */}
        <div className="settings-section">
          <div className="settings-title">
            <div>
              <h3>Provider connections</h3>
              <p>Keys are isolated on the backend and never exposed in the client.</p>
            </div>
            <button 
              className="outline-button" 
              onClick={handleTestKeys}
              disabled={isValidating}
            >
              {isValidating ? <RefreshCw className="spin-animate" size={12} /> : 'Check all connections'}
            </button>
          </div>

          {[
            { name: 'OmniRoute Local Gateway', key: 'omniroute', desc: 'Auto intelligent router & 82-model suite (localhost:20128)' },
            { name: 'NVIDIA NIM', key: 'nvidia', desc: 'DeepSeek V4.1, Llama 3.2 11B, Diffusion Gemma' },
            { name: 'OpenRouter (Free Tier)', key: 'openrouter', desc: 'Nemotron 3.5, Ling 3.0, Nex Mini, Qwen 3.8' },
            { name: 'Groq Cloud', key: 'groq', desc: 'Ultra-Fast LPUs' }
          ].map((provider) => {
            const result = validationResults ? validationResults[provider.key] : null;
            return (
              <div className="connection-row" key={provider.name}>
                <span className="connection-logo" style={{ color: 'var(--yellow)' }}>
                  <Sparkles />
                </span>
                <div>
                  <strong>{provider.name}</strong>
                  <span style={{ display: 'block', fontSize: 10, color: 'var(--muted)' }}>{provider.desc}</span>
                </div>
                <span className="connection-status">
                  {result ? (
                    result.valid ? (
                      <span style={{ color: '#68cf9b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i /> Connected (200 OK)
                      </span>
                    ) : (
                      <span style={{ color: '#e57d87', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={12} /> {result.error || 'Failed'}
                      </span>
                    )
                  ) : (
                    <>
                      <i /> Configured in .env
                    </>
                  )}
                </span>
                <ChevronRight />
              </div>
            );
          })}
        </div>

        {/* Inference Profile Section */}
        <div className="settings-section">
          <div className="settings-title">
            <div>
              <h3>Inference profile</h3>
              <p>Shape how Lewis thinks and responds.</p>
            </div>
          </div>

          <label>
            Temperature <span>{temperature}</span>
            <input 
              type="range" 
              min="0" 
              max="1.5" 
              step="0.05" 
              value={temperature} 
              onChange={(e) => setTemperature(parseFloat(e.target.value))} 
            />
          </label>

          <label>
            Max output tokens <span>{maxTokens}</span>
            <input 
              type="range" 
              min="256" 
              max="8192" 
              step="256" 
              value={maxTokens} 
              onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))} 
            />
          </label>
        </div>

        {/* System Prompt Customization */}
        <div className="settings-section">
          <div className="settings-title">
            <div>
              <h3>System instructions</h3>
              <p>Custom persona and tone rules for Lewis.</p>
            </div>
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: '10px 12px',
              color: '#fff',
              outline: 0,
              fontSize: 12,
              fontFamily: 'var(--font-sans)',
              resize: 'none',
              marginTop: 4
            }}
          />
        </div>

        <button 
          className="danger-button"
          onClick={() => {
            if (window.confirm('Are you sure you want to clear all chat histories?')) {
              onClearAllSessions();
              onClose();
            }
          }}
        >
          <Trash2 /> Clear all chat histories
        </button>
      </div>
    </div>
  );
}
