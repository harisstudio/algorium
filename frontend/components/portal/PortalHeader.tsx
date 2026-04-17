"use client";
import React from 'react';
import { usePortal } from '@/context/PortalContext';

interface HeaderProps {
  darkMode: boolean;
}

const PortalHeader: React.FC<HeaderProps> = ({ darkMode }) => {
  const { activeTab, activeProject, userRole } = usePortal();

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, paddingBottom: '2.5rem' }}>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#FE532D', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          {activeTab.replace(' Space', '')}
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: darkMode ? '#fff' : '#000', margin: 0 }}>
          {activeProject?.company || 'Ecosystem'}
        </h1>
      </div>
      <div style={{ textAlign: 'right' }}>
        {userRole === 'admin' && (
          <div style={{ background: '#FE532D', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, marginBottom: '8px', display: 'inline-block' }}>
            SESSION: ADMIN
          </div>
        )}
        <div style={{ opacity: 0.5, fontSize: '0.8rem', color: darkMode ? '#fff' : '#000' }}>Synchronization Status</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginTop: '2px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#32d74b', boxShadow: '0 0 10px #32d74b' }} />
          <span style={{ color: darkMode ? '#fff' : '#000', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.05em' }}>ONLINE</span>
        </div>
      </div>
    </div>
  );
};

export default PortalHeader;
