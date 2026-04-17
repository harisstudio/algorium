"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { usePortal } from '@/context/PortalContext';

interface AdminViewProps {
  darkMode: boolean;
}

const AdminView: React.FC<AdminViewProps> = ({ darkMode }) => {
  const { adminClients, adminSearch, setAdminSearch, performAdminAction, setActiveProject, setPortalStage, setActiveTab } = usePortal();

  const filteredClients = adminClients.filter(c => 
    c.company.toLowerCase().includes(adminSearch.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
         <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: darkMode ? '#fff' : '#000' }}>Agency Manager</h3>
            <p style={{ opacity: 0.5, color: darkMode ? '#fff' : '#000', marginTop: '5px' }}>Global oversight of client ecosystems and synchronization status.</p>
         </div>
         <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '300px' }}>
               <input 
                 type="text" 
                 placeholder="Filter synchronized clients..." 
                 value={adminSearch}
                 onChange={(e) => setAdminSearch(e.target.value)}
                 style={{ width: '100%', padding: '14px 18px 14px 45px', background: 'rgba(254, 83, 45, 0.05)', border: '1px solid rgba(254,83,45,0.1)', borderRadius: '15px', color: darkMode ? '#fff' : '#000', fontSize: '0.9rem', outline: 'none' }}
               />
               <svg style={{ position: 'absolute', left: '15px', top: '14px', opacity: 0.5 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FE532D" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div style={{ padding: '15px 30px', background: darkMode ? 'rgba(255,255,255,0.03)' : '#fff', borderRadius: '18px', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, textAlign: 'center' }}>
               <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', marginBottom: '4px', color: darkMode ? '#fff' : '#000' }}>Active Nodes</div>
               <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FE532D' }}>{adminClients.length}</div>
            </div>
         </div>
      </div>

      <div style={{ background: darkMode ? 'rgba(255,255,255,0.01)' : '#fff', borderRadius: '28px', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
           <thead>
             <tr style={{ borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, background: darkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
               <th style={{ padding: '25px', fontSize: '0.8rem', opacity: 0.4, fontWeight: 800, letterSpacing: '0.1em', color: darkMode ? '#fff' : '#000' }}>CLIENT ENTITY</th>
               <th style={{ padding: '25px', fontSize: '0.8rem', opacity: 0.4, fontWeight: 800, letterSpacing: '0.1em', color: darkMode ? '#fff' : '#000' }}>PROGRESS</th>
               <th style={{ padding: '25px', fontSize: '0.8rem', opacity: 0.4, fontWeight: 800, letterSpacing: '0.1em', color: darkMode ? '#fff' : '#000' }}>DRIVE</th>
               <th style={{ padding: '25px', fontSize: '0.8rem', opacity: 0.4, fontWeight: 800, letterSpacing: '0.1em', color: darkMode ? '#fff' : '#000', textAlign: 'right' }}>OPERATIONS</th>
             </tr>
           </thead>
           <tbody>
             {filteredClients.length > 0 ? filteredClients.map(client => (
               <tr key={client.id} style={{ borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}`, transition: 'background 0.2s' }} className="hover-row">
                 <td style={{ padding: '25px' }}>
                    <div style={{ fontWeight: 800, color: darkMode ? '#fff' : '#000', fontSize: '1.1rem' }}>{client.company}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.5, color: darkMode ? '#fff' : '#000', marginTop: '4px' }}>{client.projectInfo.name}</div>
                 </td>
                 <td style={{ padding: '25px', width: '250px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                       <div style={{ flex: 1, height: '8px', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${client.projectInfo.progress}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: '#FE532D', boxShadow: '0 0 10px rgba(254, 83, 45, 0.3)' }} />
                       </div>
                       <span style={{ fontSize: '0.9rem', fontWeight: 800, color: darkMode ? '#fff' : '#000' }}>{client.projectInfo.progress}%</span>
                    </div>
                 </td>
                 <td style={{ padding: '25px' }}>
                    <span style={{ padding: '6px 14px', background: 'rgba(254, 83, 45, 0.1)', color: '#FE532D', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}>{client.files?.length || 0} Assets</span>
                 </td>
                 <td style={{ padding: '25px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                       <button onClick={() => { setActiveProject(client); setPortalStage('dashboard'); setActiveTab('Overview'); }} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: darkMode ? '#fff' : '#000', transition: 'all 0.2s' }}>View</button>
                       <button 
                          onClick={() => performAdminAction(client.id, 'invoice', { id: `INV-${Math.floor(Math.random()*900)+100}`, amount: '£1,200', status: 'Pending', date: new Date().toLocaleDateString() })}
                          style={{ padding: '10px 20px', background: '#FE532D', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 5px 15px rgba(254, 83, 45, 0.15)' }}
                       >+ Bill</button>
                    </div>
                 </td>
               </tr>
             )) : (
               <tr><td colSpan={4} style={{ padding: '100px', textAlign: 'center', opacity: 0.3 }}>No synchronized client nodes found.</td></tr>
             )}
           </tbody>
         </table>
      </div>
    </motion.div>
  );
};

export default AdminView;
