"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { usePortal } from '@/context/PortalContext';

interface DashboardProps {
  darkMode: boolean;
}

const DashboardView: React.FC<DashboardProps> = ({ darkMode }) => {
  const { activeProject } = usePortal();

  if (!activeProject) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ width: '300px', height: '40px', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[1,2,3].map(i => <div key={i} style={{ height: '160px', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: '24px', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }} />)}
        </div>
      </div>
    );
  }

  const progress = activeProject.timeline 
    ? Math.round((activeProject.timeline.filter((t: any) => t.completed).length / activeProject.timeline.length) * 100)
    : (activeProject.projectInfo?.progress || 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: '4rem' }}>
        <h4 style={{ fontSize: '0.9rem', color: '#FE532D', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.1em' }}>DASHBOARD OVERVIEW</h4>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: darkMode ? '#fff' : '#000' }}>Welcome back, {activeProject.company}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
        <Card darkMode={darkMode}>
          <Label>Project Phase</Label>
          <Value color="#FE532D">{activeProject.status || 'Active'} Build</Value>
          <SubText>Focus: Core UI/UX & Sync</SubText>
        </Card>
        
        <Card darkMode={darkMode}>
          <Label>Total Progress</Label>
          <Value>{progress}%</Value>
          <ProgressBar progress={progress} />
        </Card>

        <Card darkMode={darkMode}>
          <Label>Next Delivery</Label>
          <Value>{activeProject.timeline?.find((t: any) => !t.completed)?.date || activeProject.projectInfo?.deadline || 'TBD'}</Value>
          <SubText>Mile: {activeProject.timeline?.find((t: any) => !t.completed)?.task || 'Final Release'}</SubText>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '2.5rem', color: darkMode ? '#fff' : '#000' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeProject.activityLog?.length > 0 ? activeProject.activityLog.map((log: any) => (
              <div key={log.id} style={{ padding: '1.5rem', background: darkMode ? 'rgba(255,255,255,0.02)' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`, borderRadius: '20px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(254,83,45,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FE532D" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: darkMode ? '#fff' : '#000' }}>{log.action}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.4, color: darkMode ? '#fff' : '#000' }}>{log.date}</div>
                </div>
              </div>
            )) : <div style={{ opacity: 0.3, color: darkMode ? '#fff' : '#000' }}>No activity history found.</div>}
          </div>
        </div>

        <div>
           <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '2.5rem', color: darkMode ? '#fff' : '#000' }}>Roadmap Progress</h3>
           <div style={{ padding: '2rem', background: darkMode ? 'rgba(255,255,255,0.01)' : '#fcfcfd', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '24px' }}>
              {(activeProject.projectInfo?.roadmap || [
                {phase: 'Discovery', status: 'completed'},
                {phase: 'Execution', status: 'current'},
                {phase: 'Quality Control', status: 'pending'}
              ]).map((step: any, i: number) => (
                 <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: step.status === 'completed' ? '#32d74b' : (step.status === 'current' ? '#FE532D' : 'rgba(255,255,255,0.1)') }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, opacity: step.status === 'pending' ? 0.4 : 1, color: darkMode ? '#fff' : '#000' }}>{step.phase}</span>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </motion.div>
  );
};

// UI Parts
const Card = ({ children, darkMode }: any) => (
  <div style={{ padding: '2rem', background: darkMode ? 'rgba(255,255,255,0.02)' : '#fcfcfd', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '24px' }}>
    {children}
  </div>
);
const Label = ({ children }: any) => <div style={{ opacity: 0.5, fontSize: '0.75rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{children}</div>;
const Value = ({ children, color }: any) => <div style={{ fontSize: '1.4rem', fontWeight: 700, color: color || 'inherit' }}>{children}</div>;
const SubText = ({ children }: any) => <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', opacity: 0.4 }}>{children}</div>;
const ProgressBar = ({ progress }: any) => (
  <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', marginTop: '1.2rem', overflow: 'hidden' }}>
    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: '#FE532D' }} />
  </div>
);

export default DashboardView;
