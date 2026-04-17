"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { usePortal } from '@/context/PortalContext';

interface FinanceViewProps {
  darkMode: boolean;
}

const FinanceView: React.FC<FinanceViewProps> = ({ darkMode }) => {
  const { activeProject, userRole, payInvoice, performAdminAction } = usePortal();

  if (!activeProject) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <div>
           <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: darkMode ? '#fff' : '#000', margin: 0 }}>Financial Ledger</h3>
           <p style={{ opacity: 0.5, color: darkMode ? '#fff' : '#000', marginTop: '8px' }}>Transparent billing and transaction history.</p>
        </div>
        <button 
          onClick={() => {
            if (userRole === 'admin') {
              performAdminAction(activeProject.id, 'invoice', { 
                id: `INV-${Math.floor(Math.random()*900)+100}`, 
                amount: '£4,500', 
                status: 'Pending', 
                date: new Date().toLocaleDateString() 
              });
            } else {
              alert('Please contact billing@algorium.uk for manual invoice requests.');
            }
          }} 
          style={{ padding: '14px 32px', background: '#FE532D', color: '#fff', borderRadius: '15px', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(254, 83, 45, 0.2)' }}
        >
          {userRole === 'admin' ? '+ GENERATE INVOICE' : 'REQUEST BILLING INFO'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {activeProject.invoices?.length > 0 ? activeProject.invoices.map((inv: any, i: number) => (
          <div key={i} style={{ padding: '1.8rem 2.5rem', background: darkMode ? 'rgba(255,255,255,0.02)' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`, borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease' }}>
            <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
               <div style={{ fontWeight: 800, color: '#FE532D', fontSize: '1.1rem', letterSpacing: '0.05em' }}>{inv.id}</div>
               <div style={{ opacity: 0.4, color: darkMode ? '#fff' : '#000', fontSize: '0.9rem', width: '100px' }}>{inv.date}</div>
               <div style={{ fontWeight: 700, fontSize: '1.3rem', color: darkMode ? '#fff' : '#000' }}>{inv.amount}</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: inv.status === 'Paid' ? '#32d74b' : '#FE532D' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: inv.status === 'Paid' ? '#32d74b' : '#FE532D', letterSpacing: '0.1em' }}>{inv.status.toUpperCase()}</span>
              </div>
              
              {inv.status !== 'Paid' && (
                <button 
                  onClick={() => payInvoice(inv)}
                  style={{ padding: '10px 24px', background: '#FE532D', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  PAY NOW
                </button>
              )}
              
              <button style={{ background: 'transparent', border: 'none', opacity: 0.3, cursor: 'pointer', color: darkMode ? '#fff' : '#000' }}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              </button>
            </div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '6rem', opacity: 0.3, border: `2px dashed ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '24px' }}>
             No financial records found.
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FinanceView;
