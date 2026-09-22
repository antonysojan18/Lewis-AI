import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

export default function ChatContainer({
  messages,
  onSelectPrompt,
  onRegenerate,
  onOpenArtifact,
  isStreaming,
  input,
  setInput,
  onSend,
  onStopStreaming,
  activeModelId,
  activeWorkspaceMode,
  onChangeWorkspaceMode,
  onOpenModelSelector,
  onSelectModel,
  isCaveman,
  onToggleCaveman,
  isIntro,
}) {
  const scrollContainerRef = useRef(null);
  const scrollEndRef = useRef(null);

  // Auto-scroll inside the chat container without moving the page layout
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isStreaming]);

  const hasMessages = messages.length > 0;

  return (
    <section className={`chat-canvas ${hasMessages ? 'has-conversation' : 'is-home-stage'}`}>
      <div className="chat-scroll" ref={scrollContainerRef}>
        {!hasMessages ? (
          <div className={`welcome ${isIntro ? 'intro-active' : 'intro-settled'}`}>
            <h1 className="welcome-hero">
              <span>Hello, Its</span> <span className="brand-gradient">Lewis</span>
            </h1>
            <p className="welcome-copy">
              Hammer Time..?
            </p>
          </div>
        ) : (
          <div className="conversation">
            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              const isLastAssistant = isLastMessage && message.role === 'assistant';

              return (
                <ChatMessage
                  key={message.id || index}
                  message={message}
                  isStreaming={isLastAssistant && isStreaming}
                  onOpenArtifact={onOpenArtifact}
                  onRegenerate={
                    message.role === 'assistant' && !isStreaming
                      ? () => onRegenerate(index)
                      : undefined
                  }
                />
              );
            })}
            <div ref={scrollEndRef} style={{ height: 24 }} />
          </div>
        )}
      </div>

      {/* Floating Composer: Centered on Home, moves to bottom in conversation */}
      <ChatInput
        input={input}
        setInput={setInput}
        onSend={onSend}
        isStreaming={isStreaming}
        onStopStreaming={onStopStreaming}
        activeModelId={activeModelId}
        activeWorkspaceMode={activeWorkspaceMode}
        onChangeWorkspaceMode={onChangeWorkspaceMode}
        onOpenModelSelector={onOpenModelSelector}
        onSelectModel={onSelectModel}
        isCaveman={isCaveman}
        onToggleCaveman={onToggleCaveman}
        isCentered={!hasMessages}
      />
    </section>
  );
}
