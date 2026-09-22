import React, { useRef, useEffect, useState } from 'react';
import { 
  ArrowUp, 
  CircleStop, 
  Cpu, 
  ChevronDown, 
  Paperclip, 
  X, 
  FileText, 
  Plus, 
  MessageSquare, 
  Brain, 
  GraduationCap, 
  Code2, 
  Image as ImageIcon, 
  Video,
  Wand2,
  Mic,
  MicOff,
  Sparkles,
  Table
} from 'lucide-react';
import { getModelById } from '../models/nvidiaModels';
import { parseUploadedFiles, buildFilePromptContext } from '../utils/fileParser';
import { voiceAssistant } from '../utils/voiceAssistant';
import AudioVisualizer from './AudioVisualizer';

export const WORKSPACE_MODES = [
  { 
    id: 'chat', 
    label: 'Chat', 
    category: 'Chat',
    desc: 'Fast everyday conversation & quick answers', 
    icon: MessageSquare,
    color: '#34d399', // Emerald
    defaultModelId: 'auto',
    placeholder: 'Ask Lewis anything...'
  },
  { 
    id: 'academic', 
    label: 'Academics', 
    category: 'Academics',
    desc: 'Essays, research papers, thesis & assignment writing', 
    icon: GraduationCap,
    color: '#E5C378', // Gold
    defaultModelId: 'antigravity/claude-sonnet-4-6',
    placeholder: 'Paste assignment rubric, research question, essay prompt, or thesis topic...'
  },
  { 
    id: 'reasoning', 
    label: 'Thinking & Logic', 
    category: 'Reasoning',
    desc: 'Deep multi-step reasoning, math & formal proofs', 
    icon: Brain,
    color: '#c084fc', // Purple
    defaultModelId: 'antigravity/gemini-2.5-pro',
    placeholder: 'Enter a complex math problem, logic puzzle, or multi-step analysis...'
  },
  { 
    id: 'code', 
    label: 'Code Copilot', 
    category: 'Coding',
    desc: 'Architecture, algorithms, debugging & syntax', 
    icon: Code2,
    color: '#60a5fa', // Blue
    defaultModelId: 'antigravity/claude-sonnet-5',
    placeholder: 'Describe feature to build, bug to diagnose, or code to refactor...'
  },
  { 
    id: 'image', 
    label: 'Image Generation', 
    category: 'Image',
    desc: 'Text-to-image synthesis with Flux/SD/Sana', 
    icon: ImageIcon,
    color: '#fbbf24', // Amber
    defaultModelId: 'black-forest-labs/flux-1-schnell',
    placeholder: 'Describe the visual scene, style, lighting, and composition...'
  },
  { 
    id: 'video', 
    label: 'Video Generation', 
    category: 'Video',
    desc: 'Cinematic AI video prompt engineering & motion', 
    icon: Video,
    color: '#f472b6', // Pink
    defaultModelId: 'kling/kling-v1.6-pro',
    placeholder: 'Describe cinematic scene, camera motion, and visual style...'
  },
];

export default function ChatInput({
  input,
  setInput,
  onSend,
  isStreaming,
  onStopStreaming,
  activeModelId,
  activeWorkspaceMode = 'chat',
  onChangeWorkspaceMode,
  onOpenModelSelector,
  onSelectModel,
  isCaveman = false,
  onToggleCaveman,
  isCentered = false,
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const popoverRef = useRef(null);

  const [attachedFiles, setAttachedFiles] = useState([]);
  const [localMode, setLocalMode] = useState('chat');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const activeMode = onChangeWorkspaceMode ? activeWorkspaceMode : localMode;
  const activeModel = getModelById(activeModelId);
  const currentCategory = WORKSPACE_MODES.find(c => c.id === activeMode) || WORKSPACE_MODES[0];
  const ActiveIcon = currentCategory.icon;

  const handleSelectMode = (modeObj) => {
    if (onChangeWorkspaceMode) {
      onChangeWorkspaceMode(modeObj.id);
    } else {
      setLocalMode(modeObj.id);
    }
    if (onSelectModel && modeObj.defaultModelId) {
      onSelectModel(modeObj.defaultModelId);
    }
    setMenuOpen(false);
  };

  const handleResetMode = () => {
    if (onChangeWorkspaceMode) {
      onChangeWorkspaceMode('chat');
    } else {
      setLocalMode('chat');
    }
    if (onSelectModel) {
      onSelectModel('auto');
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendWithAttachment();
    }
  };

  // Multi-File Upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const parsed = await parseUploadedFiles(files);
    setAttachedFiles(prev => [...prev, ...parsed]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (id) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Magic Wand Prompt Enhancer
  const handleEnhancePrompt = async () => {
    const currentText = input.trim();
    if (!currentText || isEnhancing) return;

    setIsEnhancing(true);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentText, mode: activeMode })
      });
      const data = await res.json();
      if (data.enhanced) {
        setInput(data.enhanced);
      }
    } catch (err) {
      console.warn('Enhance prompt failed:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Voice Dictation Toggle
  const handleToggleVoice = () => {
    if (isRecording) {
      voiceAssistant.stopListening();
      setIsRecording(false);
    } else {
      const started = voiceAssistant.startListening(
        (transcript, isFinal) => {
          setInput(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}` : transcript;
          });
        },
        (err) => {
          console.warn('Mic error:', err);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );
      setIsRecording(started);
    }
  };

  const handleSendWithAttachment = () => {
    if (isStreaming) return;
    let finalPrompt = input.trim();

    if (attachedFiles.length > 0) {
      const fileContext = buildFilePromptContext(attachedFiles);
      finalPrompt = `${fileContext}\n\n${finalPrompt}`;
      setAttachedFiles([]);
    }

    if (finalPrompt) {
      onSend(finalPrompt, activeMode);
    }
  };

  return (
    <div className={`composer-wrap ${isCentered ? 'center-mode' : 'bottom-mode'}`}>
      {/* Category Selection Popover */}
      {menuOpen && (
        <div className="mode-popover" ref={popoverRef}>
          <div className="mode-popover-header">
            <span>SELECT WORKSPACE MODE</span>
            <button 
              type="button" 
              className="mode-close-btn"
              onClick={() => setMenuOpen(false)}
            >
              <X size={13} />
            </button>
          </div>
          <div className="mode-popover-list">
            {WORKSPACE_MODES.map((cat) => {
              const IconComp = cat.icon;
              const isSelected = activeMode === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectMode(cat)}
                  className={`mode-option ${isSelected ? 'selected' : ''}`}
                >
                  <div className="mode-option-icon" style={{ color: cat.color }}>
                    <IconComp size={16} />
                  </div>
                  <div className="mode-option-info">
                    <div className="mode-option-label">{cat.label}</div>
                    <div className="mode-option-desc">{cat.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="composer">
        {/* Active Mode Pill Tag */}
        {activeMode !== 'chat' && (
          <div className="active-mode-pill" style={{ borderColor: `${currentCategory.color}40` }}>
            <ActiveIcon size={12} style={{ color: currentCategory.color }} />
            <span>{currentCategory.label}</span>
            <button 
              type="button" 
              onClick={handleResetMode} 
              className="remove-mode"
              title="Reset to Chat"
            >
              <X size={11} />
            </button>
          </div>
        )}

        {/* Multi-File Upload Chips Tray */}
        {attachedFiles.length > 0 && (
          <div className="attachment-tray">
            {attachedFiles.map(file => (
              <div key={file.id} className="attachment-chip">
                {file.type === 'dataset' ? <Table size={13} /> : <FileText size={13} />}
                <span className="attachment-name">{file.name}</span>
                <span className="attachment-size">{file.size}</span>
                <button 
                  type="button" 
                  className="remove-attachment" 
                  onClick={() => handleRemoveFile(file.id)} 
                  aria-label="Remove attachment"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Voice Recording Soundwave */}
        <AudioVisualizer isActive={isRecording} label="Listening to your speech..." color="#f87171" />

        <div className="composer-input-row">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening... speak now" : currentCategory.placeholder}
            rows={1}
            disabled={isStreaming}
          />

          {/* Magic Wand Prompt Enhancer Button */}
          {input.trim().length > 3 && !isStreaming && (
            <button
              type="button"
              className={`magic-wand-btn ${isEnhancing ? 'enhancing' : ''}`}
              onClick={handleEnhancePrompt}
              title="Enhance Prompt (AI Workspace Polish)"
              aria-label="Enhance Prompt"
            >
              <Wand2 size={14} />
            </button>
          )}
        </div>

        <div className="composer-actions">
          {/* '+' Category Menu Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className={`mode-trigger-btn ${menuOpen ? 'active' : ''}`}
            title="Switch Workspace Mode (Academics, Reasoning, Code, Image, Video)"
            aria-label="Switch Mode"
          >
            <Plus className={menuOpen ? 'rotated' : ''} />
          </button>

          {/* Multi-File Upload Button */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            multiple
            style={{ display: 'none' }} 
            id="file-upload-input"
          />
          <button
            type="button"
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload documents, PDFs, CSV datasets, or code files"
            aria-label="Upload files"
          >
            <Paperclip />
          </button>

          {/* Voice Microphone Input Button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`mic-button ${isRecording ? 'recording' : ''}`}
            title={isRecording ? "Stop voice dictation" : "Voice dictation (Speech-to-Text)"}
            aria-label="Voice input"
          >
            {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
          </button>

          {/* Caveman Mode Toggle Button */}
          <button
            type="button"
            onClick={onToggleCaveman}
            title="Caveman Mode: Telegraphic dense responses (~65% fewer tokens)"
            className={`caveman-toggle-btn ${isCaveman ? 'active' : ''}`}
            aria-label="Toggle Caveman Mode"
          >
            <span className="caveman-icon">🦴</span>
            <span>{isCaveman ? 'Caveman ON' : 'Caveman'}</span>
          </button>

          <button 
            type="button" 
            className="composer-model" 
            onClick={() => onOpenModelSelector && onOpenModelSelector(currentCategory.category)}
            title="Switch model"
          >
            <Cpu />
            <span>{activeModel.name}</span>
            <ChevronDown />
          </button>

          <span className="composer-hint">Shift + Enter for new line</span>

          <button
            type="button"
            className="send-button"
            onClick={isStreaming ? onStopStreaming : handleSendWithAttachment}
            disabled={!isStreaming && !input.trim() && attachedFiles.length === 0}
            aria-label={isStreaming ? "Stop generation" : "Send message"}
            title={isStreaming ? "Stop generating" : "Send message"}
          >
            {isStreaming ? <CircleStop /> : <ArrowUp />}
          </button>
        </div>
      </div>

      <p className="disclaimer">Lewis can make mistakes. Verify important information.</p>
    </div>
  );
}
