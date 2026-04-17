"use client";
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePortal } from '@/context/PortalContext';

interface MessageViewProps {
  darkMode: boolean;
}

const MessageView: React.FC<MessageViewProps> = ({ darkMode }) => {
  const { activeProject, chatMessage, setChatMessage, sendMessage, userRole } = usePortal();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeProject?.messages]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '2rem' }}>
         <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: darkMode ? '#fff' : '#000', margin: 0 }}>Direct Sync</h3>
         <p style={{ opacity: 0.5, color: darkMode ? '#fff' : '#000' }}>Direct line to the Algorium Creative Team.</p>
      </div>

      <div 
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '24px', background: darkMode ? 'rgba(255,255,255,0.01)' : '#fcfcfd', borderRadius: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}` }}
      >
        {activeProject?.messages?.length > 0 ? activeProject.messages.map((msg: any) => {
          const isMe = msg.sender !== 'Algorium Team' && userRole === 'client' || msg.sender === 'Algorium Team' && userRole === 'admin';
          return (
            <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ fontSize: '0.65rem', opacity: 0.4, marginBottom: '6px', color: darkMode ? '#fff' : '#000', padding: '0 8px' }}>{msg.sender} • {msg.date}</div>
              <div style={{ padding: '14px 22px', borderRadius: isMe ? '22px 22px 4px 22px' : '22px 22px 22px 4px', background: isMe ? '#FE532D' : (darkMode ? 'rgba(255,255,255,0.05)' : '#fff'), color: isMe ? '#fff' : (darkMode ? '#fff' : '#000'), border: isMe ? 'none' : `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, boxShadow: isMe ? '0 10px 20px rgba(254, 83, 45, 0.1)' : '0 2px 5px rgba(0,0,0,0.02)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {msg.text}
              </div>
            </div>
          );
        }) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2, flexDirection: 'column', gap: '15px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>Start a secure synchronization session.</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input 
          type="text" 
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyPress={(e: any) => e.key === 'Enter' && sendMessage()}
          placeholder="Sync your thoughts..." 
          style={{ flex: 1, padding: '18px 28px', borderRadius: '18px', background: darkMode ? 'rgba(255,255,255,0.05)' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: darkMode ? '#fff' : '#000', outline: 'none', fontSize: '1rem', transition: 'border-color 0.2s' }}
        />
        <button 
          onClick={sendMessage} 
          style={{ width: '58px', height: '58px', borderRadius: '18px', background: '#FE532D', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', boxShadow: '0 10px 20px rgba(254, 83, 45, 0.2)', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </motion.div>
  );
};

export default MessageView;
