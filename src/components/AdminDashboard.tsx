import React, { useState, useEffect } from 'react';
import { CommitteeId, Delegate, RubricScore, CommitteeInfo, UserRole, JudgePortalSchedule } from '../types';
import { COMMITTEES as DEFAULT_COMMITTEES, DEFAULT_JUDGE_PINS } from '../data/initialData';
import { MasterScoreSheet } from './MasterScoreSheet';
import {
  Key,
  Users,
  Plus,
  Trash2,
  FileSpreadsheet,
  Building2,
  ShieldCheck,
  Download,
  Pencil,
  Search,
  X,
  Check,
  Globe,
  AlertCircle,
  Printer,
  Sparkles,
  Clock,
  Lock,
  Upload,
  FileUp,
  RotateCcw,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { exportCredentialsPDF } from '../utils/pdfCredentialsExporter';

interface AdminDashboardProps {
  delegates: Delegate[];
  scores: Record<string, RubricScore>;
  judgePins: Record<string, string>;
  adminPin: string;
  userRole?: UserRole;
  judgePortalSchedule?: JudgePortalSchedule;
  onAddDelegate: (delegate: Partial<Delegate>) => Promise<void>;
  onEditDelegate: (delegate: Delegate) => Promise<void>;
  onDeleteDelegate: (delegateId: string) => Promise<void>;
  onBulkImportDelegates?: (payload: {
    action: 'bulk_append' | 'bulk_replace' | 'bulk_replace_committee';
    delegatesList: Delegate[];
    committeeId?: CommitteeId;
  }) => Promise<void>;
  onUpdatePins: (payload: { newAdminPin?: string; newJudgePins?: Record<string, string> }) => Promise<void>;
  onResetScores: (committeeId?: CommitteeId) => Promise<void>;
  onOpenPhpExporter: () => void;
  onOpenPrintModal?: (committeeId?: CommitteeId) => void;
  onUpdateScore?: (payload: {
    delegateId: string;
    committeeId: CommitteeId;
    judgeIndex: 1 | 2 | 3;
    criteriaScores: Record<string, number>;
    comments: string;
    totalMarks?: number;
  }) => Promise<void>;
  onUpdateJudgeSchedule?: (payload: { isEnabled: boolean; startTime?: string | null; endTime?: string | null; message?: string }) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  delegates,
  scores,
  judgePins,
  adminPin,
  userRole = 'admin',
  judgePortalSchedule,
  onAddDelegate,
  onEditDelegate,
  onDeleteDelegate,
  onBulkImportDelegates,
  onUpdatePins,
  onResetScores,
  onOpenPhpExporter,
  onOpenPrintModal,
  onUpdateScore,
  onUpdateJudgeSchedule,
}) => {
  const [activeTab, setActiveTab] = useState<'master' | 'committees' | 'delegates' | 'pins' | 'schedule'>('master');
  const [committeesList, setCommitteesList] = useState<CommitteeInfo[]>([...DEFAULT_COMMITTEES]);
  const [selectedCommittee, setSelectedCommittee] = useState<CommitteeId>('UNSC');

  // Search filter for delegates
  const [delegateSearchQuery, setDelegateSearchQuery] = useState('');

  // Bulk Import Delegates State
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkRawText, setBulkRawText] = useState('');
  const [bulkImportMode, setBulkImportMode] = useState<'append' | 'replace_committee' | 'replace_all'>('append');
  const [bulkTargetCommittee, setBulkTargetCommittee] = useState<CommitteeId>('UNSC');
  const [isImportingBulk, setIsImportingBulk] = useState(false);
  const [bulkImportStatusMsg, setBulkImportStatusMsg] = useState<string | null>(null);

  // Reset Judges Marks State
  const [showResetMarksModal, setShowResetMarksModal] = useState(false);
  const [resetTargetCommittee, setResetTargetCommittee] = useState<string>('ALL');
  const [isResettingScores, setIsResettingScores] = useState(false);
  const [resetStatusMsg, setResetStatusMsg] = useState<string | null>(null);

  // Schedule state
  const formatForDatetimeLocal = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => (n < 10 ? '0' + n : String(n));
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  const [schedIsEnabled, setSchedIsEnabled] = useState<boolean>(judgePortalSchedule?.isEnabled ?? true);
  const [schedStartTime, setSchedStartTime] = useState<string>(formatForDatetimeLocal(judgePortalSchedule?.startTime));
  const [schedEndTime, setSchedEndTime] = useState<string>(formatForDatetimeLocal(judgePortalSchedule?.endTime));
  const [schedMessage, setSchedMessage] = useState<string>(judgePortalSchedule?.message || 'Judge Evaluation Portal is currently disabled by Master Admin.');
  const [isSavingSched, setIsSavingSched] = useState<boolean>(false);
  const [schedStatusMsg, setSchedStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (judgePortalSchedule) {
      setSchedIsEnabled(judgePortalSchedule.isEnabled ?? true);
      setSchedStartTime(formatForDatetimeLocal(judgePortalSchedule.startTime));
      setSchedEndTime(formatForDatetimeLocal(judgePortalSchedule.endTime));
      if (judgePortalSchedule.message) setSchedMessage(judgePortalSchedule.message);
    }
  }, [judgePortalSchedule]);

  const handleSaveScheduleConfig = async (e?: React.FormEvent, overrideEnabled?: boolean) => {
    if (e) e.preventDefault();
    if (!onUpdateJudgeSchedule) return;

    const enabledToSave = overrideEnabled !== undefined ? overrideEnabled : schedIsEnabled;
    setSchedIsEnabled(enabledToSave);
    setIsSavingSched(true);
    try {
      await onUpdateJudgeSchedule({
        isEnabled: enabledToSave,
        startTime: schedStartTime || null,
        endTime: schedEndTime || null,
        message: schedMessage,
      });
      setSchedStatusMsg(enabledToSave ? '🟢 Judge Logins ENABLED and Schedule Saved!' : '🔴 All Judge Logins DISABLED Successfully!');
      setTimeout(() => setSchedStatusMsg(null), 4000);
    } catch (err) {
      alert('Failed to update judge schedule.');
    } finally {
      setIsSavingSched(false);
    }
  };

  // Committee creation form
  const [newCommId, setNewCommId] = useState('');
  const [newCommName, setNewCommName] = useState('');
  const [newCommFullName, setNewCommFullName] = useState('');

  // Editing state for modals
  const [editingCommittee, setEditingCommittee] = useState<CommitteeInfo | null>(null);
  const [editingDelegate, setEditingDelegate] = useState<Delegate | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<{
    committeeId: CommitteeId;
    oldPortfolio: string;
    newPortfolio: string;
  } | null>(null);

  // Quick Add Portfolio per committee state
  const [quickCountryInput, setQuickCountryInput] = useState<Record<string, string>>({});

  // New Delegate Form state
  const [newDelName, setNewDelName] = useState('');
  const [newDelPortfolio, setNewDelPortfolio] = useState('');
  const [newDelSlNo, setNewDelSlNo] = useState<number>(1);
  const [isAdding, setIsAdding] = useState(false);

  // PIN Update state
  const [editJudgePins, setEditJudgePins] = useState<Record<string, string>>({ ...DEFAULT_JUDGE_PINS, ...judgePins });
  const [editAdminPin, setEditAdminPin] = useState(adminPin);
  const [pinUpdateStatus, setPinUpdateStatus] = useState<string | null>(null);

  // Handle adding new committee
  const handleAddCommitteeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommId.trim() || !newCommName.trim() || !newCommFullName.trim()) return;

    const idFormatted = newCommId.trim().toUpperCase() as CommitteeId;
    if (committeesList.some((c) => c.id === idFormatted)) {
      alert(`Committee ${idFormatted} already exists!`);
      return;
    }

    const newComm: CommitteeInfo = {
      id: idFormatted,
      name: newCommName.trim(),
      fullName: newCommFullName.trim(),
    };

    setCommitteesList((prev) => [...prev, newComm]);
    setSelectedCommittee(idFormatted);
    setNewCommId('');
    setNewCommName('');
    setNewCommFullName('');
  };

  // Handle saving edited committee
  const handleSaveEditedCommittee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommittee) return;

    setCommitteesList((prev) =>
      prev.map((c) => (c.id === editingCommittee.id ? editingCommittee : c))
    );
    setEditingCommittee(null);
  };

  // Handle deleting committee
  const handleDeleteCommittee = async (commId: CommitteeId) => {
    const committeeDelegates = delegates.filter((d) => d.committeeId === commId);
    const confirmMessage = `Are you sure you want to delete committee ${commId}?` +
      (committeeDelegates.length > 0 ? ` This will also delete ${committeeDelegates.length} delegate(s) in this committee.` : '');

    if (!window.confirm(confirmMessage)) return;

    setCommitteesList((prev) => prev.filter((c) => c.id !== commId));
    
    // Delete associated delegates
    for (const del of committeeDelegates) {
      await onDeleteDelegate(del.id);
    }

    if (selectedCommittee === commId) {
      const remaining = committeesList.filter((c) => c.id !== commId);
      if (remaining.length > 0) setSelectedCommittee(remaining[0].id);
    }
  };

  // Handle quick adding portfolio/country to a committee
  const handleAddQuickCountry = async (commId: CommitteeId) => {
    const val = (quickCountryInput[commId] || '').trim();
    if (!val) return;

    const existingInComm = delegates.filter((d) => d.committeeId === commId);
    const maxSl = existingInComm.reduce((max, d) => Math.max(max, d.slNo), 0);

    await onAddDelegate({
      committeeId: commId,
      delegateName: `Delegate (${val})`,
      portfolio: val,
      slNo: maxSl + 1,
    });

    setQuickCountryInput((prev) => ({ ...prev, [commId]: '' }));
  };

  // Handle renaming portfolio across delegates
  const handleSaveEditedPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPortfolio || !editingPortfolio.newPortfolio.trim()) return;

    const { committeeId, oldPortfolio, newPortfolio } = editingPortfolio;
    const targetDelegates = delegates.filter(
      (d) => d.committeeId === committeeId && d.portfolio === oldPortfolio
    );

    for (const del of targetDelegates) {
      await onEditDelegate({ ...del, portfolio: newPortfolio.trim() });
    }

    setEditingPortfolio(null);
  };

  // Handle deleting portfolio/country (deletes delegates holding that portfolio)
  const handleDeletePortfolio = async (commId: CommitteeId, portfolioName: string) => {
    const targetDelegates = delegates.filter(
      (d) => d.committeeId === commId && d.portfolio === portfolioName
    );

    if (
      !window.confirm(
        `Are you sure you want to delete portfolio "${portfolioName}" from ${commId}? This will delete ${targetDelegates.length} delegate record(s).`
      )
    ) {
      return;
    }

    for (const del of targetDelegates) {
      await onDeleteDelegate(del.id);
    }
  };

  // Handle adding delegate
  const handleAddDelegateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDelName.trim() || !newDelPortfolio.trim()) return;
    setIsAdding(true);
    try {
      await onAddDelegate({
        committeeId: selectedCommittee,
        delegateName: newDelName.trim(),
        portfolio: newDelPortfolio.trim(),
        slNo: newDelSlNo,
      });
      setNewDelName('');
      setNewDelPortfolio('');
      setNewDelSlNo((prev) => prev + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  // Handle saving edited delegate
  const handleSaveEditedDelegate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDelegate) return;

    try {
      await onEditDelegate(editingDelegate);
      setEditingDelegate(null);
    } catch (e) {
      console.error('Error saving delegate edits:', e);
    }
  };

  // --- BULK DELEGATE IMPORT PARSER & HANDLERS ---
  const parseBulkText = (text: string, defaultCommittee: CommitteeId): Delegate[] => {
    if (!text.trim()) return [];
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const parsed: Delegate[] = [];
    let currentSlNo = 1;

    lines.forEach((line) => {
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes(';')) {
        parts = line.split(';');
      } else {
        parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      }

      parts = parts.map((p) => p.replace(/^["']|["']$/g, '').trim());
      if (parts.length < 2) return;

      const firstColLower = parts[0].toLowerCase();
      const secondColLower = (parts[1] || '').toLowerCase();

      // Skip CSV headers
      if (
        firstColLower.includes('sl') ||
        firstColLower.includes('s.no') ||
        firstColLower.includes('no.') ||
        firstColLower.includes('committee') ||
        secondColLower.includes('delegate') ||
        secondColLower.includes('name') ||
        secondColLower.includes('portfolio')
      ) {
        return;
      }

      let slNo = currentSlNo;
      let committeeId: CommitteeId = defaultCommittee;
      let delegateName = '';
      let portfolio = '';

      if (parts.length >= 4) {
        const parsedSl = parseInt(parts[0], 10);
        if (!isNaN(parsedSl)) slNo = parsedSl;
        const parsedComm = parts[1].toUpperCase();
        if (parsedComm) committeeId = parsedComm as CommitteeId;
        delegateName = parts[2];
        portfolio = parts[3];
      } else if (parts.length === 3) {
        const parsedSl = parseInt(parts[0], 10);
        if (!isNaN(parsedSl)) {
          slNo = parsedSl;
          delegateName = parts[1];
          portfolio = parts[2];
        } else {
          const parsedComm = parts[0].toUpperCase();
          committeeId = parsedComm as CommitteeId;
          delegateName = parts[1];
          portfolio = parts[2];
        }
      } else if (parts.length === 2) {
        delegateName = parts[0];
        portfolio = parts[1];
      }

      if (delegateName && portfolio) {
        parsed.push({
          id: `del_import_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${Math.floor(Math.random() * 1000)}`,
          slNo,
          committeeId,
          delegateName,
          portfolio,
        });
        currentSlNo++;
      }
    });

    return parsed;
  };

  const parsedBulkDelegates = parseBulkText(bulkRawText, bulkTargetCommittee);

  const handleExecuteBulkImport = async () => {
    if (parsedBulkDelegates.length === 0) {
      alert('No valid delegates found in the input. Please ensure data has Name and Portfolio/Country separated by commas or tabs!');
      return;
    }

    setIsImportingBulk(true);
    setBulkImportStatusMsg(null);

    try {
      if (onBulkImportDelegates) {
        if (bulkImportMode === 'append') {
          await onBulkImportDelegates({
            action: 'bulk_append',
            delegatesList: parsedBulkDelegates,
          });
        } else if (bulkImportMode === 'replace_committee') {
          await onBulkImportDelegates({
            action: 'bulk_replace_committee',
            delegatesList: parsedBulkDelegates,
            committeeId: bulkTargetCommittee,
          });
        } else if (bulkImportMode === 'replace_all') {
          await onBulkImportDelegates({
            action: 'bulk_replace',
            delegatesList: parsedBulkDelegates,
          });
        }
      } else {
        for (const del of parsedBulkDelegates) {
          await onAddDelegate(del);
        }
      }

      setBulkImportStatusMsg(`🟢 Successfully imported ${parsedBulkDelegates.length} delegates!`);
      setTimeout(() => {
        setBulkImportStatusMsg(null);
        setShowBulkImportModal(false);
        setBulkRawText('');
      }, 1800);
    } catch (e) {
      alert('Error performing bulk import. Please try again.');
    } finally {
      setIsImportingBulk(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setBulkRawText(content);
      }
    };
    reader.readAsText(file);
  };

  // --- RESET JUDGES MARKS HANDLER ---
  const handleExecuteResetMarks = async () => {
    setIsResettingScores(true);
    setResetStatusMsg(null);
    try {
      if (resetTargetCommittee === 'ALL') {
        await onResetScores();
        setResetStatusMsg('🟢 All judge marks cleared successfully in one single shot!');
      } else {
        await onResetScores(resetTargetCommittee as CommitteeId);
        setResetStatusMsg(`🟢 All judge marks for committee ${resetTargetCommittee} cleared successfully!`);
      }
      setTimeout(() => {
        setResetStatusMsg(null);
        setShowResetMarksModal(false);
      }, 1800);
    } catch (err) {
      alert('Failed to reset scores.');
    } finally {
      setIsResettingScores(false);
    }
  };

  // Handle PIN update save
  const handleSavePinChanges = async () => {
    try {
      await onUpdatePins({
        newAdminPin: editAdminPin,
        newJudgePins: editJudgePins,
      });
      setPinUpdateStatus('PINs updated successfully!');
      setTimeout(() => setPinUpdateStatus(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Compute Judge Submissions Statistics across all committees
  const getCommitteeStatus = (cid: CommitteeId) => {
    const committeeDelegates = delegates.filter((d) => d.committeeId === cid);
    let j1Count = 0;
    let j2Count = 0;
    let j3Count = 0;

    committeeDelegates.forEach((d) => {
      if (scores[`${d.id}_J1`]) j1Count++;
      if (scores[`${d.id}_J2`]) j2Count++;
      if (scores[`${d.id}_J3`]) j3Count++;
    });

    const total = committeeDelegates.length;
    return {
      total,
      j1: { count: j1Count, done: total > 0 && j1Count >= total },
      j2: { count: j2Count, done: total > 0 && j2Count >= total },
      j3: { count: j3Count, done: total > 0 && j3Count >= total },
    };
  };

  // Filtered delegates list for Manage Delegates tab
  const filteredDelegates = delegates
    .filter((d) => d.committeeId === selectedCommittee)
    .filter((d) => {
      if (!delegateSearchQuery.trim()) return true;
      const q = delegateSearchQuery.toLowerCase();
      return (
        d.delegateName.toLowerCase().includes(q) ||
        d.portfolio.toLowerCase().includes(q) ||
        String(d.slNo).includes(q)
      );
    });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Secretariat Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
              ARMUN Edition-2 Secretariat Control
            </span>
            <h2 className="text-xl font-black text-white mt-1">
              Master Admin & Score Aggregator
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setBulkTargetCommittee(selectedCommittee);
                setShowBulkImportModal(true);
              }}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3.5 py-2 rounded-xl font-bold transition shadow-sm shadow-emerald-900/30"
              title="Bulk import delegates via CSV, Excel paste, or TXT file"
            >
              <Upload className="w-4 h-4 text-white" />
              <span>Bulk Import Delegates</span>
            </button>

            <button
              onClick={() => {
                setResetTargetCommittee('ALL');
                setShowResetMarksModal(true);
              }}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs px-3.5 py-2 rounded-xl font-bold transition shadow-sm shadow-rose-900/30"
              title="Clear all entered judge marks in one single shot"
            >
              <RotateCcw className="w-4 h-4 text-white" />
              <span>Reset Judges Marks</span>
            </button>

            <button
              onClick={() => exportCredentialsPDF(editAdminPin, editJudgePins, committeesList)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs px-3.5 py-2 rounded-xl font-bold transition shadow-sm shadow-amber-500/20"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Export Passwords PDF</span>
            </button>

            <button
              onClick={onOpenPhpExporter}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-2 rounded-xl font-bold transition shadow-sm shadow-indigo-200"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>PHP & MySQL Code Generator</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Secretariat Credentials Reference Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Secretariat Credentials Reference
              </div>
              <div className="text-xs font-mono text-slate-300 mt-0.5">
                Admin Username: <strong className="text-white">admin</strong> | Master PIN:{' '}
                <strong className="text-amber-300">{editAdminPin}</strong>
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-300 bg-white/5 border border-white/10 p-2.5 rounded-xl">
            Sample Judge Username: <strong className="text-indigo-300">unsc_judge1</strong> | PIN:{' '}
            <strong className="text-indigo-300">{editJudgePins['UNSC-1'] || '1111'}</strong>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('master')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'master'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Master Score Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('committees')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'committees'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Committees & Countries</span>
          </button>

          <button
            onClick={() => setActiveTab('delegates')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'delegates'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manage Delegates</span>
          </button>

          <button
            onClick={() => setActiveTab('pins')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pins'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Judge Credentials & PINs</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Judge Access & Scheduling</span>
          </button>
        </div>

        {/* ================= TAB 1: MASTER SCORE SHEET ================= */}
        {activeTab === 'master' && (
          <div className="space-y-6">
            {/* Master Admin Panel Status Banner */}
            {userRole === 'masteradmin' && (
              <div className="bg-purple-900 text-white p-4 rounded-2xl border border-purple-700 shadow-md flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-800 flex items-center justify-center text-amber-300 font-bold shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Master Admin Control Mode Active</h4>
                    <p className="text-xs text-purple-200">
                      You have authorization to edit and update criteria marks for Judge 1, 2, or 3 directly and print score sheets for any committee.
                    </p>
                  </div>
                </div>
                {onOpenPrintModal && (
                  <button
                    onClick={() => onOpenPrintModal(selectedCommittee)}
                    className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-xs px-4 py-2 rounded-xl transition shrink-0"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print {selectedCommittee} Sheet</span>
                  </button>
                )}
              </div>
            )}

            {/* Committee Quick Status Matrix */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Committees Overview & Judge Submissions Status
                </h3>
                {onOpenPrintModal && (
                  <button
                    onClick={() => onOpenPrintModal(selectedCommittee)}
                    className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold text-xs px-3 py-1.5 rounded-xl transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Print Sheet for {selectedCommittee}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2">
                {committeesList.map((c) => {
                  const status = getCommitteeStatus(c.id);
                  const isSelected = selectedCommittee === c.id;

                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCommittee(c.id)}
                      className={`p-3 rounded-xl border text-left transition-all relative group ${
                        isSelected
                          ? 'bg-indigo-950 text-white border-indigo-900 ring-2 ring-indigo-600/30'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-black text-sm">{c.name}</div>
                      <div className="text-[10px] opacity-80 mt-1">{status.total} Delegates</div>

                      {/* J1, J2, J3 completion dots */}
                      <div className="flex items-center gap-1 mt-2 text-[10px] font-mono">
                        <span
                          className={`px-1 py-0.2 rounded font-bold ${
                            status.j1.count > 0 ? 'bg-indigo-500 text-white' : 'bg-slate-300 text-slate-600'
                          }`}
                        >
                          J1
                        </span>
                        <span
                          className={`px-1 py-0.2 rounded font-bold ${
                            status.j2.count > 0 ? 'bg-indigo-500 text-white' : 'bg-slate-300 text-slate-600'
                          }`}
                        >
                          J2
                        </span>
                        <span
                          className={`px-1 py-0.2 rounded font-bold ${
                            status.j3.count > 0 ? 'bg-indigo-500 text-white' : 'bg-slate-300 text-slate-600'
                          }`}
                        >
                          J3
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Master Table View */}
            <MasterScoreSheet
              committeeId={selectedCommittee}
              delegates={delegates}
              scores={scores}
              isMasterAdmin={userRole === 'masteradmin'}
              onUpdateScore={onUpdateScore}
              onPrintCommitteeSheet={onOpenPrintModal}
            />
          </div>
        )}

        {/* ================= TAB 2: MANAGE COMMITTEES & COUNTRIES ================= */}
        {activeTab === 'committees' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Committee Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 h-fit">
              <h3 className="font-bold text-slate-900 text-base border-b pb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Add New Committee</span>
              </h3>

              <form onSubmit={handleAddCommitteeSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Committee Code / ID (e.g. ECOFIN)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ECOFIN"
                    value={newCommId}
                    onChange={(e) => setNewCommId(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Short Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ECOFIN"
                    value={newCommName}
                    onChange={(e) => setNewCommName(e.target.value)}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Full Name / Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Economic and Financial Committee"
                    value={newCommFullName}
                    onChange={(e) => setNewCommFullName(e.target.value)}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Committee</span>
                </button>
              </form>
            </div>

            {/* Active Committees & Country Portfolios List with Full Edit/Delete Permissions */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Registered Committees & Country Portfolios ({committeesList.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Manage committee definitions, edit portfolio names, or delete obsolete entries.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {committeesList.map((c) => {
                    const cDelegates = delegates.filter((d) => d.committeeId === c.id);
                    const cPortfolios = Array.from(new Set(cDelegates.map((d) => d.portfolio))) as string[];

                    return (
                      <div
                        key={c.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between"
                      >
                        <div>
                          {/* Committee Header with Edit & Delete Action Buttons */}
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded border border-indigo-200">
                                  {c.id}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 font-mono">
                                  {cDelegates.length} Delegates
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 text-sm mt-1">{c.fullName}</h4>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setEditingCommittee({ ...c })}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                                title="Edit Committee Info"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteCommittee(c.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                                title="Delete Committee"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Country Portfolios List */}
                          <div className="border-t pt-2 mt-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold uppercase text-slate-500">
                                Countries / Portfolios ({cPortfolios.length}):
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-white border rounded-xl">
                              {cPortfolios.length > 0 ? (
                                cPortfolios.map((p, idx) => (
                                  <div
                                    key={idx}
                                    className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border text-slate-800 text-[10px] px-2 py-1 rounded-lg font-medium group transition"
                                  >
                                    <span>{p}</span>
                                    <button
                                      onClick={() =>
                                        setEditingPortfolio({
                                          committeeId: c.id,
                                          oldPortfolio: p,
                                          newPortfolio: p,
                                        })
                                      }
                                      className="text-slate-400 hover:text-indigo-600 transition"
                                      title="Rename Country Portfolio"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePortfolio(c.id, p)}
                                      className="text-slate-400 hover:text-rose-600 transition"
                                      title="Delete Portfolio"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400 italic p-1">
                                  No country portfolios assigned yet
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Add Country / Portfolio to this Committee */}
                        <div className="border-t pt-2">
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="Add country (e.g. France)"
                              value={quickCountryInput[c.id] || ''}
                              onChange={(e) =>
                                setQuickCountryInput({
                                  ...quickCountryInput,
                                  [c.id]: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddQuickCountry(c.id);
                                }
                              }}
                              className="w-full bg-white border rounded-lg p-1.5 text-[11px]"
                            />
                            <button
                              onClick={() => handleAddQuickCountry(c.id)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg shrink-0 transition"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: MANAGE DELEGATES ================= */}
        {activeTab === 'delegates' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Add Delegate Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 h-fit">
              <h3 className="font-bold text-slate-900 text-base border-b pb-2 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Add Delegate to {selectedCommittee}</span>
              </h3>

              <form onSubmit={handleAddDelegateSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Target Committee</label>
                  <select
                    value={selectedCommittee}
                    onChange={(e) => setSelectedCommittee(e.target.value as CommitteeId)}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-semibold"
                  >
                    {committeesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">SL No</label>
                  <input
                    type="number"
                    value={newDelSlNo}
                    onChange={(e) => setNewDelSlNo(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Delegate Student Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={newDelName}
                    onChange={(e) => setNewDelName(e.target.value)}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Portfolio / Country Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. United States or BBC News"
                    value={newDelPortfolio}
                    onChange={(e) => setNewDelPortfolio(e.target.value)}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAdding}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAdding ? 'Adding...' : 'Add Single Delegate'}</span>
                </button>
              </form>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setBulkTargetCommittee(selectedCommittee);
                    setShowBulkImportModal(true);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 border border-amber-400/30"
                >
                  <Upload className="w-4 h-4 text-amber-300" />
                  <span>Bulk Import Delegates (CSV / Text)</span>
                </button>
                <span className="text-[10px] text-slate-400 mt-1.5 block text-center">Paste lines or upload CSV to import multiple delegates</span>
              </div>
            </div>

            {/* Existing Delegates List Table with Full Edit & Delete Controls */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Delegates in {selectedCommittee} ({filteredDelegates.length})
                  </h3>
                  <p className="text-xs text-slate-500">Edit or remove enrolled delegates.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkTargetCommittee(selectedCommittee);
                      setShowBulkImportModal(true);
                    }}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-white" />
                    <span>Bulk Import</span>
                  </button>

                  <div className="relative w-full sm:w-48">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter name or country..."
                      value={delegateSearchQuery}
                      onChange={(e) => setDelegateSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="divide-y max-h-[520px] overflow-y-auto">
                {filteredDelegates.length > 0 ? (
                  filteredDelegates.map((del) => (
                    <div
                      key={del.id}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-900 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          #{del.slNo}
                        </span>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{del.delegateName}</div>
                          <div className="text-[11px] text-slate-500">
                            Portfolio: <strong className="text-slate-700">{del.portfolio}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingDelegate({ ...del })}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Delegate Details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete delegate ${del.delegateName} (${del.portfolio})?`)) {
                              await onDeleteDelegate(del.id);
                            }
                          }}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Delegate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs italic">
                    No delegates found matching search query.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: MANAGE JUDGE PINS ================= */}
        {activeTab === 'pins' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-4xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Security Credentials & PINs Directory</h3>
                <p className="text-xs text-slate-500">
                  Modify security login PINs and passwords, or export a PDF directory for distribution.
                </p>
              </div>

              <button
                type="button"
                onClick={() => exportCredentialsPDF(editAdminPin, editJudgePins, committeesList)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download Passwords PDF</span>
              </button>
            </div>

            {pinUpdateStatus && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{pinUpdateStatus}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Secretariat Admin Master PIN
                </label>
                <input
                  type="text"
                  value={editAdminPin}
                  onChange={(e) => setEditAdminPin(e.target.value)}
                  className="bg-slate-50 border rounded-xl p-2.5 text-xs font-mono font-bold w-48"
                />
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Committee Judge PIN Matrix
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {committeesList.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 border rounded-xl space-y-2">
                      <div className="font-bold text-xs text-indigo-900">
                        {c.name} ({c.fullName})
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((j) => {
                          const key = `${c.id}-${j}`;
                          return (
                            <div key={key}>
                              <label className="block text-[10px] text-slate-500">Judge {j}</label>
                              <input
                                type="text"
                                value={editJudgePins[key] || DEFAULT_JUDGE_PINS[key] || ''}
                                onChange={(e) =>
                                  setEditJudgePins({ ...editJudgePins, [key]: e.target.value })
                                }
                                className="w-full bg-white border rounded p-1.5 text-xs font-mono font-bold text-center"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSavePinChanges}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-xs"
                >
                  Save PIN Changes
                </button>

                <button
                  type="button"
                  onClick={() => exportCredentialsPDF(editAdminPin, editJudgePins, committeesList)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition border border-slate-300 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>Download Passwords PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: JUDGE ACCESS & SCHEDULING ================= */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {schedStatusMsg && (
              <div className="bg-emerald-600 text-white p-3.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md">
                <Check className="w-4 h-4 shrink-0" />
                <span>{schedStatusMsg}</span>
              </div>
            )}

            {/* Master Access Control Banner */}
            <div className={`p-6 rounded-2xl border text-slate-900 shadow-md ${
              schedIsEnabled
                ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-emerald-500/30 text-white'
                : 'bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-rose-500/30 text-white'
            }`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 border border-white/20">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Master Judge Evaluation Access Control</span>
                  </div>
                  <h3 className="text-xl font-black">
                    {schedIsEnabled ? '🟢 ALL JUDGE LOGINS ARE ENABLED' : '🔴 ALL JUDGE LOGINS ARE DISABLED (LOCKED)'}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-2xl">
                    {schedIsEnabled
                      ? 'Judges across all committees can log in with their assigned PINs and submit delegate evaluation sheets.'
                      : 'All judge logins are locked. Judges attempting to log in or save marks will be blocked.'}
                  </p>
                </div>

                {/* Bulk Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                  <button
                    onClick={() => handleSaveScheduleConfig(undefined, true)}
                    disabled={isSavingSched}
                    className={`w-full sm:w-auto font-black text-xs px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm ${
                      schedIsEnabled
                        ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Enable All Judges Logins</span>
                  </button>

                  <button
                    onClick={() => handleSaveScheduleConfig(undefined, false)}
                    disabled={isSavingSched}
                    className={`w-full sm:w-auto font-black text-xs px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm ${
                      !schedIsEnabled
                        ? 'bg-rose-500 text-white ring-2 ring-rose-300'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Disable All Judges Logins</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Timed Scheduling Form */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <span>Scheduled Evaluation Timings & Bulk Window Settings</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set specific start and end datetime windows to automatically permit judge access during official committee session hours.
                </p>
              </div>

              <form onSubmit={handleSaveScheduleConfig} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Start Time (Judge Login Opens)
                      </label>
                      {schedStartTime && (
                        <button
                          type="button"
                          onClick={() => setSchedStartTime('')}
                          className="text-[10px] text-rose-600 hover:underline font-bold"
                        >
                          Clear Start
                        </button>
                      )}
                    </div>
                    <input
                      type="datetime-local"
                      value={schedStartTime}
                      onChange={(e) => setSchedStartTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Leave empty for immediate opening (no start delay)</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        End Time (Judge Login Closes & Locks)
                      </label>
                      {schedEndTime && (
                        <button
                          type="button"
                          onClick={() => setSchedEndTime('')}
                          className="text-[10px] text-rose-600 hover:underline font-bold"
                        >
                          Clear End
                        </button>
                      )}
                    </div>
                    <input
                      type="datetime-local"
                      value={schedEndTime}
                      onChange={(e) => setSchedEndTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Leave empty to stay open indefinitely (no cutoff time)</span>
                  </div>
                </div>

                {/* Preset Shortcuts */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const pad = (n: number) => (n < 10 ? '0' + n : String(n));
                      const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
                      setSchedStartTime(`${today}T09:00`);
                      setSchedEndTime(`${today}T18:00`);
                    }}
                    className="text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition"
                  >
                    Today 9:00 AM – 6:00 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSchedStartTime('');
                      setSchedEndTime('');
                    }}
                    className="text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 transition"
                  >
                    Clear Both Timers
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Closed Portal Display Message for Judges
                  </label>
                  <input
                    type="text"
                    value={schedMessage}
                    onChange={(e) => setSchedMessage(e.target.value)}
                    placeholder="e.g. Judge Evaluation Portal is currently disabled by Master Admin."
                    className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 rounded-xl p-2.5 text-xs font-medium text-slate-900 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-500">
                    Current Status: <strong className={schedIsEnabled ? 'text-emerald-700' : 'text-rose-700'}>{schedIsEnabled ? 'ENABLED' : 'DISABLED'}</strong>
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingSched}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingSched ? 'Saving...' : 'Save Schedule Settings'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* All Committees Judges Status Summary Grid */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Committee Judges Active Access Status</span>
                </h4>
                <span className="text-xs font-mono text-slate-500">{committeesList.length * 3} Total Judge Accounts</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {committeesList.map((comm) => (
                  <div key={comm.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between border-b pb-1.5">
                      <span className="font-black text-xs text-indigo-900">{comm.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${schedIsEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {schedIsEnabled ? 'Login Allowed' : 'Blocked'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="bg-white p-1.5 rounded border text-slate-700 font-semibold">
                          <div>Judge {j}</div>
                          <div className={`font-mono text-[9px] font-bold ${schedIsEnabled ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {schedIsEnabled ? 'Active' : 'Locked'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL 1: EDIT DELEGATE ================= */}
      {editingDelegate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-600" />
                <span>Edit Delegate Details</span>
              </h3>
              <button
                onClick={() => setEditingDelegate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedDelegate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Committee</label>
                <select
                  value={editingDelegate.committeeId}
                  onChange={(e) =>
                    setEditingDelegate({
                      ...editingDelegate,
                      committeeId: e.target.value as CommitteeId,
                    })
                  }
                  className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-semibold"
                >
                  {committeesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">SL No</label>
                <input
                  type="number"
                  required
                  value={editingDelegate.slNo}
                  onChange={(e) =>
                    setEditingDelegate({
                      ...editingDelegate,
                      slNo: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Delegate Student Name</label>
                <input
                  type="text"
                  required
                  value={editingDelegate.delegateName}
                  onChange={(e) =>
                    setEditingDelegate({
                      ...editingDelegate,
                      delegateName: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Portfolio / Country Name</label>
                <input
                  type="text"
                  required
                  value={editingDelegate.portfolio}
                  onChange={(e) =>
                    setEditingDelegate({
                      ...editingDelegate,
                      portfolio: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingDelegate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT COMMITTEE ================= */}
      {editingCommittee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Edit Committee Info</span>
              </h3>
              <button
                onClick={() => setEditingCommittee(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedCommittee} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Committee Code / ID</label>
                <input
                  type="text"
                  disabled
                  value={editingCommittee.id}
                  className="w-full bg-slate-100 border text-slate-500 rounded-xl p-2.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Short Name</label>
                <input
                  type="text"
                  required
                  value={editingCommittee.name}
                  onChange={(e) =>
                    setEditingCommittee({
                      ...editingCommittee,
                      name: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Full Name / Description</label>
                <input
                  type="text"
                  required
                  value={editingCommittee.fullName}
                  onChange={(e) =>
                    setEditingCommittee({
                      ...editingCommittee,
                      fullName: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCommittee(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Save Committee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: RENAME PORTFOLIO ================= */}
      {editingPortfolio && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-600" />
                <span>Rename Country / Portfolio in {editingPortfolio.committeeId}</span>
              </h3>
              <button
                onClick={() => setEditingPortfolio(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedPortfolio} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Current Name</label>
                <input
                  type="text"
                  disabled
                  value={editingPortfolio.oldPortfolio}
                  className="w-full bg-slate-100 border text-slate-500 rounded-xl p-2.5 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">New Country / Portfolio Name</label>
                <input
                  type="text"
                  required
                  value={editingPortfolio.newPortfolio}
                  onChange={(e) =>
                    setEditingPortfolio({
                      ...editingPortfolio,
                      newPortfolio: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPortfolio(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Rename Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: BULK DELEGATE IMPORT ================= */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl p-6 space-y-5 my-8">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                  <Upload className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Bulk Import Delegates
                  </h3>
                  <p className="text-xs text-slate-500">
                    Import multiple delegates via copy-paste or CSV file upload.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkImportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkImportStatusMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bulkImportStatusMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Committee
                </label>
                <select
                  value={bulkTargetCommittee}
                  onChange={(e) => setBulkTargetCommittee(e.target.value as CommitteeId)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900"
                >
                  {committeesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.fullName}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Used if committee is omitted in line data</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload CSV or TXT File
                </label>
                <label className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-700 cursor-pointer transition">
                  <FileUp className="w-4 h-4 text-indigo-600" />
                  <span>Choose File (.csv, .txt)</span>
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-slate-400 mt-1 block">Auto-reads file contents into box below</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Import Mode Action
                </label>
                <select
                  value={bulkImportMode}
                  onChange={(e) => setBulkImportMode(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900"
                >
                  <option value="append">Append to Existing Delegates</option>
                  <option value="replace_committee">Replace Only {bulkTargetCommittee} Delegates</option>
                  <option value="replace_all">Replace ALL Delegates in System</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Choose whether to add or replace</span>
              </div>
            </div>

            {/* Quick Templates Buttons */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600">Sample Data Templates:</span>
              <button
                type="button"
                onClick={() => {
                  setBulkRawText(`SlNo, Committee, Delegate Name, Portfolio
1, UNSC, Aarav Sharma, United States
2, UNSC, Priya Patel, United Kingdom
3, UNSC, Rohan Gupta, France
4, UNSC, Vikram Singh, Russian Federation
5, UNSC, Ananya Rao, China`);
                }}
                className="text-[10px] font-bold bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg transition"
              >
                UNSC Sample CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkRawText(`SlNo, Committee, Delegate Name, Portfolio
1, UNSC, Aarav Sharma, United States
2, UNHRC, Ananya Rao, India
3, WHO, Rahul Verma, Germany
4, UNESCO, Sanya Malhotra, Japan
5, DISEC, Aditya Nair, Brazil`);
                }}
                className="text-[10px] font-bold bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg transition"
              >
                Multi-Committee CSV
              </button>
              <button
                type="button"
                onClick={() => setBulkRawText('')}
                className="text-[10px] font-bold bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg transition ml-auto"
              >
                Clear Text
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Paste CSV / Tab-Separated Delegates Data:
              </label>
              <textarea
                rows={6}
                value={bulkRawText}
                onChange={(e) => setBulkRawText(e.target.value)}
                placeholder={`Paste lines here, e.g.:\nSlNo, Committee, Delegate Name, Portfolio\n1, UNSC, Aarav Sharma, United States\n2, UNHRC, Priya Patel, India\n3, WHO, Rohan Gupta, Germany`}
                className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 rounded-xl p-3 text-xs font-mono text-slate-900 outline-none leading-relaxed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Supported formats: <strong>SlNo, Committee, Name, Portfolio</strong> OR <strong>Name, Portfolio</strong> (Comma or Tab separated)
              </span>
            </div>

            {/* Live Preview Table */}
            {parsedBulkDelegates.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 space-y-2 p-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Parsed Preview: {parsedBulkDelegates.length} Delegates Ready</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(parsedBulkDelegates.map((d) => d.committeeId))).map((cid) => (
                      <span key={cid} className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                        {cid}: {parsedBulkDelegates.filter((d) => d.committeeId === cid).length}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="max-h-40 overflow-y-auto divide-y divide-slate-200">
                  {parsedBulkDelegates.map((d, idx) => (
                    <div key={idx} className="grid grid-cols-12 text-[11px] py-1.5 px-1 font-mono text-slate-700">
                      <span className="col-span-1 font-bold text-slate-500">#{d.slNo}</span>
                      <span className="col-span-2 font-black text-indigo-900">{d.committeeId}</span>
                      <span className="col-span-5 font-medium text-slate-900 font-sans">{d.delegateName}</span>
                      <span className="col-span-4 text-slate-600 font-sans">{d.portfolio}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end items-center gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowBulkImportModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isImportingBulk || parsedBulkDelegates.length === 0}
                onClick={handleExecuteBulkImport}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {isImportingBulk
                    ? 'Importing...'
                    : `Confirm Import (${parsedBulkDelegates.length} Delegates)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: RESET JUDGES MARKS (SINGLE SHOT) ================= */}
      {showResetMarksModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-lg p-6 space-y-5 my-8">
            <div className="flex justify-between items-start border-b border-rose-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full w-fit mb-1">
                    Single-Shot Critical Operation
                  </div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Reset Judges Evaluation Marks
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowResetMarksModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetStatusMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs rounded-2xl flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{resetStatusMsg}</span>
              </div>
            ) : (
              <>
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-2 text-rose-950">
                  <p className="font-bold">
                    ⚠️ Are you sure you want to clear all judge marks in a single shot?
                  </p>
                  <p className="text-rose-800 leading-relaxed">
                    This action will permanently wipe and erase all entered evaluation marks, rubric scores, and comments for Judge 1, Judge 2, and Judge 3.
                  </p>
                  <div className="bg-white/80 border border-rose-200 p-2.5 rounded-xl font-mono text-[11px] font-bold text-rose-900 flex items-center justify-between">
                    <span>Current Active Evaluations in Database:</span>
                    <span className="bg-rose-200 text-rose-950 px-2 py-0.5 rounded">{Object.keys(scores).length} Score Entries</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Committee Scope to Reset:
                  </label>
                  <select
                    value={resetTargetCommittee}
                    onChange={(e) => setResetTargetCommittee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                  >
                    <option value="ALL">🔴 ALL COMMITTEES (Single-Shot System Reset)</option>
                    {committeesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.fullName} Only
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end items-center gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowResetMarksModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isResettingScores}
                    onClick={handleExecuteResetMarks}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      {isResettingScores
                        ? 'Clearing Marks...'
                        : resetTargetCommittee === 'ALL'
                        ? 'Clear ALL Judges Marks (Single Shot)'
                        : `Clear ${resetTargetCommittee} Marks`}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
