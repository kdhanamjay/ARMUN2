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
  committees?: CommitteeInfo[];
  delegates: Delegate[];
  scores: Record<string, RubricScore>;
  judgePins: Record<string, string>;
  judgeNames?: Record<string, string>;
  adminPin: string;
  userRole?: UserRole;
  judgePortalSchedule?: JudgePortalSchedule;
  onManageCommittee?: (payload: {
    action: 'add' | 'edit' | 'delete' | 'bulk_add' | 'bulk_replace' | 'bulk_delete';
    committee?: any;
    committeesList?: CommitteeInfo[];
    id?: string;
    targetIds?: string[];
    deleteAll?: boolean;
  }) => Promise<any>;
  onAddDelegate: (delegate: Partial<Delegate>) => Promise<void>;
  onEditDelegate: (delegate: Delegate) => Promise<void>;
  onDeleteDelegate: (delegateId: string) => Promise<void>;
  onBulkDeleteDelegates?: (payload: {
    targetIds?: string[];
    committeeId?: CommitteeId | 'ALL';
    deleteAll?: boolean;
  }) => Promise<any>;
  onBulkImportDelegates?: (payload: {
    action: 'bulk_append' | 'bulk_replace' | 'bulk_replace_committee';
    delegatesList: Delegate[];
    committeeId?: CommitteeId;
  }) => Promise<void>;
  onUpdatePins: (payload: { newAdminPin?: string; newJudgePins?: Record<string, string>; newJudgeNames?: Record<string, string> }) => Promise<void>;
  onManageJudges?: (payload: {
    action: 'edit' | 'delete' | 'bulk_add' | 'bulk_delete' | 'reset_passwords';
    committeeId?: CommitteeId;
    judgeIndex?: number;
    judgeName?: string;
    pin?: string;
    judgesList?: any[];
    targetKeys?: string[];
  }) => Promise<any>;
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
  committees,
  delegates,
  scores,
  judgePins,
  judgeNames = {},
  adminPin,
  userRole = 'admin',
  judgePortalSchedule,
  onManageCommittee,
  onAddDelegate,
  onEditDelegate,
  onDeleteDelegate,
  onBulkDeleteDelegates,
  onBulkImportDelegates,
  onUpdatePins,
  onManageJudges,
  onResetScores,
  onOpenPhpExporter,
  onOpenPrintModal,
  onUpdateScore,
  onUpdateJudgeSchedule,
}) => {
  const [activeTab, setActiveTab] = useState<'master' | 'committees' | 'delegates' | 'pins' | 'schedule'>('master');
  const [committeesList, setCommitteesList] = useState<CommitteeInfo[]>(
    committees && Array.isArray(committees) && committees.length > 0 ? committees : [...DEFAULT_COMMITTEES]
  );
  const [selectedCommittee, setSelectedCommittee] = useState<CommitteeId>('UNSC');

  useEffect(() => {
    if (committees && Array.isArray(committees) && committees.length > 0) {
      setCommitteesList(committees);
    }
  }, [committees]);

  // Bulk Add Committees Modal State
  const [showBulkAddCommitteesModal, setShowBulkAddCommitteesModal] = useState(false);
  const [bulkCommitteesRawText, setBulkCommitteesRawText] = useState('');
  const [bulkCommitteesImportMode, setBulkCommitteesImportMode] = useState<'append' | 'replace'>('append');
  const [isBulkAddingCommittees, setIsBulkAddingCommittees] = useState(false);
  const [bulkCommitteesStatusMsg, setBulkCommitteesStatusMsg] = useState<string | null>(null);

  // Bulk Delete Committees Modal State
  const [showBulkDeleteCommitteesModal, setShowBulkDeleteCommitteesModal] = useState(false);
  const [selectedDeleteCommitteeIds, setSelectedDeleteCommitteeIds] = useState<string[]>([]);
  const [isBulkDeletingCommittees, setIsBulkDeletingCommittees] = useState(false);
  const [bulkDeleteCommitteesStatusMsg, setBulkDeleteCommitteesStatusMsg] = useState<string | null>(null);

  // Search filter & inline multi-select for delegates
  const [delegateSearchQuery, setDelegateSearchQuery] = useState('');
  const [selectedDelegateIdsForDelete, setSelectedDelegateIdsForDelete] = useState<string[]>([]);
  const [delegateDeleteStatusMsg, setDelegateDeleteStatusMsg] = useState<string | null>(null);

  // Bulk Delete Delegates Modal State
  const [showBulkDeleteDelegatesModal, setShowBulkDeleteDelegatesModal] = useState(false);
  const [bulkDeleteDelTargetComm, setBulkDeleteDelTargetComm] = useState<string>('ALL');
  const [bulkDeleteDelTargetIds, setBulkDeleteDelTargetIds] = useState<string[]>([]);
  const [isBulkDeletingDelegates, setIsBulkDeletingDelegates] = useState(false);
  const [bulkDeleteDelStatusMsg, setBulkDeleteDelStatusMsg] = useState<string | null>(null);

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

  // PIN & Judge Management state
  const [editJudgePins, setEditJudgePins] = useState<Record<string, string>>({ ...DEFAULT_JUDGE_PINS, ...judgePins });
  const [editJudgeNames, setEditJudgeNames] = useState<Record<string, string>>({ ...judgeNames });
  const [editAdminPin, setEditAdminPin] = useState(adminPin);
  const [pinUpdateStatus, setPinUpdateStatus] = useState<string | null>(null);

  useEffect(() => {
    setEditJudgePins((prev) => ({ ...DEFAULT_JUDGE_PINS, ...judgePins }));
  }, [judgePins]);

  useEffect(() => {
    setEditJudgeNames((prev) => ({ ...judgeNames }));
  }, [judgeNames]);

  // Manage Judges Modals state
  const [showManageJudgesModal, setShowManageJudgesModal] = useState(false);
  const [manageJudgesFilterComm, setManageJudgesFilterComm] = useState<string>('ALL');

  // Single Edit Judge modal
  const [editingJudgeSlot, setEditingJudgeSlot] = useState<{
    committeeId: CommitteeId;
    judgeIndex: number;
    name: string;
    pin: string;
  } | null>(null);

  // Bulk Add Judges modal
  const [showBulkAddJudgesModal, setShowBulkAddJudgesModal] = useState(false);
  const [bulkJudgesRawText, setBulkJudgesRawText] = useState('');
  const [bulkJudgesTargetComm, setBulkJudgesTargetComm] = useState<string>('ALL');
  const [isBulkAddingJudges, setIsBulkAddingJudges] = useState(false);
  const [bulkJudgesStatusMsg, setBulkJudgesStatusMsg] = useState<string | null>(null);

  // Bulk Delete Judges modal
  const [showBulkDeleteJudgesModal, setShowBulkDeleteJudgesModal] = useState(false);
  const [bulkDeleteTargetComm, setBulkDeleteTargetComm] = useState<string>('ALL');
  const [selectedDeleteJudgeKeys, setSelectedDeleteJudgeKeys] = useState<string[]>([]);
  const [isBulkDeletingJudges, setIsBulkDeletingJudges] = useState(false);

  // Reset Judges Passwords modal (unique 4-digit numeric PINs)
  const [showResetJudgePasswordsModal, setShowResetJudgePasswordsModal] = useState(false);
  const [resetPassTargetComm, setResetPassTargetComm] = useState<string>('ALL');
  const [isResettingJudgePasswords, setIsResettingJudgePasswords] = useState(false);
  const [resetPassStatusMsg, setResetPassStatusMsg] = useState<string | null>(null);

  // Handle adding new committee
  const handleAddCommitteeSubmit = async (e: React.FormEvent) => {
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

    if (onManageCommittee) {
      await onManageCommittee({ action: 'add', committee: newComm });
    } else {
      setCommitteesList((prev) => [...prev, newComm]);
    }

    setSelectedCommittee(idFormatted);
    setNewCommId('');
    setNewCommName('');
    setNewCommFullName('');
  };

  // Handle saving edited committee
  const handleSaveEditedCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommittee) return;

    if (onManageCommittee) {
      await onManageCommittee({ action: 'edit', committee: editingCommittee });
    } else {
      setCommitteesList((prev) =>
        prev.map((c) => (c.id === editingCommittee.id ? editingCommittee : c))
      );
    }
    setEditingCommittee(null);
  };

  // Handle deleting committee
  const handleDeleteCommittee = async (commId: CommitteeId) => {
    const committeeDelegates = delegates.filter((d) => d.committeeId === commId);
    const confirmMessage = `Are you sure you want to delete committee ${commId}?` +
      (committeeDelegates.length > 0 ? ` This will also delete ${committeeDelegates.length} delegate(s)/countries in this committee.` : '');

    if (!window.confirm(confirmMessage)) return;

    if (onManageCommittee) {
      await onManageCommittee({ action: 'delete', id: commId });
    } else {
      setCommitteesList((prev) => prev.filter((c) => c.id !== commId));
      for (const del of committeeDelegates) {
        await onDeleteDelegate(del.id);
      }
    }

    if (selectedCommittee === commId) {
      const remaining = committeesList.filter((c) => c.id !== commId);
      if (remaining.length > 0) setSelectedCommittee(remaining[0].id);
    }
  };

  // Execute Bulk Add Committees
  const handleExecuteBulkAddCommittees = async () => {
    if (!bulkCommitteesRawText.trim()) return;
    setIsBulkAddingCommittees(true);
    setBulkCommitteesStatusMsg(null);

    try {
      const lines = bulkCommitteesRawText.split('\n').map((l) => l.trim()).filter(Boolean);
      const parsedCommittees: CommitteeInfo[] = [];

      lines.forEach((line) => {
        let id = '';
        let name = '';
        let fullName = '';

        if (line.includes('|')) {
          const parts = line.split('|').map((p) => p.trim());
          id = (parts[0] || '').toUpperCase();
          name = parts[1] || id;
          fullName = parts[2] || name || id;
        } else if (line.includes(',')) {
          const parts = line.split(',').map((p) => p.trim());
          id = (parts[0] || '').toUpperCase();
          name = parts[1] || id;
          fullName = parts[2] || name || id;
        } else {
          id = line.toUpperCase();
          name = id;
          fullName = id;
        }

        if (id) {
          parsedCommittees.push({ id: id as CommitteeId, name, fullName });
        }
      });

      if (parsedCommittees.length === 0) {
        setBulkCommitteesStatusMsg('❌ No valid committee lines found.');
        return;
      }

      if (onManageCommittee) {
        const action = bulkCommitteesImportMode === 'replace' ? 'bulk_replace' : 'bulk_add';
        await onManageCommittee({ action, committeesList: parsedCommittees });
      } else {
        if (bulkCommitteesImportMode === 'replace') {
          setCommitteesList(parsedCommittees);
        } else {
          setCommitteesList((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const newOnes = parsedCommittees.filter((c) => !existingIds.has(c.id));
            return [...prev, ...newOnes];
          });
        }
      }

      setBulkCommitteesStatusMsg(`🟢 Successfully processed ${parsedCommittees.length} committee(s)!`);
      setTimeout(() => {
        setShowBulkAddCommitteesModal(false);
        setBulkCommitteesRawText('');
        setBulkCommitteesStatusMsg(null);
      }, 1500);
    } catch (err) {
      setBulkCommitteesStatusMsg('❌ Failed to bulk add committees.');
    } finally {
      setIsBulkAddingCommittees(false);
    }
  };

  // Execute Bulk Delete Committees
  const handleExecuteBulkDeleteCommittees = async () => {
    if (selectedDeleteCommitteeIds.length === 0) return;
    const isAll = selectedDeleteCommitteeIds.length === committeesList.length;

    const confirmMsg = `Are you sure you want to delete the ${selectedDeleteCommitteeIds.length} selected committee(s)?` +
      ` All delegates/countries in these committees will also be deleted.`;

    if (!window.confirm(confirmMsg)) return;

    setIsBulkDeletingCommittees(true);
    setBulkDeleteCommitteesStatusMsg(null);

    try {
      if (onManageCommittee) {
        await onManageCommittee({
          action: 'bulk_delete',
          targetIds: selectedDeleteCommitteeIds,
          deleteAll: isAll,
        });
      } else {
        const idSet = new Set(selectedDeleteCommitteeIds);
        setCommitteesList((prev) => prev.filter((c) => !idSet.has(c.id)));
        const delegatesToDelete = delegates.filter((d) => idSet.has(d.committeeId));
        for (const del of delegatesToDelete) {
          await onDeleteDelegate(del.id);
        }
      }

      setBulkDeleteCommitteesStatusMsg(`🟢 Successfully deleted ${selectedDeleteCommitteeIds.length} committee(s).`);
      setSelectedDeleteCommitteeIds([]);
      setTimeout(() => {
        setShowBulkDeleteCommitteesModal(false);
        setBulkDeleteCommitteesStatusMsg(null);
      }, 1500);
    } catch (err) {
      setBulkDeleteCommitteesStatusMsg('❌ Failed to bulk delete committees.');
    } finally {
      setIsBulkDeletingCommittees(false);
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

  // --- DELEGATE DELETION HANDLERS ---
  const handleSingleDeleteDelegate = async (delId: string, delName: string, delPortfolio: string) => {
    if (!window.confirm(`Are you sure you want to delete delegate "${delName}" (${delPortfolio})? This action cannot be undone.`)) {
      return;
    }
    try {
      await onDeleteDelegate(delId);
      setSelectedDelegateIdsForDelete((prev) => prev.filter((id) => id !== delId));
      setDelegateDeleteStatusMsg(`Deleted delegate "${delName}" successfully.`);
      setTimeout(() => setDelegateDeleteStatusMsg(null), 3000);
    } catch (err) {
      alert('Failed to delete delegate.');
    }
  };

  const handleExecuteInlineBulkDeleteDelegates = async () => {
    if (selectedDelegateIdsForDelete.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete the ${selectedDelegateIdsForDelete.length} selected delegate(s)?`)) {
      return;
    }
    try {
      if (onBulkDeleteDelegates) {
        await onBulkDeleteDelegates({ targetIds: selectedDelegateIdsForDelete });
      } else {
        for (const id of selectedDelegateIdsForDelete) {
          await onDeleteDelegate(id);
        }
      }
      setDelegateDeleteStatusMsg(`Successfully deleted ${selectedDelegateIdsForDelete.length} delegate(s).`);
      setSelectedDelegateIdsForDelete([]);
      setTimeout(() => setDelegateDeleteStatusMsg(null), 4000);
    } catch (err) {
      alert('Failed to bulk delete selected delegates.');
    }
  };

  const handleExecuteModalBulkDeleteDelegates = async () => {
    setIsBulkDeletingDelegates(true);
    setBulkDeleteDelStatusMsg(null);
    try {
      let count = 0;
      if (bulkDeleteDelTargetIds.length > 0) {
        count = bulkDeleteDelTargetIds.length;
        if (onBulkDeleteDelegates) {
          await onBulkDeleteDelegates({ targetIds: bulkDeleteDelTargetIds });
        } else {
          for (const id of bulkDeleteDelTargetIds) {
            await onDeleteDelegate(id);
          }
        }
      } else if (bulkDeleteDelTargetComm === 'ALL') {
        count = delegates.length;
        if (onBulkDeleteDelegates) {
          await onBulkDeleteDelegates({ deleteAll: true });
        } else {
          for (const del of delegates) {
            await onDeleteDelegate(del.id);
          }
        }
      } else {
        const commDels = delegates.filter((d) => d.committeeId === bulkDeleteDelTargetComm);
        count = commDels.length;
        if (onBulkDeleteDelegates) {
          await onBulkDeleteDelegates({ committeeId: bulkDeleteDelTargetComm as CommitteeId });
        } else {
          for (const del of commDels) {
            await onDeleteDelegate(del.id);
          }
        }
      }

      setBulkDeleteDelStatusMsg(`Successfully deleted ${count} delegate record(s).`);
      setSelectedDelegateIdsForDelete([]);
      setBulkDeleteDelTargetIds([]);
      setTimeout(() => {
        setShowBulkDeleteDelegatesModal(false);
        setBulkDeleteDelStatusMsg(null);
      }, 1800);
    } catch (err) {
      alert('Error performing bulk delegate deletion.');
    } finally {
      setIsBulkDeletingDelegates(false);
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

      parts = parts.map((p) => p.replace(/^["']|["']$/g, '').trim()).filter((p) => p.length > 0);
      if (parts.length === 0) return;

      const firstColLower = (parts[0] || '').toLowerCase();
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
      } else if (parts.length === 1) {
        portfolio = parts[0];
        delegateName = `Delegate (${parts[0]})`;
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
        newJudgeNames: editJudgeNames,
      });
      setPinUpdateStatus('PINs & Judge Names updated successfully!');
      setTimeout(() => setPinUpdateStatus(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Save single judge name and PIN
  const handleSaveSingleJudge = async (committeeId: CommitteeId, judgeIndex: number, judgeName: string, pin: string) => {
    try {
      if (onManageJudges) {
        await onManageJudges({
          action: 'edit',
          committeeId,
          judgeIndex,
          judgeName,
          pin,
        });
      } else {
        const key = `${committeeId}-${judgeIndex}`;
        const newNames = { ...editJudgeNames, [key]: judgeName };
        const newPins = { ...editJudgePins, [key]: pin };
        setEditJudgeNames(newNames);
        setEditJudgePins(newPins);
        await onUpdatePins({ newJudgePins: newPins, newJudgeNames: newNames });
      }
      setEditingJudgeSlot(null);
    } catch (e) {
      alert('Failed to save judge details.');
    }
  };

  // Delete single judge
  const handleDeleteSingleJudge = async (committeeId: CommitteeId, judgeIndex: number) => {
    if (!window.confirm(`Are you sure you want to delete credentials for Judge ${judgeIndex} (${committeeId})?`)) return;
    try {
      if (onManageJudges) {
        await onManageJudges({
          action: 'delete',
          committeeId,
          judgeIndex,
        });
      } else {
        const key = `${committeeId}-${judgeIndex}`;
        const newNames = { ...editJudgeNames };
        const newPins = { ...editJudgePins };
        delete newNames[key];
        delete newPins[key];
        setEditJudgeNames(newNames);
        setEditJudgePins(newPins);
        await onUpdatePins({ newJudgePins: newPins, newJudgeNames: newNames });
      }
    } catch (e) {
      alert('Failed to delete judge.');
    }
  };

  // Bulk Add Judges
  const handleExecuteBulkAddJudges = async () => {
    if (!bulkJudgesRawText.trim()) {
      alert('Please enter or paste judges data first.');
      return;
    }

    setIsBulkAddingJudges(true);
    setBulkJudgesStatusMsg(null);

    try {
      const lines = bulkJudgesRawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      const newJudgesList: Array<{ committeeId: string; judgeIndex: number; judgeName?: string; pin?: string }> = [];

      const slotCounter: Record<string, number> = {};

      for (const line of lines) {
        if (line.toLowerCase().startsWith('committee') || line.toLowerCase().startsWith('code')) continue;

        const parts = line.split(/[,;\t|]+/).map((p) => p.trim());
        let cid = bulkJudgesTargetComm !== 'ALL' ? bulkJudgesTargetComm : 'UNSC';
        let slot = 1;
        let name = '';
        let pin = '';

        if (parts.length >= 4) {
          cid = parts[0].toUpperCase();
          slot = parseInt(parts[1], 10) || 1;
          name = parts[2];
          pin = parts[3];
        } else if (parts.length === 3) {
          cid = parts[0].toUpperCase();
          if (!isNaN(parseInt(parts[1], 10)) && parts[1].length <= 2) {
            slot = parseInt(parts[1], 10);
            name = parts[2];
          } else {
            slotCounter[cid] = (slotCounter[cid] || 0) + 1;
            slot = slotCounter[cid];
            name = parts[1];
            pin = parts[2];
          }
        } else if (parts.length === 2) {
          cid = parts[0].toUpperCase();
          slotCounter[cid] = (slotCounter[cid] || 0) + 1;
          slot = slotCounter[cid];
          name = parts[1];
        } else if (parts.length === 1) {
          cid = bulkJudgesTargetComm !== 'ALL' ? bulkJudgesTargetComm : 'UNSC';
          slotCounter[cid] = (slotCounter[cid] || 0) + 1;
          slot = slotCounter[cid];
          name = parts[0];
        }

        if (!pin || pin.length !== 4 || isNaN(Number(pin))) {
          pin = Math.floor(1000 + Math.random() * 9000).toString();
        }

        newJudgesList.push({
          committeeId: cid,
          judgeIndex: slot,
          judgeName: name,
          pin,
        });
      }

      if (newJudgesList.length === 0) {
        alert('No valid judge entries recognized.');
        setIsBulkAddingJudges(false);
        return;
      }

      if (onManageJudges) {
        await onManageJudges({
          action: 'bulk_add',
          judgesList: newJudgesList,
        });
      } else {
        const newNames = { ...editJudgeNames };
        const newPins = { ...editJudgePins };
        newJudgesList.forEach((j) => {
          const k = `${j.committeeId}-${j.judgeIndex}`;
          if (j.judgeName) newNames[k] = j.judgeName;
          if (j.pin) newPins[k] = j.pin;
        });
        setEditJudgeNames(newNames);
        setEditJudgePins(newPins);
        await onUpdatePins({ newJudgePins: newPins, newJudgeNames: newNames });
      }

      setBulkJudgesStatusMsg(`🟢 Successfully added / updated ${newJudgesList.length} judge account(s)!`);
      setTimeout(() => {
        setBulkJudgesStatusMsg(null);
        setShowBulkAddJudgesModal(false);
        setBulkJudgesRawText('');
      }, 1800);
    } catch (e) {
      alert('Error bulk adding judges.');
    } finally {
      setIsBulkAddingJudges(false);
    }
  };

  // Bulk Delete Judges
  const handleExecuteBulkDeleteJudges = async () => {
    setIsBulkDeletingJudges(true);
    try {
      if (onManageJudges) {
        await onManageJudges({
          action: 'bulk_delete',
          committeeId: bulkDeleteTargetComm !== 'ALL' ? (bulkDeleteTargetComm as CommitteeId) : undefined,
          targetKeys: selectedDeleteJudgeKeys.length > 0 ? selectedDeleteJudgeKeys : undefined,
        });
      } else {
        const newNames = { ...editJudgeNames };
        const newPins = { ...editJudgePins };
        if (selectedDeleteJudgeKeys.length > 0) {
          selectedDeleteJudgeKeys.forEach((k) => {
            delete newNames[k];
            delete newPins[k];
          });
        } else if (bulkDeleteTargetComm !== 'ALL') {
          Object.keys(newPins).forEach((k) => {
            if (k.startsWith(`${bulkDeleteTargetComm}-`)) {
              delete newNames[k];
              delete newPins[k];
            }
          });
        }
        setEditJudgeNames(newNames);
        setEditJudgePins(newPins);
        await onUpdatePins({ newJudgePins: newPins, newJudgeNames: newNames });
      }

      setShowBulkDeleteJudgesModal(false);
      setSelectedDeleteJudgeKeys([]);
    } catch (e) {
      alert('Error bulk deleting judges.');
    } finally {
      setIsBulkDeletingJudges(false);
    }
  };

  // Reset Judges Passwords (unique 4-digit numeric PINs)
  const handleExecuteResetJudgesPasswords = async () => {
    setIsResettingJudgePasswords(true);
    setResetPassStatusMsg(null);
    try {
      let keysToReset: string[] = [];
      if (resetPassTargetComm === 'ALL') {
        committeesList.forEach((c) => {
          [1, 2, 3].forEach((j) => keysToReset.push(`${c.id}-${j}`));
        });
        Object.keys(editJudgePins).forEach((k) => {
          if (!keysToReset.includes(k)) keysToReset.push(k);
        });
      } else {
        [1, 2, 3].forEach((j) => keysToReset.push(`${resetPassTargetComm}-${j}`));
        Object.keys(editJudgePins).forEach((k) => {
          if (k.startsWith(`${resetPassTargetComm}-`) && !keysToReset.includes(k)) {
            keysToReset.push(k);
          }
        });
      }

      const usedPins = new Set<string>();
      const newPins: Record<string, string> = { ...editJudgePins };

      keysToReset.forEach((key) => {
        let randPin = '';
        do {
          randPin = Math.floor(1000 + Math.random() * 9000).toString();
        } while (usedPins.has(randPin));
        usedPins.add(randPin);
        newPins[key] = randPin;
      });

      if (onManageJudges) {
        await onManageJudges({
          action: 'reset_passwords',
          targetKeys: keysToReset,
        });
      } else {
        setEditJudgePins(newPins);
        await onUpdatePins({ newJudgePins: newPins });
      }

      setResetPassStatusMsg(`🟢 Successfully generated unique 4-digit passwords for ${keysToReset.length} judge(s)!`);
      setTimeout(() => {
        setResetPassStatusMsg(null);
        setShowResetJudgePasswordsModal(false);
      }, 1800);
    } catch (e) {
      alert('Failed to reset judge passwords.');
    } finally {
      setIsResettingJudgePasswords(false);
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
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Registered Committees & Country Portfolios ({committeesList.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Manage committee definitions, add/edit/delete committees and countries in bulk or individually.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkAddCommitteesModal(true)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Bulk Add Committees</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBulkDeleteCommitteesModal(true)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Bulk Delete Committees</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBulkImportModal(true)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Bulk Add Countries</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBulkDeleteDelegatesModal(true)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Bulk Delete Countries</span>
                    </button>
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

                  <button
                    type="button"
                    onClick={() => {
                      setBulkDeleteDelTargetComm(selectedCommittee);
                      setShowBulkDeleteDelegatesModal(true);
                    }}
                    className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-xl text-xs transition border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Bulk Delete</span>
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

              {delegateDeleteStatusMsg && (
                <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{delegateDeleteStatusMsg}</span>
                </div>
              )}

              {/* Multi-Select Toolbar for Quick Deletion */}
              <div className="p-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={
                      filteredDelegates.length > 0 &&
                      filteredDelegates.every((d) => selectedDelegateIdsForDelete.includes(d.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        const allFilteredIds = filteredDelegates.map((d) => d.id);
                        setSelectedDelegateIdsForDelete(
                          Array.from(new Set([...selectedDelegateIdsForDelete, ...allFilteredIds]))
                        );
                      } else {
                        const filteredSet = new Set(filteredDelegates.map((d) => d.id));
                        setSelectedDelegateIdsForDelete(
                          selectedDelegateIdsForDelete.filter((id) => !filteredSet.has(id))
                        );
                      }
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-700 text-[11px]">Select All Filtered</span>
                </div>

                {selectedDelegateIdsForDelete.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                      {selectedDelegateIdsForDelete.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={handleExecuteInlineBulkDeleteDelegates}
                      className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition shadow-xs"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Selected</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDelegateIdsForDelete([])}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <div className="divide-y max-h-[520px] overflow-y-auto">
                {filteredDelegates.length > 0 ? (
                  filteredDelegates.map((del) => {
                    const isChecked = selectedDelegateIdsForDelete.includes(del.id);
                    return (
                      <div
                        key={del.id}
                        className={`p-3.5 flex items-center justify-between hover:bg-slate-50 transition ${
                          isChecked ? 'bg-indigo-50/60' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDelegateIdsForDelete([...selectedDelegateIdsForDelete, del.id]);
                              } else {
                                setSelectedDelegateIdsForDelete(
                                  selectedDelegateIdsForDelete.filter((id) => id !== del.id)
                                );
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
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
                            onClick={() => handleSingleDeleteDelegate(del.id, del.delegateName, del.portfolio)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Delegate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs italic">
                    No delegates found matching search query.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: MANAGE JUDGES & SECURITY PINS ================= */}
        {activeTab === 'pins' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-5xl space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-base">Judges Directory, Names & PIN Credentials</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Manage committee judge accounts, edit judge names, set 4-digit PIN passwords, perform bulk operations, or generate PDF directory.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowManageJudgesModal(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Manage Judges</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBulkAddJudgesModal(true)}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bulk Add Judges</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBulkDeleteJudgesModal(true)}
                  className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3.5 py-2 rounded-xl text-xs transition border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bulk Delete Judges</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowResetJudgePasswordsModal(true)}
                  className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold px-3.5 py-2 rounded-xl text-xs transition border border-amber-300"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reset Judges Passwords</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportCredentialsPDF(editAdminPin, editJudgePins, committeesList, editJudgeNames)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Generate Passwords PDF</span>
                </button>
              </div>
            </div>

            {pinUpdateStatus && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{pinUpdateStatus}</span>
              </div>
            )}

            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700">
                    Secretariat Admin Master PIN
                  </label>
                  <p className="text-[11px] text-slate-500">Master password used for Executive Admin portal login.</p>
                </div>
                <input
                  type="text"
                  value={editAdminPin}
                  onChange={(e) => setEditAdminPin(e.target.value)}
                  className="bg-white border border-slate-300 focus:border-indigo-600 rounded-xl px-3 py-2 text-xs font-mono font-bold w-48 text-center outline-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Committee Judge Cards & Credentials Editor
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">Edit judge names and 4-digit PIN passwords below</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {committeesList.map((c) => (
                    <div key={c.id} className="p-4 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl space-y-3 shadow-xs transition">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="font-extrabold text-xs text-indigo-900">
                          {c.name} <span className="text-slate-400 font-medium">({c.fullName})</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Code: {c.id}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {[1, 2, 3].map((j) => {
                          const key = `${c.id}-${j}`;
                          const currentName = editJudgeNames[key] || '';
                          const currentPin = editJudgePins[key] || DEFAULT_JUDGE_PINS[key] || '';

                          return (
                            <div key={key} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                  <Users className="w-3 h-3 text-indigo-500" />
                                  <span>Judge Slot {j}</span>
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingJudgeSlot({
                                        committeeId: c.id,
                                        judgeIndex: j,
                                        name: currentName || `Judge ${j}`,
                                        pin: currentPin,
                                      })
                                    }
                                    className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-white rounded transition"
                                    title="Edit Judge Details"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSingleJudge(c.id, j)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                    title="Delete Judge Account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-5 gap-2">
                                <div className="col-span-3">
                                  <input
                                    type="text"
                                    placeholder={`Judge ${j} Name`}
                                    value={currentName}
                                    onChange={(e) =>
                                      setEditJudgeNames({ ...editJudgeNames, [key]: e.target.value })
                                    }
                                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-lg p-1.5 text-xs font-medium text-slate-900 outline-none"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <input
                                    type="text"
                                    placeholder="4-Digit PIN"
                                    maxLength={4}
                                    value={currentPin}
                                    onChange={(e) =>
                                      setEditJudgePins({ ...editJudgePins, [key]: e.target.value })
                                    }
                                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-lg p-1.5 text-xs font-mono font-bold text-center text-slate-900 outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleSavePinChanges}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-xs flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save All Judge Names & PINs</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportCredentialsPDF(editAdminPin, editJudgePins, committeesList, editJudgeNames)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition border border-slate-300 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>Generate Passwords PDF</span>
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

      {/* ================= MODAL 6: MANAGE JUDGES DIRECTORY ================= */}
      {showManageJudgesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl p-6 space-y-5 my-8">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                  <Users className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Manage Committee Judges Directory
                  </h3>
                  <p className="text-xs text-slate-500">
                    View, edit, delete, or manage passwords for committee evaluator judge accounts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowManageJudgesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs font-bold text-slate-700 shrink-0">Filter Committee:</label>
                <select
                  value={manageJudgesFilterComm}
                  onChange={(e) => setManageJudgesFilterComm(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-900 outline-none"
                >
                  <option value="ALL">All Committees</option>
                  {committeesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowManageJudgesModal(false);
                    setShowBulkAddJudgesModal(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bulk Add</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowManageJudgesModal(false);
                    setShowBulkDeleteJudgesModal(true);
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bulk Delete</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowManageJudgesModal(false);
                    setShowResetJudgePasswordsModal(true);
                  }}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reset Passwords</span>
                </button>
              </div>
            </div>

            {/* Judges Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                    <th className="p-3">Committee</th>
                    <th className="p-3">Judge Slot</th>
                    <th className="p-3">Custom Judge Name</th>
                    <th className="p-3">Username</th>
                    <th className="p-3 text-center">4-Digit PIN</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {committeesList
                    .filter((c) => manageJudgesFilterComm === 'ALL' || c.id === manageJudgesFilterComm)
                    .flatMap((c) =>
                      [1, 2, 3].map((j) => {
                        const key = `${c.id}-${j}`;
                        const name = editJudgeNames[key] || `Judge ${j}`;
                        const pin = editJudgePins[key] || DEFAULT_JUDGE_PINS[key] || '1111';
                        const username = `${c.id.toLowerCase()}_judge${j}`;

                        return (
                          <tr key={key} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-bold text-indigo-900">{c.name} ({c.id})</td>
                            <td className="p-3 font-bold text-slate-700">Judge {j}</td>
                            <td className="p-3 font-semibold text-slate-900">{name}</td>
                            <td className="p-3 font-mono text-slate-500">{username}</td>
                            <td className="p-3 text-center">
                              <span className="font-mono font-bold bg-slate-100 border border-slate-200 text-indigo-900 px-2 py-1 rounded-md text-xs">
                                {pin}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingJudgeSlot({
                                      committeeId: c.id,
                                      judgeIndex: j,
                                      name,
                                      pin,
                                    });
                                  }}
                                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition font-bold text-[11px] flex items-center gap-1"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSingleJudge(c.id, j)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition font-bold text-[11px] flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <button
                type="button"
                onClick={() => exportCredentialsPDF(editAdminPin, editJudgePins, committeesList, editJudgeNames)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Credentials PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setShowManageJudgesModal(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 7: EDIT SINGLE JUDGE ================= */}
      {editingJudgeSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-600" />
                <span>Edit Judge Account Credentials</span>
              </h3>
              <button
                onClick={() => setEditingJudgeSlot(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Committee</label>
                  <input
                    type="text"
                    disabled
                    value={editingJudgeSlot.committeeId}
                    className="w-full bg-slate-100 border text-slate-500 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Judge Slot</label>
                  <input
                    type="text"
                    disabled
                    value={`Judge Slot ${editingJudgeSlot.judgeIndex}`}
                    className="w-full bg-slate-100 border text-slate-500 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Custom Judge Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Alice Smith"
                  value={editingJudgeSlot.name}
                  onChange={(e) =>
                    setEditingJudgeSlot({
                      ...editingJudgeSlot,
                      name: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">4-Digit Security PIN Password</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={editingJudgeSlot.pin}
                  onChange={(e) =>
                    setEditingJudgeSlot({
                      ...editingJudgeSlot,
                      pin: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingJudgeSlot(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSaveSingleJudge(
                      editingJudgeSlot.committeeId,
                      editingJudgeSlot.judgeIndex,
                      editingJudgeSlot.name,
                      editingJudgeSlot.pin
                    )
                  }
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Save Judge Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 8: BULK ADD JUDGES ================= */}
      {showBulkAddJudgesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 space-y-5 my-8">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Bulk Addition of Judges
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add or update multiple judges across committees in bulk by pasting lines.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkAddJudgesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkJudgesStatusMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bulkJudgesStatusMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Committee Scope:
                </label>
                <select
                  value={bulkJudgesTargetComm}
                  onChange={(e) => setBulkJudgesTargetComm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                >
                  <option value="ALL">Detect Committee Code from Line (e.g. UNSC, 1, Dr. Alice, 4821)</option>
                  {committeesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.fullName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sample Shortcuts */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600">Sample Templates:</span>
                <button
                  type="button"
                  onClick={() => {
                    setBulkJudgesRawText(`Committee, Slot, Judge Name, PIN
UNSC, 1, Dr. Alice Smith, 4821
UNSC, 2, Prof. John Doe, 9310
UNSC, 3, Sarah Connor, 1852`);
                  }}
                  className="text-[10px] font-bold bg-white text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg transition"
                >
                  UNSC 3-Judges Sample
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBulkJudgesRawText(`UNSC, Dr. Alice Smith
UNHRC, Prof. John Doe
ILO, Sarah Connor
UNEP, David Miller`);
                  }}
                  className="text-[10px] font-bold bg-white text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg transition"
                >
                  Multi-Committee Names Only
                </button>
                <button
                  type="button"
                  onClick={() => setBulkJudgesRawText('')}
                  className="text-[10px] font-bold bg-white text-rose-600 border border-rose-200 px-2.5 py-1 rounded-lg transition ml-auto"
                >
                  Clear Text
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paste Judge Records (1 per line):
                </label>
                <textarea
                  rows={6}
                  value={bulkJudgesRawText}
                  onChange={(e) => setBulkJudgesRawText(e.target.value)}
                  placeholder={`Format examples:\nCommittee, Slot, Judge Name, 4-Digit PIN\nUNSC, 1, Dr. Alice Smith, 4821\nUNSC, 2, Prof. John Doe, 9310\nOR if committee selected above:\nDr. Alice Smith\nProf. John Doe`}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 rounded-xl p-3 text-xs font-mono text-slate-900 outline-none leading-relaxed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  If PIN is omitted, a unique 4-digit random password will be auto-generated.
                </span>
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowBulkAddJudgesModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkAddingJudges}
                onClick={handleExecuteBulkAddJudges}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>{isBulkAddingJudges ? 'Adding Judges...' : 'Confirm Bulk Add Judges'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 9: BULK DELETE JUDGES ================= */}
      {showBulkDeleteJudgesModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-lg p-6 space-y-5 my-8">
            <div className="flex justify-between items-start border-b border-rose-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Bulk Judges Deletion
                  </h3>
                  <p className="text-xs text-slate-500">
                    Remove judge accounts and security credentials in bulk.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkDeleteJudgesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Scope to Delete:
                </label>
                <select
                  value={bulkDeleteTargetComm}
                  onChange={(e) => setBulkDeleteTargetComm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                >
                  <option value="ALL">Select specific judges below OR clear entire committee</option>
                  {committeesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      Delete All Judges for {c.name} ({c.fullName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-48 overflow-y-auto space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b pb-1">
                  <span>Select Specific Judge Slots:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDeleteJudgeKeys.length > 0) setSelectedDeleteJudgeKeys([]);
                      else {
                        const allKeys: string[] = [];
                        committeesList.forEach((c) => [1, 2, 3].forEach((j) => allKeys.push(`${c.id}-${j}`)));
                        setSelectedDeleteJudgeKeys(allKeys);
                      }
                    }}
                    className="text-[10px] text-indigo-600 hover:underline font-bold"
                  >
                    {selectedDeleteJudgeKeys.length > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {committeesList
                    .filter((c) => bulkDeleteTargetComm === 'ALL' || c.id === bulkDeleteTargetComm)
                    .flatMap((c) =>
                      [1, 2, 3].map((j) => {
                        const key = `${c.id}-${j}`;
                        const isChecked = selectedDeleteJudgeKeys.includes(key);
                        const name = editJudgeNames[key] || `Judge ${j}`;

                        return (
                          <label key={key} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 text-xs cursor-pointer hover:bg-rose-50">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedDeleteJudgeKeys([...selectedDeleteJudgeKeys, key]);
                                else setSelectedDeleteJudgeKeys(selectedDeleteJudgeKeys.filter((k) => k !== key));
                              }}
                              className="rounded text-rose-600 focus:ring-rose-500"
                            />
                            <span className="font-bold text-slate-800">{c.id} J{j}:</span>
                            <span className="text-slate-600 truncate">{name}</span>
                          </label>
                        );
                      })
                    )}
                </div>
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowBulkDeleteJudgesModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDeletingJudges}
                onClick={handleExecuteBulkDeleteJudges}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isBulkDeletingJudges
                    ? 'Deleting...'
                    : selectedDeleteJudgeKeys.length > 0
                    ? `Delete Selected (${selectedDeleteJudgeKeys.length})`
                    : bulkDeleteTargetComm !== 'ALL'
                    ? `Delete All Judges for ${bulkDeleteTargetComm}`
                    : 'Confirm Bulk Deletion'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 10: RESET JUDGES PASSWORDS (UNIQUE 4-DIGIT NUMERIC PINs) ================= */}
      {showResetJudgePasswordsModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-lg p-6 space-y-5 my-8">
            <div className="flex justify-between items-start border-b border-amber-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-900 shrink-0">
                  <RotateCcw className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full w-fit mb-1">
                    Master Admin Security Action
                  </div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Reset Judges Passwords
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowResetJudgePasswordsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetPassStatusMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs rounded-2xl flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{resetPassStatusMsg}</span>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-2 text-amber-950">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <Key className="w-4 h-4 text-amber-700" />
                    <span>Generate Random Unique 4-Digit Passwords</span>
                  </p>
                  <p className="text-amber-900 leading-relaxed">
                    This action will reset passwords for all judges and assign each judge a <strong>unique 4-digit random numeric PIN</strong> (e.g. 4821, 9310, 1852). No two judges will receive the same password.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Target Committee Scope:
                  </label>
                  <select
                    value={resetPassTargetComm}
                    onChange={(e) => setResetPassTargetComm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                  >
                    <option value="ALL">🔴 ALL COMMITTEES (Reset All Judges Passwords)</option>
                    {committeesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.fullName} Judges Only
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end items-center gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowResetJudgePasswordsModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isResettingJudgePasswords}
                    onClick={handleExecuteResetJudgesPasswords}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition shadow-md flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      {isResettingJudgePasswords
                        ? 'Generating Unique Passwords...'
                        : 'Reset & Assign Unique Passwords'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 11: BULK DELETE DELEGATES ================= */}
      {showBulkDeleteDelegatesModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-xl p-6 space-y-5 my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start border-b border-rose-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full w-fit mb-1">
                    Delegate Roster Management
                  </div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Bulk Delete Delegates
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowBulkDeleteDelegatesModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkDeleteDelStatusMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs rounded-xl flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{bulkDeleteDelStatusMsg}</span>
              </div>
            ) : (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Warning: Bulk deletion removes delegate records and any associated judge scores. Select individual delegates below or target a specific committee scope.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Scope:
                  </label>
                  <select
                    value={bulkDeleteDelTargetComm}
                    onChange={(e) => {
                      setBulkDeleteDelTargetComm(e.target.value);
                      setBulkDeleteDelTargetIds([]);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                  >
                    <option value="ALL">🔴 ALL COMMITTEES ({delegates.length} Total Delegates)</option>
                    {committeesList.map((c) => {
                      const count = delegates.filter((d) => d.committeeId === c.id).length;
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.fullName} ({count} Delegates)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700">
                      Select Individual Delegates in Scope ({bulkDeleteDelTargetComm}):
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const scopeDels = bulkDeleteDelTargetComm === 'ALL'
                            ? delegates
                            : delegates.filter((d) => d.committeeId === bulkDeleteDelTargetComm);
                          setBulkDeleteDelTargetIds(scopeDels.map((d) => d.id));
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkDeleteDelTargetIds([])}
                        className="text-[11px] font-bold text-slate-500 hover:underline"
                      >
                        Deselect
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y bg-slate-50 text-xs p-2">
                    {(() => {
                      const scopeDels = bulkDeleteDelTargetComm === 'ALL'
                        ? delegates
                        : delegates.filter((d) => d.committeeId === bulkDeleteDelTargetComm);

                      if (scopeDels.length === 0) {
                        return <div className="p-4 text-center text-slate-400 italic">No delegates found in this scope.</div>;
                      }

                      return scopeDels.map((del) => {
                        const isChecked = bulkDeleteDelTargetIds.includes(del.id);
                        return (
                          <label
                            key={del.id}
                            className="flex items-center justify-between p-2 hover:bg-white rounded cursor-pointer transition"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBulkDeleteDelTargetIds([...bulkDeleteDelTargetIds, del.id]);
                                  } else {
                                    setBulkDeleteDelTargetIds(bulkDeleteDelTargetIds.filter((id) => id !== del.id));
                                  }
                                }}
                                className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                              />
                              <span className="font-bold text-slate-800">{del.delegateName}</span>
                              <span className="text-slate-500">({del.portfolio})</span>
                            </div>
                            <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                              {del.committeeId}
                            </span>
                          </label>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end items-center gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowBulkDeleteDelegatesModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDeletingDelegates}
                onClick={handleExecuteModalBulkDeleteDelegates}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isBulkDeletingDelegates
                    ? 'Deleting Delegates...'
                    : bulkDeleteDelTargetIds.length > 0
                    ? `Delete Selected (${bulkDeleteDelTargetIds.length})`
                    : bulkDeleteDelTargetComm !== 'ALL'
                    ? `Delete All Delegates in ${bulkDeleteDelTargetComm}`
                    : 'Delete All Delegates System-Wide'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Committees Modal */}
      {showBulkAddCommitteesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Bulk Add / Import Committees</h3>
                  <p className="text-xs text-slate-500">Add or replace multiple committees in bulk by pasting text data.</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkAddCommitteesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Import Mode:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="bulkCommMode"
                      value="append"
                      checked={bulkCommitteesImportMode === 'append'}
                      onChange={() => setBulkCommitteesImportMode('append')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Append / Add New Committees</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer text-amber-700">
                    <input
                      type="radio"
                      name="bulkCommMode"
                      value="replace"
                      checked={bulkCommitteesImportMode === 'replace'}
                      onChange={() => setBulkCommitteesImportMode('replace')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Replace All Existing Committees</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paste Committee Lines (Format: CODE | Short Name | Full Name or CODE, Name, Description):
                </label>
                <p className="text-[11px] text-slate-500 mb-2 italic">
                  Example:<br />
                  <code className="text-indigo-600">ECOFIN | ECOFIN | Economic and Financial Committee</code><br />
                  <code className="text-indigo-600">SPECPOL | SPECPOL | Special Political Committee</code><br />
                  <code className="text-indigo-600">UNICEF | UNICEF | United Nations Children's Fund</code>
                </p>
                <textarea
                  rows={8}
                  placeholder={`ECOFIN | ECOFIN | Economic & Financial Committee\nSPECPOL | SPECPOL | Special Political Committee\nUNICEF | UNICEF | United Nations Children's Fund`}
                  value={bulkCommitteesRawText}
                  onChange={(e) => setBulkCommitteesRawText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono"
                />
              </div>

              {bulkCommitteesStatusMsg && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-semibold">
                  {bulkCommitteesStatusMsg}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowBulkAddCommitteesModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkAddingCommittees || !bulkCommitteesRawText.trim()}
                onClick={handleExecuteBulkAddCommittees}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{isBulkAddingCommittees ? 'Processing...' : 'Import Committees'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Committees Modal */}
      {showBulkDeleteCommitteesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Bulk Delete Committees</h3>
                  <p className="text-xs text-slate-500">Select committees to delete in bulk.</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkDeleteCommitteesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Select Committees ({selectedDeleteCommitteeIds.length} / {committeesList.length}):</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDeleteCommitteeIds(committeesList.map((c) => c.id))}
                    className="text-[11px] font-bold text-indigo-600 hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDeleteCommitteeIds([])}
                    className="text-[11px] font-bold text-slate-500 hover:underline"
                  >
                    Deselect
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl max-h-56 overflow-y-auto divide-y bg-slate-50 text-xs p-2">
                {committeesList.map((c) => {
                  const isChecked = selectedDeleteCommitteeIds.includes(c.id);
                  const countDel = delegates.filter((d) => d.committeeId === c.id).length;
                  return (
                    <label
                      key={c.id}
                      className="flex items-center justify-between p-2.5 hover:bg-white rounded-xl cursor-pointer transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDeleteCommitteeIds([...selectedDeleteCommitteeIds, c.id]);
                            } else {
                              setSelectedDeleteCommitteeIds(selectedDeleteCommitteeIds.filter((id) => id !== c.id));
                            }
                          }}
                          className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                        <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {c.id}
                        </span>
                        <span className="font-semibold text-slate-800">{c.fullName}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">
                        {countDel} Delegates
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Warning: Destructive Operation</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  Deleting committees will permanently delete all associated delegates, country portfolios, and judge evaluation scores for those committees.
                </p>
              </div>

              {bulkDeleteCommitteesStatusMsg && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-semibold">
                  {bulkDeleteCommitteesStatusMsg}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowBulkDeleteCommitteesModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDeletingCommittees || selectedDeleteCommitteeIds.length === 0}
                onClick={handleExecuteBulkDeleteCommittees}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isBulkDeletingCommittees
                    ? 'Deleting...'
                    : `Delete ${selectedDeleteCommitteeIds.length} Committee(s)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
