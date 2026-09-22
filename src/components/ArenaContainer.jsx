import React, { useState, useRef, useEffect } from 'react';
import { 
  Swords, 
  Sparkles, 
  Zap, 
  Trophy, 
  RotateCcw, 
  Gauge, 
  Check, 
  Cpu, 
  Clock,
  ArrowUp,
  CircleStop,
  Wand2,
  Mic
} from 'lucide-react';
import { ALL_MODELS, getModelById } from '../models/nvidiaModels';
import ChatMessage from './ChatMessage';
import { marked } from 'marked';

export default function ArenaContainer({
  onSelectWinner,
  isCaveman = false,
  onToggleCaveman,
  onOpenModelSelector,
  onOpenArtifact,
}) {
  const [modelA, setModelA] = useState('antigravity/claude-sonnet-5');
  const [modelB, setModelB] = useState('deepseek-ai/deepseek-v4.1-flash');

  const [input, setInput] = useState('');
  const [isFighting, setIsFighting] = useState(false);

  const [responseA, setResponseA] = useState({ content: '', tokens: 0, ttft: 0, tokPerSec: 0, isStreaming: false, done: false });
  const [responseB, setResponseB] = useState({ content: '', tokens: 0, ttft: 0, tokPerSec: 0, isStreaming: false, done: false });

  const [winner, setWinner] = useState(null); // 'A' | 'B' | null

  const abortA = useRef(null);
  const abortB = useRef(null);

  const modelObjA = getModelById(modelA);
  const modelObjB = getModelById(modelB);

  const handleStartDuel = async () => {
    const prompt = input.trim();
    if (!prompt || isFighting) return;

    setWinner(null);
    setIsFighting(true);

    setResponseA({ content: '', tokens: 0, ttft: 0, tokPerSec: 0, isStreaming: true, done: false });
    setResponseB({ content: '', tokens: 0, ttft: 0, tokPerSec: 0, isStreaming: true, done: false });

    abortA.current = new AbortController();
    abortB.current = new AbortController();

    const streamModel = async (modelId, isSideA) => {
      const startTime = performance.now();
      let firstTokenTime = null;
      let fullText = '';
      let tokenCount = 0;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: prompt }],
            caveman: isCaveman,
            mode: 'chat',
          }),
          signal: isSideA ? abortA.current.signal : abortB.current.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':') || trimmed === 'data: [DONE]') continue;

            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const delta = parsed.choices?.[0]?.delta;
                const textChunk = delta?.content || delta?.reasoning_content || delta?.text || parsed.choices?.[0]?.text || '';

                if (textChunk) {
                  if (!firstTokenTime) {
                    firstTokenTime = performance.now();
                  }
                  fullText += textChunk;
                  tokenCount++;

                  const elapsedSec = (performance.now() - startTime) / 1000;
                  const currentTps = elapsedSec > 0 ? (tokenCount / elapsedSec).toFixed(1) : 0;
                  const ttftMs = firstTokenTime ? Math.round(firstTokenTime - startTime) : 0;

                  const updater = {
                    content: fullText,
                    tokens: tokenCount,
                    ttft: ttftMs,
                    tokPerSec: parseFloat(currentTps),
                    isStreaming: true,
                    done: false,
                  };

                  if (isSideA) setResponseA(updater);
                  else setResponseB(updater);
                }
              } catch {}
            }
          }
        }

        const totalElapsedSec = (performance.now() - startTime) / 1000;
        const finalTps = totalElapsedSec > 0 ? (tokenCount / totalElapsedSec).toFixed(1) : 0;

        const finalUpdate = {
          content: fullText,
          tokens: tokenCount,
          ttft: firstTokenTime ? Math.round(firstTokenTime - startTime) : 0,
          tokPerSec: parseFloat(finalTps),
          isStreaming: false,
          done: true,
        };

        if (isSideA) setResponseA(finalUpdate);
        else setResponseB(finalUpdate);

      } catch (err) {
        if (err.name !== 'AbortError') {
          const errUpdate = {
            content: `⚠️ Error: ${err.message}`,
            tokens: 0,
            ttft: 0,
            tokPerSec: 0,
            isStreaming: false,
            done: true,
          };
          if (isSideA) setResponseA(errUpdate);
          else setResponseB(errUpdate);
        }
      }
    };

    await Promise.allSettled([
      streamModel(modelA, true),
      streamModel(modelB, false),
    ]);

    setIsFighting(false);
  };

  const handleStop = () => {
    abortA.current?.abort();
    abortB.current?.abort();
    setIsFighting(false);
  };

  const handlePickWinner = (side) => {
    setWinner(side);
    const winningContent = side === 'A' ? responseA.content : responseB.content;
    const winningModel = side === 'A' ? modelA : modelB;
    if (onSelectWinner && winningContent) {
      onSelectWinner({
        prompt: input,
        response: winningContent,
        modelId: winningModel,
      });
    }
  };

  return (
    <div className="arena-wrapper">
      {/* Arena Head Info */}
      <div className="arena-header">
        <div className="arena-badge">
          <Swords size={15} />
          <span>LEWIS MULTI-MODEL ARENA</span>
        </div>
        <h2>Side-by-Side Model Duel & Speed Benchmarking</h2>
        <p>Send a prompt concurrently to two foundation models and compare speed, reasoning, and depth.</p>
      </div>

      {/* Dual Arena Columns */}
      <div className="arena-grid">
        {/* Model Column A */}
        <div className={`arena-card ${winner === 'A' ? 'winner' : ''}`}>
          <div className="arena-card-top">
            <div className="arena-model-picker">
              <span className="arena-side-tag">MODEL A</span>
              <select 
                value={modelA} 
                onChange={(e) => setModelA(e.target.value)}
                disabled={isFighting}
              >
                {ALL_MODELS.map(m => (
                  <option key={`a_${m.id}`} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

            {responseA.done && (
              <button 
                type="button" 
                className={`winner-btn ${winner === 'A' ? 'active' : ''}`}
                onClick={() => handlePickWinner('A')}
              >
                <Trophy size={13} />
                <span>{winner === 'A' ? 'Selected Winner' : 'Pick Winner'}</span>
              </button>
            )}
          </div>

          {/* Telemetry Bar */}
          <div className="arena-telemetry">
            <div className="metric">
              <Gauge size={12} />
              <span>Speed: <strong>{responseA.tokPerSec} tok/s</strong></span>
            </div>
            <div className="metric">
              <Clock size={12} />
              <span>TTFT: <strong>{responseA.ttft} ms</strong></span>
            </div>
            <div className="metric">
              <Zap size={12} />
              <span>Tokens: <strong>{responseA.tokens}</strong></span>
            </div>
          </div>

          {/* Output Content */}
          <div className="arena-response-body">
            {responseA.content ? (
              <div 
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: marked.parse(responseA.content) }}
              />
            ) : responseA.isStreaming ? (
              <span className="streaming-cursor" />
            ) : (
              <div className="arena-placeholder">Awaiting prompt submission...</div>
            )}
          </div>
        </div>

        {/* Model Column B */}
        <div className={`arena-card ${winner === 'B' ? 'winner' : ''}`}>
          <div className="arena-card-top">
            <div className="arena-model-picker">
              <span className="arena-side-tag">MODEL B</span>
              <select 
                value={modelB} 
                onChange={(e) => setModelB(e.target.value)}
                disabled={isFighting}
              >
                {ALL_MODELS.map(m => (
                  <option key={`b_${m.id}`} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

            {responseB.done && (
              <button 
                type="button" 
                className={`winner-btn ${winner === 'B' ? 'active' : ''}`}
                onClick={() => handlePickWinner('B')}
              >
                <Trophy size={13} />
                <span>{winner === 'B' ? 'Selected Winner' : 'Pick Winner'}</span>
              </button>
            )}
          </div>

          {/* Telemetry Bar */}
          <div className="arena-telemetry">
            <div className="metric">
              <Gauge size={12} />
              <span>Speed: <strong>{responseB.tokPerSec} tok/s</strong></span>
            </div>
            <div className="metric">
              <Clock size={12} />
              <span>TTFT: <strong>{responseB.ttft} ms</strong></span>
            </div>
            <div className="metric">
              <Zap size={12} />
              <span>Tokens: <strong>{responseB.tokens}</strong></span>
            </div>
          </div>

          {/* Output Content */}
          <div className="arena-response-body">
            {responseB.content ? (
              <div 
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: marked.parse(responseB.content) }}
              />
            ) : responseB.isStreaming ? (
              <span className="streaming-cursor" />
            ) : (
              <div className="arena-placeholder">Awaiting prompt submission...</div>
            )}
          </div>
        </div>
      </div>

      {/* Arena Floating Composer */}
      <div className="arena-composer">
        <div className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleStartDuel();
              }
            }}
            placeholder="Enter a prompt to duel both models concurrently (e.g. Solve a hard DP algorithm, write a thesis outline)..."
            rows={2}
          />
          <div className="composer-actions">
            {/* Caveman Toggle */}
            <button
              type="button"
              onClick={onToggleCaveman}
              className={`caveman-toggle-btn ${isCaveman ? 'active' : ''}`}
              title="Caveman Mode: Cut output tokens by ~65%"
            >
              <span className="caveman-icon">🦴</span>
              <span>{isCaveman ? 'Caveman ON' : 'Caveman'}</span>
            </button>

            <span className="composer-hint">Shift + Enter for new line</span>

            <button
              type="button"
              className="send-button"
              onClick={isFighting ? handleStop : handleStartDuel}
              disabled={!isFighting && !input.trim()}
              title={isFighting ? "Stop Duel" : "Start Duel"}
            >
              {isFighting ? <CircleStop /> : <Swords size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
