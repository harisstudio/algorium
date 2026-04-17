"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { usePortal } from '@/context/PortalContext';

interface SettingsViewProps {
  darkMode: boolean;
}

const SettingsView: React.FC<SettingsViewProps> = ({ darkMode }) => {
  const { activeProject } = usePortal();

  const profileFields = [
    { label: 'Company Name', value: activeProject?.company },
    { label: 'Project Lead', value: 'Creative Director (Algorium)' },
    { label: 'Contact Phone', value: '+44 (20) 7946 0958' },
    { label: 'Portal Theme', value: darkMode ? 'Dark Mode' : 'Light Mode' }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ maxWidth: '700px' }}>
        <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: darkMode ? '#fff' : '#000', marginBottom: '1.5rem' }}>Ecosystem Profile</h3>
        <p style={{ opacity: 0.5, color: darkMode ? '#fff' : '#000', marginBottom: '3.5rem' }}>Manage your organizational synchronization settings.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {profileFields.map((field, i) => (
            <div key={i} style={{ padding: '1.5rem 2rem', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: '20px', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.4, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{field.label}</div>
                <div style={{ fontWeight: 700, color: darkMode ? '#fff' : '#000', fontSize: '1.1rem' }}>{field.value}</div>
              </div>
              <button style={{ background: 'transparent', border: 'none', color: '#FE532D', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', opacity: 0.7 }}>EDIT</button>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '4rem', padding: '2.5rem', background: 'rgba(254, 83, 45, 0.05)', borderRadius: '24px', border: '1px solid rgba(254, 83, 45, 0.1)' }}>
           <h4 style={{ color: '#FE532D', fontWeight: 800, marginBottom: '10px' }}>Security & Access</h4>
           <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '20px' }}>Synchronization of your project assets is protected by enterprise-grade encryption.</p>
           <button style={{ padding: '12px 24px', background: '#FE532D', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem' }}>REQUEST ACCESS RESET</button>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsView;
