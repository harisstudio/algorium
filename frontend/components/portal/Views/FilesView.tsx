"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { usePortal } from '@/context/PortalContext';

interface FilesViewProps {
  darkMode: boolean;
}

const FilesView: React.FC<FilesViewProps> = ({ darkMode }) => {
  const { driveFiles, driveSearch, setDriveSearch, showToast } = usePortal();

  const filteredFiles = driveFiles.filter(f => 
    f.name.toLowerCase().includes(driveSearch.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1 }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: darkMode ? '#fff' : '#000', margin: 0 }}>Shared Assets</h3>
          <div style={{ position: 'relative', width: '350px' }}>
            <input 
              type="text" 
              placeholder="Search documents, logos, briefs..." 
              value={driveSearch}
              onChange={(e) => setDriveSearch(e.target.value)}
              style={{ width: '100%', padding: '14px 18px 14px 45px', background: darkMode ? 'rgba(255,255,255,0.03)' : '#f8f8f8', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '15px', color: darkMode ? '#fff' : '#000', fontSize: '0.9rem', outline: 'none' }} 
            />
            <svg style={{ position: 'absolute', left: '15px', top: '14px', opacity: 0.4 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FE532D" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        </div>
        <button style={{ padding: '14px 32px', background: '#FE532D', color: '#fff', borderRadius: '15px', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(254, 83, 45, 0.2)' }}>+ UPLOAD ASSETS</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
        {filteredFiles.length > 0 ? filteredFiles.map((file: any, i: number) => (
          <FileCard key={i} file={file} darkMode={darkMode} showToast={showToast} />
        )) : (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', opacity: 0.3 }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '20px' }}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            <div style={{ fontSize: '1.2rem' }}>No assets found matching your search.</div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const FileCard = ({ file, darkMode, showToast }: any) => {
  const handleDownload = () => {
    showToast(`Initializing secure download: ${file.name}`, 'success');
    setTimeout(() => showToast(`Sync Complete: ${file.name} saved.`), 2000);
  };

  return (
    <motion.div 
      whileHover={{ y: -8, background: darkMode ? 'rgba(255,255,255,0.04)' : '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      onClick={handleDownload}
      style={{ padding: '2.5rem', background: darkMode ? 'rgba(255,255,255,0.02)' : '#fcfcfd', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '28px', cursor: 'pointer', transition: 'all 0.3s ease' }}
    >
      <div style={{ width: '50px', height: '50px', background: 'rgba(254, 83, 45, 0.1)', borderRadius: '14px', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FE532D" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
      </div>
      <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '10px', color: darkMode ? '#fff' : '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
      <div style={{ opacity: 0.4, fontSize: '0.85rem', color: darkMode ? '#fff' : '#000', display: 'flex', gap: '8px' }}>
        <span>{file.size}</span>
        <span>•</span>
        <span>{file.type}</span>
      </div>
    </motion.div>
  );
};

export default FilesView;
