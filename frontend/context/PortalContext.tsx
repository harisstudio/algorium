"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type TabType = 'Overview' | 'Drive Space' | 'Invoices' | 'Notes' | 'Admin' | 'Messages' | 'Settings';
type UserRole = 'admin' | 'client' | null;

interface PortalContextType {
  userRole: UserRole;
  portalStage: 'login' | 'dashboard';
  activeTab: TabType;
  activeProject: any;
  adminClients: any[];
  driveFiles: any[];
  driveSearch: string;
  adminSearch: string;
  chatMessage: string;
  toast: { message: string; type: 'success' | 'error' | null };
  showPaymentModal: boolean;
  pendingPayment: any;
  showPortal: boolean;
  
  setPortalStage: (stage: 'login' | 'dashboard') => void;
  setActiveTab: (tab: TabType) => void;
  setActiveProject: (project: any) => void;
  setDriveSearch: (search: string) => void;
  setAdminSearch: (search: string) => void;
  setChatMessage: (msg: string) => void;
  setShowPaymentModal: (show: boolean) => void;
  setShowPortal: (show: boolean) => void;
  
  showToast: (message: string, type?: 'success' | 'error') => void;
  handleLogin: (clientData: any) => Promise<void>;
  handleLogout: () => void;
  sendMessage: () => Promise<void>;
  payInvoice: (invoice: any) => void;
  handlePaymentSuccess: () => void;
  performAdminAction: (clientId: string, type: string, actionData: any) => Promise<void>;
  fetchAdminData: () => Promise<void>;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export const PortalProvider = ({ children }: { children: ReactNode }) => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [portalStage, setPortalStage] = useState<'login' | 'dashboard'>('login');
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [activeProject, setActiveProject] = useState<any>(null);
  const [adminClients, setAdminClients] = useState<any[]>([]);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveSearch, setDriveSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [showPortal, setShowPortal] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('algorium_portal_session');
    if (saved) {
      try {
        const { role, stage, project, tab } = JSON.parse(saved);
        setUserRole(role);
        setPortalStage(stage);
        setActiveProject(project);
        setActiveTab(tab);
        if (role === 'admin' && stage === 'dashboard') fetchAdminData();
      } catch (e) { console.error("Restore failed", e); }
    }
  }, []);

  useEffect(() => {
    if (portalStage === 'dashboard' && userRole) {
      localStorage.setItem('algorium_portal_session', JSON.stringify({
        role: userRole,
        stage: portalStage,
        project: activeProject,
        tab: activeTab
      }));
    }
  }, [userRole, portalStage, activeProject, activeTab]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: null }), 3000);
  };

  const handleLogin = async (clientData: any) => {
    try {
      const res = await fetch('http://localhost:3001/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });
      const data = await res.json();
      if (data.success) {
        setUserRole(data.role);
        setPortalStage('dashboard');
        if (data.role === 'admin') {
          setActiveTab('Admin');
          fetchAdminData();
        } else {
          setActiveProject(data.client);
          setDriveFiles(data.client.files);
        }
        return;
      }
    } catch (err) { console.warn("API Offline, simulating..."); }

    // Simulation Fallback
    if (clientData.company === 'admin@algorium.uk' && clientData.password === 'admin') {
      setUserRole('admin');
      setPortalStage('dashboard');
      setActiveTab('Admin');
      setAdminClients([{ id: 'algorium_uk', company: 'Algorium UK', projectInfo: { progress: 75 } }]);
    } else if (clientData.company.toLowerCase() === 'algorium uk' && clientData.password === 'pass') {
      setUserRole('client');
      setPortalStage('dashboard');
      setActiveProject({ id: 'algorium_uk', company: 'Algorium UK', projectInfo: { progress: 75 }, files: [], invoices: [], activityLog: [] });
    } else {
      alert("Invalid credentials.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('algorium_portal_session');
    setUserRole(null);
    setPortalStage('login');
    setActiveProject(null);
  };

  const fetchAdminData = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/portal/data?role=admin');
      const data = await res.json();
      if (data.success) setAdminClients(data.clients);
    } catch (e) { console.warn("Admin fetch failed, using mocks"); }
  };

  const sendMessage = async () => {
    if (!chatMessage.trim() || !activeProject) return;
    const msg = { clientId: activeProject.id, sender: userRole === 'admin' ? 'Algorium Team' : activeProject.company, text: chatMessage };
    try {
      const res = await fetch('http://localhost:3001/api/portal/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      });
      const data = await res.json();
      if (data.success) {
        setActiveProject((prev: any) => ({ ...prev, messages: [...(prev?.messages || []), data.message] }));
        setChatMessage('');
        showToast("Message sent.");
      }
    } catch (e) {
      const local = { id: Date.now(), ...msg, date: 'Just now' };
      setActiveProject((prev: any) => ({ ...prev, messages: [...(prev?.messages || []), local] }));
      setChatMessage('');
    }
  };

  const payInvoice = (invoice: any) => {
    setPendingPayment(invoice);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    const updated = activeProject.invoices.map((inv: any) => inv.id === pendingPayment.id ? { ...inv, status: 'Paid' } : inv);
    setActiveProject({ ...activeProject, invoices: updated });
    setShowPaymentModal(false);
    showToast("Payment Successful!", "success");
    const log = { id: Date.now(), action: `Invoice ${pendingPayment.id} paid`, date: 'Just now', icon: 'finance' };
    setActiveProject((prev: any) => ({ ...prev, activityLog: [log, ...(prev?.activityLog || [])] }));
  };

  const performAdminAction = async (clientId: string, type: string, actionData: any) => {
    try {
      const res = await fetch('http://localhost:3001/api/portal/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, type, data: actionData })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Action Success");
        fetchAdminData();
      }
    } catch (e) {
      showToast(`Simulated: ${type} added`, 'success');
      if (type === 'invoice') {
        setAdminClients(prev => prev.map(c => c.id === clientId ? { ...c, invoices: [...(c.invoices || []), actionData] } : c));
      }
    }
  };

  return (
    <PortalContext.Provider value={{
      userRole, portalStage, activeTab, activeProject, adminClients, driveFiles, driveSearch, adminSearch, chatMessage, toast, showPaymentModal, pendingPayment, showPortal,
      setPortalStage, setActiveTab, setActiveProject, setDriveSearch, setAdminSearch, setChatMessage, setShowPaymentModal, setShowPortal,
      showToast, handleLogin, handleLogout, sendMessage, payInvoice, handlePaymentSuccess, performAdminAction, fetchAdminData
    }}>
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) throw new Error("usePortal must be used within PortalProvider");
  return context;
};
