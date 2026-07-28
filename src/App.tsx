import React, { useState, useEffect } from 'react';
import { UserSession, CommitteeId, Delegate, RubricScore, UserRole, JudgePortalSchedule } from './types';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { JudgePortal } from './components/JudgePortal';
import { AdminDashboard } from './components/AdminDashboard';
import { PhpExporterModal } from './components/PhpExporterModal';
import { PrintableSheet } from './components/PrintableSheet';
import { DEFAULT_DELEGATES, DEFAULT_JUDGE_PINS, DEFAULT_ADMIN_PIN } from './data/initialData';

export default function App() {
  const [session, setSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('armun_session');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return { role: 'guest' };
  });

  const [delegates, setDelegates] = useState<Delegate[]>(DEFAULT_DELEGATES);
  const [scores, setScores] = useState<Record<string, RubricScore>>({});
  const [judgePins, setJudgePins] = useState<Record<string, string>>(DEFAULT_JUDGE_PINS);
  const [adminPin, setAdminPin] = useState<string>(DEFAULT_ADMIN_PIN);
  const [judgePortalSchedule, setJudgePortalSchedule] = useState<JudgePortalSchedule>({
    isEnabled: true,
    startTime: null,
    endTime: null,
    message: 'Judge Evaluation Portal is currently disabled by Master Admin.',
  });

  const [showPhpExporter, setShowPhpExporter] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printCommitteeId, setPrintCommitteeId] = useState<CommitteeId>('UNSC');

  // Save session state to localStorage
  useEffect(() => {
    localStorage.setItem('armun_session', JSON.stringify(session));
  }, [session]);

  // Load Admin All Data
  const loadAdminData = async () => {
    try {
      const res = await fetch('/api/admin/data');
      if (res.ok) {
        const data = await res.json();
        if (data.delegates) setDelegates(data.delegates);
        if (data.scores) setScores(data.scores);
        if (data.judgePins) setJudgePins(data.judgePins);
        if (data.adminPin) setAdminPin(data.adminPin);
        if (data.judgePortalSchedule) setJudgePortalSchedule(data.judgePortalSchedule);
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
    }
  };

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 10000); // Polling sync every 10s
    return () => clearInterval(interval);
  }, []);

  // Login handler calling backend API
  const handleLogin = async (payload: { role: UserRole; committeeId?: CommitteeId; judgeIndex?: 1 | 2 | 3; pin: string }) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        const newSession: UserSession = {
          role: payload.role,
          committeeId: payload.committeeId,
          judgeIndex: payload.judgeIndex,
          judgeName: data.judgeName,
          token: data.token,
        };
        setSession(newSession);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (e) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const handleLogout = () => {
    setSession({ role: 'guest' });
  };

  // Fetch isolated judge data
  const handleFetchJudgeData = async (committeeId: CommitteeId, judgeIndex: 1 | 2 | 3) => {
    try {
      const res = await fetch(`/api/judge/data?committeeId=${committeeId}&judgeIndex=${judgeIndex}`);
      const data = await res.json();
      return {
        delegates: data.delegates || [],
        myScores: data.myScores || {},
        isPortalDisabled: data.isPortalDisabled,
        portalDisabledReason: data.portalDisabledReason,
      };
    } catch (e) {
      return { delegates: [], myScores: {} };
    }
  };

  const handleUpdateJudgeSchedule = async (payload: { isEnabled: boolean; startTime?: string | null; endTime?: string | null; message?: string }) => {
    await fetch('/api/admin/schedule-judge-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await loadAdminData();
  };

  // Save score by judge
  const handleSaveScore = async (payload: {
    delegateId: string;
    committeeId: CommitteeId;
    judgeIndex: 1 | 2 | 3;
    criteriaScores: Record<string, number>;
    comments: string;
    isLocked: boolean;
  }) => {
    try {
      const res = await fetch('/api/judge/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await loadAdminData();
      }
    } catch (e) {
      console.error('Error saving score:', e);
    }
  };

  // Admin Actions
  const handleAddDelegate = async (delegate: Partial<Delegate>) => {
    await fetch('/api/admin/delegate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', delegate }),
    });
    await loadAdminData();
  };

  const handleEditDelegate = async (delegate: Delegate) => {
    await fetch('/api/admin/delegate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'edit', delegate }),
    });
    await loadAdminData();
  };

  const handleDeleteDelegate = async (delegateId: string) => {
    await fetch('/api/admin/delegate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', delegate: { id: delegateId } }),
    });
    await loadAdminData();
  };

  const handleUpdatePins = async (payload: { newAdminPin?: string; newJudgePins?: Record<string, string> }) => {
    await fetch('/api/admin/update-pins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await loadAdminData();
  };

  const handleResetScores = async (committeeId?: CommitteeId) => {
    await fetch('/api/admin/reset-scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ committeeId }),
    });
    await loadAdminData();
  };

  const handleUpdateScore = async (payload: {
    delegateId: string;
    committeeId: CommitteeId;
    judgeIndex: 1 | 2 | 3;
    criteriaScores: Record<string, number>;
    comments: string;
    totalMarks?: number;
  }) => {
    await fetch('/api/admin/update-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await loadAdminData();
  };

  const handleOpenPrintModal = (committeeId?: CommitteeId) => {
    if (committeeId) {
      setPrintCommitteeId(committeeId);
    } else if (session.committeeId) {
      setPrintCommitteeId(session.committeeId);
    }
    setShowPrintModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-indigo-600 selection:text-white">
      {/* Header Banner */}
      <Header
        session={session}
        onLogout={handleLogout}
        onOpenPhpExporter={() => setShowPhpExporter(true)}
        onOpenPrintModal={(session.role === 'admin' || session.role === 'masteradmin') ? () => handleOpenPrintModal(printCommitteeId) : undefined}
      />

      {/* Guest Login Screen */}
      {session.role === 'guest' && (
        <LoginModal onLogin={handleLogin} />
      )}

      {/* Judge View */}
      {session.role === 'judge' && session.committeeId && session.judgeIndex && (
        <JudgePortal
          committeeId={session.committeeId}
          judgeIndex={session.judgeIndex}
          judgeName={session.judgeName || `Judge ${session.judgeIndex}`}
          onFetchJudgeData={handleFetchJudgeData}
          onSaveScore={handleSaveScore}
        />
      )}

      {/* Admin / Master Admin View */}
      {(session.role === 'admin' || session.role === 'masteradmin') && (
        <AdminDashboard
          delegates={delegates}
          scores={scores}
          judgePins={judgePins}
          adminPin={adminPin}
          userRole={session.role}
          judgePortalSchedule={judgePortalSchedule}
          onAddDelegate={handleAddDelegate}
          onEditDelegate={handleEditDelegate}
          onDeleteDelegate={handleDeleteDelegate}
          onUpdatePins={handleUpdatePins}
          onResetScores={handleResetScores}
          onOpenPhpExporter={() => setShowPhpExporter(true)}
          onOpenPrintModal={handleOpenPrintModal}
          onUpdateScore={handleUpdateScore}
          onUpdateJudgeSchedule={handleUpdateJudgeSchedule}
        />
      )}

      {/* PHP & MySQL Code Exporter Modal */}
      {showPhpExporter && (
        <PhpExporterModal onClose={() => setShowPhpExporter(false)} />
      )}

      {/* Printable Paper Sheet Modal */}
      {showPrintModal && (
        <PrintableSheet
          committeeId={printCommitteeId}
          judgeIndex={session.judgeIndex || 1}
          delegates={delegates}
          scores={scores}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
