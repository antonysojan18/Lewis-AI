import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import ArtifactsCanvas from './components/ArtifactsCanvas';
import ArenaContainer from './components/ArenaContainer';
import ModelSelectorModal from './components/ModelSelectorModal';
import SettingsModal from './components/SettingsModal';
import { DEFAULT_MODEL_ID, updateDynamicModels, getModelById } from './models/nvidiaModels';

const DEFAULT_SYSTEM_PROMPT = 'You are Lewis, a sharp, focused, and adaptable AI collaborator powered by NVIDIA NIM, OmniRoute, Groq, and OpenRouter foundation models. Provide clear, accurate answers, format code in proper markdown, and use precision and clarity.';

export default function App() {
  const [intro, setIntro] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [initialModalCategory, setInitialModalCategory] = useState('All');
  const [activeWorkspaceMode, setActiveWorkspaceMode] = useState('chat');
  
  // Flagship Feature States: Arena & Artifacts Canvas
  const [isArenaMode, setIsArenaMode] = useState(false);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState(null);

  // Settings
  const [activeModelId, setActiveModelId] = useState(() => localStorage.getItem('lewis_active_model') || DEFAULT_MODEL_ID);
  const [isCaveman, setIsCaveman] = useState(() => localStorage.getItem('lewis_caveman_mode') === 'true');
  const [systemPrompt, setSystemPrompt] = useState(() => localStorage.getItem('lewis_system_prompt') || DEFAULT_SYSTEM_PROMPT);
  const [temperature, setTemperature] = useState(() => parseFloat(localStorage.getItem('lewis_temperature') || '0.7'));
  const [maxTokens, setMaxTokens] = useState(() => parseInt(localStorage.getItem('lewis_max_tokens') || '4096', 10));

  // Chat sessions
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('lewis_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const abortControllerRef = useRef(null);

  // Fetch all 82+ models from OmniRoute gateway on load
  useEffect(() => {
    fetch('/api/models')
      .then((res) => res.json())
      .then((data) => {
        if (data.models?.length) {
          updateDynamicModels(data.models);
        }
      })
      .catch((err) => console.log('OmniRoute gateway notice:', err.message));
  }, []);

  // Luxurious slow cinematic intro transition timer (1.8s hold before smooth glide)
  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('lewis_active_model', activeModelId);
  }, [activeModelId]);

  useEffect(() => {
    localStorage.setItem('lewis_caveman_mode', isCaveman.toString());
  }, [isCaveman]);

  useEffect(() => {
    localStorage.setItem('lewis_system_prompt', systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    localStorage.setItem('lewis_temperature', temperature.toString());
  }, [temperature]);

  useEffect(() => {
    localStorage.setItem('lewis_max_tokens', maxTokens.toString());
  }, [maxTokens]);

  useEffect(() => {
    localStorage.setItem('lewis_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Active messages
  const currentSession = sessions.find(s => s.id === activeSessionId) || null;
  const currentMessages = currentSession ? currentSession.messages : [];

  const handleNewChat = () => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
    const newId = `session_${Date.now()}`;
    const newSession = {
      id: newId,
      title: 'New Conversation',
      modelId: activeModelId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setInput('');
  };

  const handleSelectSession = (id) => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
    setActiveSessionId(id);
    const target = sessions.find(s => s.id === id);
    if (target?.modelId) {
      setActiveModelId(target.modelId);
    }
  };

  const handleDeleteSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  };

  const handleRenameSession = (id, newTitle) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const handleClearAllSessions = () => {
    setSessions([]);
    setActiveSessionId(null);
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Chat transmission logic
  const handleSendMessage = async (textToSend, mode = 'chat') => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isStreaming) return;

    let targetSessionId = activeSessionId;
    let updatedSessions = [...sessions];

    if (!targetSessionId || !sessions.some(s => s.id === targetSessionId)) {
      targetSessionId = `session_${Date.now()}`;
      const newSession = {
        id: targetSessionId,
        title: messageText.slice(0, 30) + (messageText.length > 30 ? '...' : ''),
        modelId: activeModelId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedSessions = [newSession, ...updatedSessions];
      setActiveSessionId(targetSessionId);
    } else {
      updatedSessions = updatedSessions.map(s => {
        if (s.id === targetSessionId && (s.messages.length === 0 || s.title === 'New Conversation')) {
          return {
            ...s,
            title: messageText.slice(0, 30) + (messageText.length > 30 ? '...' : ''),
            modelId: activeModelId,
          };
        }
        return s;
      });
    }

    const userMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: messageText,
      mode: mode,
      timestamp: new Date().toISOString(),
    };

    const isMediaMode = mode === 'image' || mode === 'video';

    const assistantPlaceholder = {
      id: `msg_asst_${Date.now()}`,
      role: 'assistant',
      type: isMediaMode ? mode : undefined,
      prompt: isMediaMode ? messageText : undefined,
      mediaUrl: isMediaMode ? null : undefined, // Signals progressive synthetic animation to start
      content: '',
      model: activeModelId,
      mode: mode,
      timestamp: new Date().toISOString(),
    };

    updatedSessions = updatedSessions.map(s => {
      if (s.id === targetSessionId) {
        return {
          ...s,
          updatedAt: new Date().toISOString(),
          messages: [...s.messages, userMessage, assistantPlaceholder],
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    setInput('');
    setIsStreaming(true);

    const activeSess = updatedSessions.find(s => s.id === targetSessionId);
    const history = (activeSess?.messages || [])
      .slice(0, -1)
      .map(m => ({ role: m.role, content: m.content }));

    const payloadMessages = [];
    if (systemPrompt && systemPrompt.trim()) {
      payloadMessages.push({ role: 'system', content: systemPrompt.trim() });
    }
    payloadMessages.push(...history);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Direct JSON handling for Image & Video Generation mode
    if (isMediaMode) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            model: activeModelId,
            messages: payloadMessages,
            mode: mode,
            temperature,
            max_tokens: maxTokens,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
          const errorMessage = errorData.error || `Server responded with status ${response.status}`;

          setSessions(prev => prev.map(s => {
            if (s.id === targetSessionId) {
              const msgs = [...s.messages];
              const lastIdx = msgs.length - 1;
              msgs[lastIdx] = {
                ...msgs[lastIdx],
                mediaUrl: null,
                content: `⚠️ **Error generating media:**\n\n> ${errorMessage}`,
              };
              return { ...s, messages: msgs };
            }
            return s;
          }));
          setIsStreaming(false);
          return;
        }

        const data = await response.json();
        const resolvedUrl = data.imageUrl || data.videoUrl || null;

        setSessions(prev => prev.map(s => {
          if (s.id === targetSessionId) {
            const msgs = [...s.messages];
            const lastIdx = msgs.length - 1;
            if (lastIdx >= 0) {
              msgs[lastIdx] = {
                ...msgs[lastIdx],
                mediaUrl: resolvedUrl,
              };
            }
            return { ...s, messages: msgs };
          }
          return s;
        }));
      } catch (err) {
        if (err.name !== 'AbortError') {
          setSessions(prev => prev.map(s => {
            if (s.id === targetSessionId) {
              const msgs = [...s.messages];
              const lastIdx = msgs.length - 1;
              msgs[lastIdx] = {
                ...msgs[lastIdx],
                content: `⚠️ **Generation Error:** ${err.message}`,
              };
              return { ...s, messages: msgs };
            }
            return s;
          }));
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: activeModelId,
          messages: payloadMessages,
          mode: mode,
          caveman: isCaveman,
          temperature: isCaveman ? 0.3 : temperature,
          max_tokens: maxTokens,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        const errorMessage = errorData.error || `Server responded with status ${response.status}`;

        setSessions(prev => prev.map(s => {
          if (s.id === targetSessionId) {
            const msgs = [...s.messages];
            const lastIdx = msgs.length - 1;
            msgs[lastIdx] = {
              ...msgs[lastIdx],
              content: `⚠️ **Error communicating with provider:**\n\n> ${errorMessage}\n\nPlease verify model availability in [Settings].`,
            };
            return { ...s, messages: msgs };
          }
          return s;
        }));
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedContent = '';
      let accumulatedUsage = null;
      let buffer = '';
      let renderFrameId = null;

      const scheduleRender = () => {
        if (renderFrameId !== null) return;
        renderFrameId = requestAnimationFrame(() => {
          renderFrameId = null;
          const currentText = accumulatedContent;
          const currentUsage = accumulatedUsage;
          setSessions(prev => prev.map(s => {
            if (s.id === targetSessionId) {
              const msgs = [...s.messages];
              const lastIdx = msgs.length - 1;
              if (lastIdx >= 0) {
                msgs[lastIdx] = {
                  ...msgs[lastIdx],
                  content: currentText,
                  usage: currentUsage || msgs[lastIdx].usage,
                };
              }
              return { ...s, messages: msgs };
            }
            return s;
          }));
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.usage) {
                accumulatedUsage = parsed.usage;
                scheduleRender();
              }
              const delta = parsed.choices?.[0]?.delta;
              const textChunk = delta?.content || delta?.reasoning_content || delta?.text || parsed.choices?.[0]?.text || '';

              if (textChunk) {
                accumulatedContent += textChunk;
                scheduleRender();
              }
            } catch {}
          }
        }
      }

      // Final flush
      if (renderFrameId !== null) {
        cancelAnimationFrame(renderFrameId);
        renderFrameId = null;
      }
      setSessions(prev => prev.map(s => {
        if (s.id === targetSessionId) {
          const msgs = [...s.messages];
          const lastIdx = msgs.length - 1;
          if (lastIdx >= 0) {
            msgs[lastIdx] = {
              ...msgs[lastIdx],
              content: accumulatedContent,
              usage: accumulatedUsage || msgs[lastIdx].usage,
            };
          }
          return { ...s, messages: msgs };
        }
        return s;
      }));
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSessions(prev => prev.map(s => {
          if (s.id === targetSessionId) {
            const msgs = [...s.messages];
            const lastIdx = msgs.length - 1;
            msgs[lastIdx] = {
              ...msgs[lastIdx],
              content: `⚠️ **Connection Error:** ${err.message}`,
            };
            return { ...s, messages: msgs };
          }
          return s;
        }));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = (msgIndex) => {
    if (!currentSession || isStreaming) return;
    const targetUserMessage = currentSession.messages[msgIndex - 1];
    if (!targetUserMessage || targetUserMessage.role !== 'user') return;

    const trimmedMessages = currentSession.messages.slice(0, msgIndex - 1);
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: trimmedMessages } : s));

    setTimeout(() => {
      handleSendMessage(targetUserMessage.content, targetUserMessage.mode || 'chat');
    }, 50);
  };

  const handleOpenModelSelector = (category) => {
    const modeToCategoryMap = {
      chat: 'Chat',
      academic: 'Academics',
      reasoning: 'Reasoning',
      code: 'Coding',
      image: 'Image',
      video: 'Video',
    };
    const targetCat = category || modeToCategoryMap[activeWorkspaceMode] || 'All';
    setInitialModalCategory(targetCat);
    setIsModelModalOpen(true);
  };

  const handleSelectModel = (modelId) => {
    setActiveModelId(modelId);
  };

  const handleOpenArtifact = (artifact) => {
    setActiveArtifact(artifact);
    setIsCanvasOpen(true);
  };

  const handleSelectArenaWinner = ({ prompt, response, modelId }) => {
    setIsArenaMode(false);
    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      targetSessionId = `session_${Date.now()}`;
      setActiveSessionId(targetSessionId);
    }
    const userMsg = { id: `msg_${Date.now()}_u`, role: 'user', content: prompt, timestamp: new Date().toISOString() };
    const asstMsg = { id: `msg_${Date.now()}_a`, role: 'assistant', content: response, model: modelId, timestamp: new Date().toISOString() };
    setSessions(prev => {
      const exists = prev.some(s => s.id === targetSessionId);
      if (!exists) {
        return [{ id: targetSessionId, title: prompt.slice(0, 30), modelId, messages: [userMsg, asstMsg], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev];
      }
      return prev.map(s => s.id === targetSessionId ? { ...s, messages: [...s.messages, userMsg, asstMsg] } : s);
    });
  };

  return (
    <main className={`lewis-shell mode-${activeWorkspaceMode} ${intro ? 'intro-mode' : 'intro-settled'} ${isCanvasOpen ? 'canvas-active' : ''}`}>
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="grid-noise" />

      {/* Top Navigation */}
      <Header
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isArenaMode={isArenaMode}
        onToggleArena={() => setIsArenaMode(prev => !prev)}
      />

      <div className="workspace">
        {/* Session Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onCloseSidebar={() => setIsSidebarOpen(false)}
        />

        {/* Split Model Arena (Duel Mode) OR Main Chat Canvas */}
        {isArenaMode ? (
          <ArenaContainer
            onSelectWinner={handleSelectArenaWinner}
            isCaveman={isCaveman}
            onToggleCaveman={() => setIsCaveman(prev => !prev)}
            onOpenModelSelector={handleOpenModelSelector}
            onOpenArtifact={handleOpenArtifact}
          />
        ) : (
          <ChatContainer
            messages={currentMessages}
            onSelectPrompt={(promptText) => handleSendMessage(promptText, 'chat')}
            onRegenerate={handleRegenerate}
            onOpenArtifact={handleOpenArtifact}
            isStreaming={isStreaming}
            input={input}
            setInput={setInput}
            onSend={(text, mode) => handleSendMessage(text, mode)}
            onStopStreaming={handleStopStreaming}
            activeModelId={activeModelId}
            activeWorkspaceMode={activeWorkspaceMode}
            onChangeWorkspaceMode={(mode) => setActiveWorkspaceMode(mode)}
            onOpenModelSelector={handleOpenModelSelector}
            onSelectModel={handleSelectModel}
            isCaveman={isCaveman}
            onToggleCaveman={() => setIsCaveman(prev => !prev)}
            isIntro={intro}
          />
        )}

        {/* Interactive Artifacts & Live Preview Canvas Pane */}
        <ArtifactsCanvas
          isOpen={isCanvasOpen}
          onClose={() => setIsCanvasOpen(false)}
          artifact={activeArtifact}
        />
      </div>

      {/* Model Selector Modal */}
      <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        activeModelId={activeModelId}
        onSelectModel={handleSelectModel}
        initialCategory={initialModalCategory}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        temperature={temperature}
        setTemperature={setTemperature}
        maxTokens={maxTokens}
        setMaxTokens={setMaxTokens}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        onClearAllSessions={handleClearAllSessions}
      />
    </main>
  );
}
