import React, { useState, useEffect } from 'react';
import { Delegate, RubricScore, CommitteeId } from '../types';
import { COMMITTEES, RUBRIC_CRITERIA } from '../data/initialData';
import { DelegateEvaluatorModal } from './DelegateEvaluatorModal';
import { useAntiScreenshot } from '../utils/security';
import { SecurityOverlay } from './SecurityOverlay';
import { Search, CheckCircle2, ShieldCheck, Lock, RefreshCw, Filter, LayoutGrid, Table, Save, Sparkles, Edit3 } from 'lucide-react';

interface JudgePortalProps {
  committeeId: CommitteeId;
  judgeIndex: 1 | 2 | 3;
  judgeName: string;
  onFetchJudgeData: (committeeId: CommitteeId, judgeIndex: 1 | 2 | 3) => Promise<{ delegates: Delegate[]; myScores: Record<string, RubricScore>; isPortalDisabled?: boolean; portalDisabledReason?: string }>;
  onSaveScore: (payload: { delegateId: string; committeeId: CommitteeId; judgeIndex: 1 | 2 | 3; criteriaScores: Record<string, number>; comments: string; isLocked: boolean }) => Promise<void>;
}

interface MatrixRowState {
  criteriaScores: Record<string, number>;
  comments: string;
  isLocked: boolean;
  isDirty: boolean;
  isSaving: boolean;
  isSaved: boolean;
}

export const JudgePortal: React.FC<JudgePortalProps> = ({
  committeeId,
  judgeIndex,
  judgeName,
  onFetchJudgeData,
  onSaveScore,
}) => {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [scores, setScores] = useState<Record<string, RubricScore>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'graded' | 'pending'>('all');
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');
  const [selectedDelegateIndex, setSelectedDelegateIndex] = useState<number | null>(null);
  const [isPortalDisabled, setIsPortalDisabled] = useState(false);
  const [portalDisabledReason, setPortalDisabledReason] = useState('');

  // Local state for direct in-table matrix cell editing
  const [matrixScores, setMatrixScores] = useState<Record<string, MatrixRowState>>({});

  const [savingAll, setSavingAll] = useState(false);

  // Anti-Screenshot & Screen Capture Protection Hook
  const { isScreenProtected, securityAlert } = useAntiScreenshot(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await onFetchJudgeData(committeeId, judgeIndex);
      const loadedDelegates = data.delegates || [];
      const loadedScores = data.myScores || {};
      setDelegates(loadedDelegates);
      setScores(loadedScores);
      if (data.isPortalDisabled) {
        setIsPortalDisabled(true);
        setPortalDisabledReason(data.portalDisabledReason || 'Judge Evaluation Portal is currently disabled by Master Admin.');
      } else {
        setIsPortalDisabled(false);
        setPortalDisabledReason('');
      }

      // Initialize in-table matrix state
      const initialMatrix: Record<string, MatrixRowState> = {};
      loadedDelegates.forEach((d) => {
        const existing = loadedScores[d.id];
        const criteria: Record<string, number> = {};
        RUBRIC_CRITERIA.forEach((c) => {
          criteria[c.id] = existing?.criteriaScores?.[c.id] ?? 0;
        });

        initialMatrix[d.id] = {
          criteriaScores: criteria,
          comments: existing?.comments || '',
          isLocked: existing?.isLocked || false,
          isDirty: false,
          isSaving: false,
          isSaved: Boolean(existing),
        };
      });
      setMatrixScores(initialMatrix);
    } catch (e) {
      console.error('Error fetching judge data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [committeeId, judgeIndex]);

  // Handle cell value change in matrix table
  const handleCellChange = (delegateId: string, criterionId: string, valueStr: string) => {
    const num = Math.min(10, Math.max(0, Number(valueStr) || 0));
    setMatrixScores((prev) => {
      const current = prev[delegateId] || {
        criteriaScores: {},
        comments: '',
        isLocked: false,
        isDirty: false,
        isSaving: false,
        isSaved: false,
      };

      return {
        ...prev,
        [delegateId]: {
          ...current,
          criteriaScores: {
            ...current.criteriaScores,
            [criterionId]: num,
          },
          isDirty: true,
          isSaved: false,
        },
      };
    });
  };

  // Compute live total score for a delegate in matrix table
  const getDelegateMatrixTotal = (delegateId: string) => {
    const item = matrixScores[delegateId];
    if (!item) return 0;
    return Object.values(item.criteriaScores).reduce<number>((acc, val) => acc + (Number(val) || 0), 0);
  };

  // Save single delegate matrix row
  const handleSaveMatrixRow = async (delegateId: string) => {
    const item = matrixScores[delegateId];
    if (!item) return;

    setMatrixScores((prev) => ({
      ...prev,
      [delegateId]: { ...prev[delegateId], isSaving: true },
    }));

    try {
      await onSaveScore({
        delegateId,
        committeeId,
        judgeIndex,
        criteriaScores: item.criteriaScores,
        comments: item.comments,
        isLocked: true, // Always lock upon judge save
      });

      const total = getDelegateMatrixTotal(delegateId);

      setScores((prev) => ({
        ...prev,
        [delegateId]: {
          delegateId,
          committeeId,
          judgeIndex,
          criteriaScores: item.criteriaScores,
          totalMarks: total,
          comments: item.comments,
          isLocked: true,
          updatedAt: new Date().toISOString(),
        },
      }));

      setMatrixScores((prev) => ({
        ...prev,
        [delegateId]: {
          ...prev[delegateId],
          isLocked: true,
          isDirty: false,
          isSaving: false,
          isSaved: true,
        },
      }));
    } catch (e) {
      console.error('Error saving matrix row:', e);
      setMatrixScores((prev) => ({
        ...prev,
        [delegateId]: { ...prev[delegateId], isSaving: false },
      }));
    }
  };

  // Save all modified matrix rows and lock them
  const handleSaveAllMatrix = async () => {
    if (isPortalDisabled) {
      alert('Judge Evaluation Portal is currently disabled by Master Admin.');
      return;
    }

    const targetIds = Object.keys(matrixScores).filter((id) => {
      const item = matrixScores[id];
      if (!item || item.isLocked) return false;
      return item.isDirty || Object.values(item.criteriaScores).some((v) => Number(v) > 0);
    });

    if (targetIds.length === 0) {
      alert('All entered evaluations are already saved and locked.');
      return;
    }

    setSavingAll(true);
    for (const id of targetIds) {
      await handleSaveMatrixRow(id);
    }
    setSavingAll(false);
  };

  const handleSaveModalScore = async (payload: { criteriaScores: Record<string, number>; comments: string; isLocked: boolean }) => {
    if (selectedDelegateIndex === null) return;
    const currentDelegate = filteredDelegates[selectedDelegateIndex];
    if (!currentDelegate) return;

    await onSaveScore({
      delegateId: currentDelegate.id,
      committeeId,
      judgeIndex,
      criteriaScores: payload.criteriaScores,
      comments: payload.comments,
      isLocked: true, // Always lock upon judge save
    });

    let total = 0;
    Object.values(payload.criteriaScores).forEach((v) => (total += Number(v) || 0));

    setScores((prev) => ({
      ...prev,
      [currentDelegate.id]: {
        delegateId: currentDelegate.id,
        committeeId,
        judgeIndex,
        criteriaScores: payload.criteriaScores,
        totalMarks: total,
        comments: payload.comments,
        isLocked: true,
        updatedAt: new Date().toISOString(),
      },
    }));

    setMatrixScores((prev) => ({
      ...prev,
      [currentDelegate.id]: {
        criteriaScores: payload.criteriaScores,
        comments: payload.comments,
        isLocked: true,
        isDirty: false,
        isSaving: false,
        isSaved: true,
      },
    }));
  };

  // Filter delegates by search and completion status
  const filteredDelegates = delegates.filter((d) => {
    const matchesSearch =
      d.delegateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.portfolio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.slNo.toString().includes(searchQuery);

    const hasScore = Boolean(scores[d.id]);
    if (filterStatus === 'graded') return matchesSearch && hasScore;
    if (filterStatus === 'pending') return matchesSearch && !hasScore;
    return matchesSearch;
  });

  const currentCommitteeInfo = COMMITTEES.find((c) => c.id === committeeId) || {
    id: committeeId,
    name: committeeId,
    fullName: `Committee ${committeeId}`,
  };

  const fullCommitteeTitle = `${committeeId} — ${currentCommitteeInfo.fullName}`;

  // Statistics
  const totalDelegatesCount = delegates.length;
  const gradedCount = Object.keys(scores).length;
  const progressPercent = totalDelegatesCount > 0 ? Math.round((gradedCount / totalDelegatesCount) * 100) : 0;
  
  const savableRows = Object.keys(matrixScores).filter((id) => {
    const item = matrixScores[id];
    if (!item || item.isLocked) return false;
    return item.isDirty || Object.values(item.criteriaScores).some((v) => Number(v) > 0);
  });
  const hasSavableRows = savableRows.length > 0;

  const currentActiveDelegate = selectedDelegateIndex !== null ? filteredDelegates[selectedDelegateIndex] : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 relative font-sans">
      {/* Security Overlay and Watermarks */}
      <SecurityOverlay
        isProtected={isScreenProtected}
        alertMessage={securityAlert}
        judgeInfo={`COMMITTEE: ${committeeId} | JUDGE ${judgeIndex}`}
        isJudgeView={true}
      />

      {/* Security Notice Banner / Disabled Portal Banner */}
      {isPortalDisabled ? (
        <div className="bg-amber-500 text-slate-950 font-black text-xs px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <Lock className="w-5 h-5 text-slate-950 shrink-0 animate-bounce" />
            <span>
              <strong>JUDGE EVALUATION PORTAL DISABLED BY MASTER ADMIN:</strong> {portalDisabledReason}
            </span>
          </div>
          <button onClick={loadData} className="text-xs bg-slate-950 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1 shrink-0 ml-2">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Access</span>
          </button>
        </div>
      ) : (
        <div className="bg-rose-50 border-b border-rose-100 text-rose-800 text-xs px-4 py-2.5 font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>CONFIDENTIAL JUDGE PORTAL:</strong> Evaluating <strong>{committeeId}</strong> as <strong>Judge #{judgeIndex}</strong>. Enter marks directly in the 10-metrics matrix below.
            </span>
          </div>
          <button onClick={loadData} className="text-xs text-rose-700 hover:text-rose-900 font-bold underline flex items-center gap-1 shrink-0 ml-2">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-3 sm:p-6 space-y-5">
        
        {/* Header Title Box Matching Attached Screenshot Design */}
        <div className="text-center pt-2">
          <div className="inline-block bg-white border-2 border-slate-900 px-6 py-2 rounded-lg text-sm sm:text-base font-black tracking-tight text-slate-900 shadow-xs">
            {fullCommitteeTitle}
          </div>
        </div>

        {/* Stats & Progress Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              Judge #{judgeIndex} Evaluation Portal
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              Rubrics Evaluation Sheet (10 Metrics Grid)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Enter numbers (0–10) in each criteria cell. Total out of 100 calculates automatically.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-56 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Progress</span>
                <span className="font-mono text-indigo-700">{gradedCount} / {totalDelegatesCount} Graded ({progressPercent}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Save All Button */}
            {hasSavableRows ? (
              <button
                onClick={handleSaveAllMatrix}
                disabled={savingAll || isPortalDisabled}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition shadow-md shadow-indigo-600/20 shrink-0 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingAll ? 'Saving & Locking...' : `Save All Marks (${savableRows.length})`}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 font-bold text-xs px-3.5 py-3 rounded-xl border border-emerald-200 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>All Entered Marks Saved & Locked</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls, Filters & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search delegate name or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {(['all', 'graded', 'pending'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterStatus === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'all' && `All (${delegates.length})`}
                  {st === 'graded' && `Graded (${gradedCount})`}
                  {st === 'pending' && `Pending (${totalDelegatesCount - gradedCount})`}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode('matrix')}
                title="Table Matrix View"
                className={`p-1.5 rounded-lg flex items-center gap-1 transition ${
                  viewMode === 'matrix' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Matrix View</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                title="Cards View"
                className={`p-1.5 rounded-lg flex items-center gap-1 transition ${
                  viewMode === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200 shadow-xs space-y-2">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-medium">Loading evaluation matrix for {committeeId}...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDelegates.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200 shadow-xs">
            <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-slate-800">No delegates found</h3>
            <p className="text-xs text-slate-400">Try adjusting your search query or filter status.</p>
          </div>
        )}

        {/* ================= MODE 1: MATRIX SHEET TABLE (MATCHING ATTACHED IMAGE) ================= */}
        {!loading && filteredDelegates.length > 0 && viewMode === 'matrix' && (
          <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-md overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-100 text-center font-black text-slate-900">
                  <th className="border-r-2 border-slate-900 p-2 w-12 text-center">SL No</th>
                  <th className="border-r-2 border-slate-900 p-2 min-w-[160px] text-left">Delegate Name</th>
                  {RUBRIC_CRITERIA.map((c) => (
                    <th key={c.id} className="border-r border-slate-900 p-1.5 w-20 text-[10px] leading-tight text-center">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[9px] font-mono text-slate-500 font-semibold">(10 M)</div>
                    </th>
                  ))}
                  <th className="p-2 w-28 font-black text-center bg-indigo-50 text-indigo-950">
                    Total Marks (100) / Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-sans">
                {filteredDelegates.map((delegate) => {
                  const item = matrixScores[delegate.id] || {
                    criteriaScores: {},
                    comments: '',
                    isLocked: false,
                    isDirty: false,
                    isSaving: false,
                    isSaved: false,
                  };

                  const liveTotal = getDelegateMatrixTotal(delegate.id);
                  const delegateGlobalIndex = filteredDelegates.findIndex((d) => d.id === delegate.id);

                  return (
                    <tr key={delegate.id} className="border-b border-slate-800 text-center hover:bg-slate-50/80 transition-colors h-11">
                      
                      {/* SL No */}
                      <td className="border-r-2 border-slate-900 p-2 font-mono font-bold text-slate-900">
                        {delegate.slNo}
                      </td>

                      {/* Delegate Name & Portfolio */}
                      <td className="border-r-2 border-slate-900 p-2 text-left">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 text-xs">{delegate.delegateName}</span>
                          <button
                            onClick={() => setSelectedDelegateIndex(delegateGlobalIndex)}
                            title="Open Feedback & Comments Modal"
                            className="text-slate-400 hover:text-indigo-600 p-0.5 rounded-md transition"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">Portfolio: {delegate.portfolio}</div>
                      </td>

                      {/* 10 Criteria Inputs */}
                      {RUBRIC_CRITERIA.map((c) => {
                        const val = item.criteriaScores[c.id] ?? '';
                        return (
                          <td key={c.id} className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={val}
                              disabled={item.isLocked || isPortalDisabled}
                              onChange={(e) => handleCellChange(delegate.id, c.id, e.target.value)}
                              className="w-12 text-center bg-slate-50 border border-slate-300 rounded-md py-1 px-0.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition disabled:opacity-50"
                            />
                          </td>
                        );
                      })}

                      {/* Live Total Marks (100) & Lock Status */}
                      <td className="p-2 font-mono font-black text-sm text-indigo-950 bg-indigo-50/50 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{liveTotal}</span>
                          {item.isLocked ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300" title="Locked by Save All Marks">
                              <Lock className="w-2.5 h-2.5 text-amber-600" />
                              <span>Locked</span>
                            </span>
                          ) : item.isDirty ? (
                            <span className="inline-flex items-center text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                              Modified
                            </span>
                          ) : null}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= MODE 2: CARDS GRID VIEW ================= */}
        {!loading && filteredDelegates.length > 0 && viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredDelegates.map((delegate, idx) => {
              const score = scores[delegate.id];
              const isGraded = Boolean(score);
              const isLocked = score?.isLocked;

              return (
                <div
                  key={delegate.id}
                  onClick={() => setSelectedDelegateIndex(idx)}
                  className={`group bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-md flex items-center justify-between gap-3 ${
                    isGraded
                      ? 'border-indigo-200 bg-indigo-50/20'
                      : 'border-slate-200 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl font-mono font-bold flex items-center justify-center shrink-0 text-sm shadow-xs ${
                        isGraded
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      #{delegate.slNo}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                          {delegate.delegateName}
                        </h3>
                        {isLocked && (
                          <span title="Locked & Submitted" className="text-amber-600">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Portfolio: <span className="font-bold text-slate-700">{delegate.portfolio}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {isGraded ? (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-indigo-700 font-bold block">
                          Marks
                        </span>
                        <div className="flex items-center gap-1 font-mono font-black text-indigo-900 text-base">
                          <span>{score.totalMarks}</span>
                          <span className="text-xs text-indigo-500 font-medium">/ 100</span>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl font-semibold">
                        <span>Evaluate</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Delegate Evaluator Sheet Modal */}
      {currentActiveDelegate && selectedDelegateIndex !== null && (
        <DelegateEvaluatorModal
          delegate={currentActiveDelegate}
          committeeId={committeeId}
          judgeIndex={judgeIndex}
          existingScore={scores[currentActiveDelegate.id] || null}
          onSave={handleSaveModalScore}
          onClose={() => setSelectedDelegateIndex(null)}
          onNavigateDelegate={(dir) => {
            if (dir === 'next' && selectedDelegateIndex < filteredDelegates.length - 1) {
              setSelectedDelegateIndex(selectedDelegateIndex + 1);
            } else if (dir === 'prev' && selectedDelegateIndex > 0) {
              setSelectedDelegateIndex(selectedDelegateIndex - 1);
            }
          }}
          hasPrev={selectedDelegateIndex > 0}
          hasNext={selectedDelegateIndex < filteredDelegates.length - 1}
        />
      )}
    </div>
  );
};
