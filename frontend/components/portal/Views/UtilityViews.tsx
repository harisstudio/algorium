"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortal } from '@/context/PortalContext';

// --- Notes View ---
export const NotesView = ({ darkMode }: { darkMode: boolean }) => {
  const { activeProject } = usePortal();
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: darkMode ? '#fff' : '#000', marginBottom: '1.5rem' }}>Brief Documentation</h3>
      <p style={{ opacity: 0.5, color: darkMode ? '#fff' : '#000', marginBottom: '2.5rem' }}>Secure project brief and documentation notes.</p>
      <textarea 
        defaultValue={activeProject?.notes || "Project synchronization notes initialized. Sync briefing details from Account Manager."}
        style={{ width: '100%', height: '400px', background: darkMode ? 'rgba(255,255,255,0.02)' : '#fcfcfd', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '24px', padding: '2.5rem', color: darkMode ? '#fff' : '#000', fontSize: '1.1rem', lineHeight: '1.8', outline: 'none', transition: 'border-color 0.2s' }}
      />
    </motion.div>
  );
};

// --- Payment Modal ---
export const PaymentModal = () => {
  const { showPaymentModal, setShowPaymentModal, pendingPayment, handlePaymentSuccess } = usePortal();

  return (
    <AnimatePresence>
      {showPaymentModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }} 
             onClick={() => setShowPaymentModal(false)}
             style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(15px)' }} 
           />
           <motion.div 
             initial={{ y: 50, opacity: 0, scale: 0.95 }} 
             animate={{ y: 0, opacity: 1, scale: 1 }}
             exit={{ y: 50, opacity: 0, scale: 0.95 }}
             style={{ width: '420px', background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '35px', padding: '45px', position: 'relative', zIndex: 1, textAlign: 'center', boxShadow: '0 50px 100px rgba(0,0,0,0.5)' }}
           >
              <div style={{ width: '70px', height: '70px', borderRadius: '20px', background: 'rgba(254,83,45,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem' }}>
                 <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FE532D" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              </div>
              <h3 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Secure Sync</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', marginBottom: '3rem' }}>
                Invoice: <span style={{ color: '#FE532D' }}>{pendingPayment?.id}</span> <br/> 
                Amount: <span style={{ color: '#fff', fontWeight: 700 }}>{pendingPayment?.amount}</span>
              </p>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '22px', borderRadius: '20px', marginBottom: '2.5rem', textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)' }}>
                 <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '10px', letterSpacing: '0.1em' }}>SYNCHRONIZATION METHOD</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#fff', fontWeight: 600 }}>
                    <div style={{ width: '40px', height: '24px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', opacity: 0.6 }}>VISA</div>
                    Apple Pay •••• 4242
                 </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePaymentSuccess}
                style={{ width: '100%', padding: '22px', background: '#fff', color: '#000', borderRadius: '18px', fontWeight: 800, fontSize: '1.1rem', border: 'none', cursor: 'pointer', boxShadow: '0 20px 40px rgba(255,255,255,0.1)' }}
              >
                PAY WITH TOUCH ID
              </motion.button>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', marginTop: '2rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>Decline Transaction</button>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
