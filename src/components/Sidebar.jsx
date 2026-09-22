import React, { useState } from 'react';
import { 
  MessageSquarePlus, 
  Search, 
  MoreHorizontal, 
  PanelLeftClose, 
  Trash2, 
  Edit3, 
  Check, 
  X 
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onCloseSidebar,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter(session =>
    (session.title || 'Untitled Chat').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (e, session) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title || 'Untitled Chat');
  };

  const saveEditing = (e, session) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(session.id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      <button className="new-conversation" onClick={onNewChat}>
        <MessageSquarePlus /> New conversation
      </button>

      <div className="sidebar-search">
        <Search />
        <input 
          placeholder="Search sessions" 
          aria-label="Search sessions" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <p className="eyebrow">Your sessions</p>

      <nav className="session-list">
        {filteredSessions.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 11, padding: '8px 10px' }}>
            {searchQuery ? 'No matching chats' : 'No saved sessions yet'}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                className={`session-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectSession(session.id)}
              >
                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEditing(e, session);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      style={{
                        flex: 1,
                        background: '#18191d',
                        border: '1px solid var(--line)',
                        color: '#fff',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontSize: 11
                      }}
                      autoFocus
                    />
                    <button 
                      onClick={e => saveEditing(e, session)} 
                      style={{ background: 'none', border: 'none', color: '#68cf9b', padding: 2 }}
                    >
                      <Check size={12} />
                    </button>
                    <button 
                      onClick={e => { e.stopPropagation(); setEditingId(null); }} 
                      style={{ background: 'none', border: 'none', color: '#e57d87', padding: 2 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span>{session.title || 'Untitled Chat'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        onClick={e => startEditing(e, session)}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', padding: 2 }}
                        title="Rename"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        style={{ background: 'none', border: 'none', color: '#e57d87', padding: 2 }}
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </nav>

      <div className="sidebar-foot">
        <span>
          <i /> All systems operational
        </span>
        <button onClick={onCloseSidebar} aria-label="Collapse sidebar" title="Collapse sidebar">
          <PanelLeftClose />
        </button>
      </div>
    </aside>
  );
}
