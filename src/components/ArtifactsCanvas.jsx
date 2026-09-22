import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Code, 
  Eye, 
  Copy, 
  Check, 
  Download, 
  Maximize2, 
  Minimize2, 
  RotateCw,
  Sparkles,
  Layers
} from 'lucide-react';
import Prism from 'prismjs';

export default function ArtifactsCanvas({
  isOpen,
  onClose,
  artifact,
}) {
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'code'
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const codeRef = useRef(null);

  const code = artifact?.code || '';
  const language = (artifact?.language || 'html').toLowerCase();
  const title = artifact?.title || 'Interactive Artifact';

  const isHtmlOrSvg = ['html', 'svg', 'xml'].includes(language) || code.trim().startsWith('<');
  const isMarkdown = ['md', 'markdown'].includes(language);

  // Auto-switch to code if preview not renderable as standalone HTML/SVG
  useEffect(() => {
    if (isOpen) {
      if (isHtmlOrSvg || isMarkdown) {
        setActiveTab('preview');
      } else {
        setActiveTab('code');
      }
    }
  }, [isOpen, artifact, isHtmlOrSvg, isMarkdown]);

  useEffect(() => {
    if (activeTab === 'code' && codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [activeTab, code, language, refreshKey]);

  const previewSrcDoc = useMemo(() => {
    if (!code) return '';
    if (isMarkdown) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #f4f4f5; background: #0c0d10; line-height: 1.6; }
            h1, h2, h3 { color: #fff; font-weight: 700; }
            code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; color: #e5c378; }
            pre { background: #181920; padding: 16px; border-radius: 8px; overflow-x: auto; }
          </style>
        </head>
        <body>${code}</body>
        </html>
      `;
    }
    if (language === 'svg' || code.trim().startsWith('<svg')) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; display: grid; place-items: center; min-height: 100vh; background: #0c0d10; }
            svg { max-width: 90vw; max-height: 90vh; height: auto; }
          </style>
        </head>
        <body>${code}</body>
        </html>
      `;
    }
    // Full interactive HTML/CSS/JS sandbox
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; background: #0c0d10; color: #ffffff; }
        </style>
      </head>
      <body>
        ${code}
      </body>
      </html>
    `;
  }, [code, language, isMarkdown, refreshKey]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extMap = {
      html: 'html',
      svg: 'svg',
      javascript: 'js',
      js: 'js',
      typescript: 'ts',
      ts: 'ts',
      python: 'py',
      py: 'py',
      markdown: 'md',
      md: 'md',
      json: 'json',
      css: 'css',
    };
    const ext = extMap[language] || 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lewis-artifact-${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <aside className={`artifacts-canvas ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Canvas Header */}
      <div className="canvas-header">
        <div className="canvas-title-group">
          <div className="canvas-badge">
            <Sparkles size={12} />
            <span>Artifact Canvas</span>
          </div>
          <h3 className="canvas-title">{title}</h3>
        </div>

        {/* Tab Switcher */}
        <div className="canvas-tabs">
          {(isHtmlOrSvg || isMarkdown) && (
            <button
              type="button"
              className={`canvas-tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <Eye size={13} />
              <span>Live Preview</span>
            </button>
          )}
          <button
            type="button"
            className={`canvas-tab ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            <Code size={13} />
            <span>Code</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="canvas-controls">
          {activeTab === 'preview' && (
            <button 
              type="button" 
              className="canvas-icon-btn" 
              onClick={() => setRefreshKey(k => k + 1)}
              title="Refresh Sandbox"
            >
              <RotateCw size={14} />
            </button>
          )}
          <button 
            type="button" 
            className="canvas-icon-btn" 
            onClick={handleCopy}
            title="Copy Code"
          >
            {copied ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
          </button>
          <button 
            type="button" 
            className="canvas-icon-btn" 
            onClick={handleDownload}
            title="Download File"
          >
            <Download size={14} />
          </button>
          <button 
            type="button" 
            className="canvas-icon-btn" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Expand"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button 
            type="button" 
            className="canvas-icon-btn close-btn" 
            onClick={onClose}
            title="Close Canvas"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Canvas Body */}
      <div className="canvas-body">
        {activeTab === 'preview' ? (
          <div className="canvas-preview-frame">
            <iframe
              key={refreshKey}
              title="Artifact Preview Sandbox"
              srcDoc={previewSrcDoc}
              sandbox="allow-scripts allow-modals allow-same-origin"
            />
          </div>
        ) : (
          <div className="canvas-code-frame">
            <pre className={`language-${language}`}>
              <code ref={codeRef} className={`language-${language}`}>
                {code}
              </code>
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
}
