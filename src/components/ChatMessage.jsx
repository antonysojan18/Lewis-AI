import React, { useState, useEffect, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  Zap,
  Volume2,
  VolumeX,
  Layers,
  Sparkles
} from 'lucide-react';
import { marked } from 'marked';
import Prism from 'prismjs';
import MediaGenerationCard from './MediaGenerationCard';
import { voiceAssistant } from '../utils/voiceAssistant';
import AudioVisualizer from './AudioVisualizer';

marked.setOptions({
  gfm: true,
  breaks: true,
});

export default function ChatMessage({
  message,
  onRegenerate,
  onOpenArtifact,
  isStreaming = false,
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isMedia = message.type === 'image' || message.type === 'video' || message.mediaUrl !== undefined;

  // Ensure content is parsed cleanly without blanking out responses with thinking tags
  const cleanContent = useMemo(() => {
    if (isUser || !message.content) return message.content || '';
    
    let text = message.content;
    if (text.includes('</think>')) {
      const parts = text.split('</think>');
      const postThink = parts.slice(1).join('</think>').trim();
      if (postThink) return postThink;
    }
    if (text.includes('<think>')) {
      const parts = text.split('<think>');
      const preThink = parts[0].trim();
      const insideThink = (parts[1] || '').trim();
      if (preThink) return preThink;
      if (insideThink) return insideThink;
    }
    return text.trimStart();
  }, [message.content, isUser]);

  // Extract artifact / code block for Live Canvas
  const extractedArtifact = useMemo(() => {
    if (!cleanContent || isUser) return null;
    const codeBlockMatch = cleanContent.match(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      const lang = (codeBlockMatch[1] || 'html').toLowerCase();
      const code = codeBlockMatch[2].trim();
      if (code.length > 20) {
        return {
          language: lang,
          code: code,
          title: lang.toUpperCase() + ' Code Component',
        };
      }
    }
    return null;
  }, [cleanContent, isUser]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanContent || message.content || message.prompt || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      voiceAssistant.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      voiceAssistant.speak(
        cleanContent,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        () => setIsSpeaking(false)
      );
    }
  };

  const renderedHtml = useMemo(() => {
    if (!cleanContent) return '';
    try {
      return marked.parse(cleanContent);
    } catch {
      return cleanContent;
    }
  }, [cleanContent]);

  useEffect(() => {
    if (!isUser) {
      Prism.highlightAll();
    }
  }, [renderedHtml]);

  if (isUser) {
    return (
      <div className="message user-message">
        <div className="message-label">
          You <span>{message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
        </div>
        <div className="user-bubble">{message.content}</div>
      </div>
    );
  }

  return (
    <div className="message assistant-message">
      {/* Real-time Synthetic Media Generation Card (Latent Diffusion / Video Rendering) */}
      {isMedia && (
        <MediaGenerationCard
          type={message.type || 'image'}
          prompt={message.prompt || message.content || 'Synthesizing visual scene'}
          mediaUrl={message.mediaUrl}
        />
      )}

      {/* Main Direct Answer */}
      {cleanContent ? (
        <div 
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      ) : (isStreaming && !isMedia) ? (
        <span className="streaming-cursor" />
      ) : null}

      {isStreaming && cleanContent && (
        <span className="streaming-cursor" />
      )}

      {/* Audio Waveform Narration Visualizer */}
      <AudioVisualizer isActive={isSpeaking} label="Lewis Voice Narration Active..." color="#34d399" />

      {!isStreaming && (
        <div className="response-actions">
          {message.usage?.total_tokens ? (
            <div 
              className="token-usage-badge" 
              title={`Prompt: ${message.usage.prompt_tokens?.toLocaleString() || 0} tokens • Output: ${message.usage.completion_tokens?.toLocaleString() || 0} tokens • Total: ${message.usage.total_tokens?.toLocaleString()} tokens`}
            >
              <Zap size={11} />
              <span>{message.usage.total_tokens.toLocaleString()} tokens</span>
            </div>
          ) : null}

          {/* Open in Live Canvas if code block exists */}
          {extractedArtifact && onOpenArtifact && (
            <button 
              type="button"
              className="canvas-trigger-btn"
              onClick={() => onOpenArtifact(extractedArtifact)}
              title="Open Live Preview & Sandbox in Canvas"
            >
              <Layers size={13} />
              <span>Open in Canvas</span>
            </button>
          )}

          {/* Text-to-Speech Narration */}
          <button 
            type="button"
            onClick={handleToggleSpeech} 
            title={isSpeaking ? "Stop Narration" : "Listen to Response"}
            className={isSpeaking ? "active-speech" : ""}
          >
            {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
          </button>

          <button type="button" onClick={handleCopy} title="Copy response">
            {copied ? <Check size={13} style={{ color: '#68cf9b' }} /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onRegenerate && (
            <button type="button" onClick={onRegenerate} title="Regenerate">
              <Zap size={13} />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
