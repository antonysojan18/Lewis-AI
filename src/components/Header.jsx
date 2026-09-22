import React from 'react';
import { 
  Menu, 
  Settings2,
  Swords,
  MessageSquare
} from 'lucide-react';

export default function Header({
  onOpenSettings,
  isSidebarOpen,
  onToggleSidebar,
  isArenaMode = false,
  onToggleArena,
}) {
  return (
    <header className="topbar">
      <div className="brand-cluster">
        <button 
          className="icon-button" 
          aria-label="Toggle sidebar" 
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <Menu />
        </button>
        <div className="brand-title-wrap">
          <img src="/Lion.png" alt="Lion Logo" className="brand-logo-img" />
          <div className="brand-text-col">
            <span className="brand-name">LEWIS</span>
            <span className="brand-byline">Powered By Tony</span>
          </div>
        </div>
      </div>

      <div className="top-actions">
        {/* Arena Mode Switcher */}
        <button
          type="button"
          className={`arena-nav-btn ${isArenaMode ? 'active' : ''}`}
          onClick={onToggleArena}
          title={isArenaMode ? "Back to Chat Canvas" : "Open Split Model Arena (Duel Mode)"}
        >
          {isArenaMode ? <MessageSquare size={13} /> : <Swords size={13} />}
          <span>{isArenaMode ? 'Exit Arena' : 'Split Arena'}</span>
        </button>

        <button 
          className="icon-button" 
          aria-label="Settings" 
          onClick={onOpenSettings}
          title="Platform Settings"
        >
          <Settings2 />
        </button>
      </div>
    </header>
  );
}
