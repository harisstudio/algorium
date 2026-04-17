"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortal } from '@/context/PortalContext';

interface SidebarProps {
  darkMode: boolean;
}

const PortalSidebar: React.FC<SidebarProps> = ({ darkMode }) => {
  const { activeTab, setActiveTab, userRole, handleLogout, activeProject, performAdminAction } = usePortal();
  const [showNewMenu, setShowNewMenu] = useState(false);

  const navItems = [
    { name: 'Overview', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { name: 'Drive Space', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
    { name: 'Invoices', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/></svg> },
    { name: 'Messages', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { name: 'Notes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { name: 'Settings', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1-2.83 0l-.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
    ...(userRole === 'admin' ? [{ name: 'Admin', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg> }] : [])
  ];

  return (
    <div style={{ width: '280px', height: '100vh', padding: '2.5rem 1.5rem', background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, display: 'flex', flexDirection: 'column', backdropFilter: 'blur(20px)', zIndex: 10 }}>
      <div style={{ marginBottom: '4rem', padding: '0 1rem' }}>
        <img src="/logo-black.png" alt="Algorium" style={{ height: '22px', filter: darkMode ? 'invert(1)' : 'none' }} />
      </div>

      <div style={{ position: 'relative', marginBottom: '3rem' }}>
        <button onClick={() => setShowNewMenu(!showNewMenu)} style={{ width: '100%', padding: '15px', background: '#FE532D', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(254, 83, 45, 0.2)', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          NEW ACTION
        </button>

        <AnimatePresence>
          {showNewMenu && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ position: 'absolute', top: '120%', left: 0, right: 0, background: darkMode ? '#1a1a1a' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '15px', padding: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', zIndex: 100 }}>
              {[
                { label: 'Upload Assets', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12' },
                { label: 'New Folder', icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' },
                { label: 'New Invoice', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', adminOnly: true }
              ].filter(i => !i.adminOnly || userRole === 'admin').map((item, idx) => (
                <div key={idx} onClick={() => { 
                  setShowNewMenu(false); 
                  if (item.label === 'New Invoice' && activeProject) performAdminAction(activeProject.id, 'invoice', { id: 'INV-NEW', amount: '£1,000', status: 'Pending', date: 'Just now' });
                  else alert(`${item.label} logic initialized.`);
                }} style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: darkMode ? '#fff' : '#000' }} className="hover-light">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FE532D" strokeWidth="2"><path d={item.icon}/></svg>
                  {item.label}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(item => (
          <div key={item.name} onClick={() => setActiveTab(item.name as any)} style={{ padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === item.name ? 'rgba(253, 53, 29, 0.1)' : 'transparent', color: activeTab === item.name ? '#FE532D' : (darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'), fontWeight: activeTab === item.name ? 600 : 400, transition: 'all 0.2s' }}>
            {item.icon}
            <span style={{ fontSize: '0.9rem' }}>{item.name}</span>
          </div>
        ))}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <div style={{ padding: '20px', background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderRadius: '18px', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.8rem' }}>Storage Used</div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: '70%', height: '100%', background: '#FE532D' }} />
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.7rem', opacity: 0.4 }}>3.5 GB of 5 GB</div>
        </div>

        <button onClick={handleLogout} style={{ width: '100%', padding: '12px', background: 'transparent', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '10px', color: darkMode ? '#fff' : '#000', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
          SIGN OUT
        </button>
      </div>
    </div>
  );
};

export default PortalSidebar;
