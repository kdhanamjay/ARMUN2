import React, { useState } from 'react';
import { CommitteeId, Delegate, RubricScore } from '../types';
import { RUBRIC_CRITERIA } from '../data/initialData';
import { ChevronDown, ChevronRight, Trophy, Medal, Star, Search, Printer, Edit3, X, Save, Check } from 'lucide-react';

interface MasterScoreSheetProps {
  committeeId: CommitteeId;
  delegates: Delegate[];
  scores: Record<string, RubricScore>;
  isMasterAdmin?: boolean;
  onUpdateScore?: (payload: {
    delegateId: string;
    committeeId: CommitteeId;
    judgeIndex: 1 | 2 | 3;
    criteriaScores: Record<string, number>;
    comments: string;
    totalMarks?: number;
  }) => Promise<void>;
  onPrintCommitteeSheet?: (committeeId: CommitteeId) => void;
}

export const MasterScoreSheet: React.FC<MasterScoreSheetProps> = ({
  committeeId,
  delegates,
  scores,
  isMasterAdmin = false,
  onUpdateScore,
  onPrintCommitteeSheet,
}) => {
  const [expandedDelegateId, setExpandedDelegateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Master Admin Score Editing Modal State
  const [editingData, setEditingData] = useState<{
    delegate: Delegate;
    judgeIndex: 1 | 2 | 3;
    criteriaScores: Record<string, number>;
    comments: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);

  // Compute aggregated scores and rankings for this committee
  const rows = delegates
    .filter((d) => d.committeeId === committeeId)
    .map((d) => {
      const j1Score = scores[`${d.id}_J1`] || null;
      const j2Score = scores[`${d.id}_J2`] || null;
      const j3Score = scores[`${d.id}_J3`] || null;

      const j1Total = j1Score?.totalMarks ?? null;
      const j2Total = j2Score?.totalMarks ?? null;
      const j3Total = j3Score?.totalMarks ?? null;

      const validScores: number[] = [];
      if (j1Total !== null) validScores.push(j1Total);
      if (j2Total !== null) validScores.push(j2Total);
      if (j3Total !== null) validScores.push(j3Total);

      const completedJudgesCount = validScores.length;
      const overallTotal = validScores.reduce((a, b) => a + b, 0);
      const averageScore = validScores.length > 0 ? parseFloat((overallTotal / validScores.length).toFixed(2)) : 0;

      return {
        delegate: d,
        j1Score,
        j2Score,
        j3Score,
        j1Total,
        j2Total,
        j3Total,
        completedJudgesCount,
        overallTotal,
        averageScore,
      };
    });

  // Calculate Ranks based on Average Score
  const sortedRows = [...rows].sort((a, b) => b.averageScore - a.averageScore);
  const rankedMap = new Map<string, number>();
  sortedRows.forEach((r, idx) => {
    if (r.averageScore > 0) {
      rankedMap.set(r.delegate.id, idx + 1);
    }
  });

  const filteredRows = rows.filter((r) =>
    r.delegate.delegateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.delegate.portfolio.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.delegate.slNo.toString().includes(searchQuery)
  );

  const getRankBadge = (rank?: number) => {
    if (!rank) return <span className="text-slate-400 font-mono">-</span>;
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-lg font-bold text-xs shadow-xs">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>Best Delegate (1st)</span>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-0.5 rounded-lg font-bold text-xs">
          <Medal className="w-3.5 h-3.5 text-slate-600" />
          <span>High Commendation (2nd)</span>
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-lg font-semibold text-xs">
          <Star className="w-3.5 h-3.5 text-amber-600" />
          <span>Special Mention (3rd)</span>
        </span>
      );
    }
    return <span className="font-mono font-bold text-slate-600">Rank #{rank}</span>;
  };

  const handleOpenEditModal = (delegate: Delegate, judgeIndex: 1 | 2 | 3) => {
    const existingScore = scores[`${delegate.id}_J${judgeIndex}`];
    const initialCriteria: Record<string, number> = {};
    RUBRIC_CRITERIA.forEach((c) => {
      initialCriteria[c.id] = existingScore?.criteriaScores?.[c.id] ?? 0;
    });

    setEditingData({
      delegate,
      judgeIndex,
      criteriaScores: initialCriteria,
      comments: existingScore?.comments || '',
    });
  };

  const handleSaveEditedScore = async () => {
    if (!editingData || !onUpdateScore) return;
    setSaving(true);
    try {
      await onUpdateScore({
        delegateId: editingData.delegate.id,
        committeeId,
        judgeIndex: editingData.judgeIndex,
        criteriaScores: editingData.criteriaScores,
        comments: editingData.comments,
      });
      setEditingData(null);
    } catch (e) {
      console.error('Error saving score update:', e);
    } finally {
      setSaving(false);
    }
  };

  // Calculate modal dynamic total marks
  const currentModalTotal = editingData
    ? Object.values(editingData.criteriaScores).reduce<number>((acc, val) => acc + (Number(val) || 0), 0)
    : 0;

  return (
    <div className="space-y-4">
      {/* Header Search & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter delegates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none focus:bg-white focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong>{filteredRows.length}</strong> Delegates in <strong>{committeeId}</strong>
          </div>

          {onPrintCommitteeSheet && (
            <button
              onClick={() => onPrintCommitteeSheet(committeeId)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
          )}
        </div>
      </div>

      {/* Master Table Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900 text-white font-semibold">
            <tr>
              <th className="p-3 border-r border-slate-800 w-12 text-center">SL</th>
              <th className="p-3 border-r border-slate-800">Delegate Name</th>
              <th className="p-3 border-r border-slate-800">Portfolio</th>
              <th className="p-3 border-r border-slate-800 text-center bg-slate-800">Judge 1</th>
              <th className="p-3 border-r border-slate-800 text-center bg-slate-800">Judge 2</th>
              <th className="p-3 border-r border-slate-800 text-center bg-slate-800">Judge 3</th>
              <th className="p-3 border-r border-slate-800 text-center bg-purple-900 font-bold">Total Marks (300)</th>
              <th className="p-3 border-r border-slate-800 text-center bg-indigo-900">Average (100)</th>
              <th className="p-3 text-center">Position / Rank</th>
              {isMasterAdmin && <th className="p-3 text-center bg-purple-950">Master Edit</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-sans">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={isMasterAdmin ? 10 : 9} className="p-8 text-center text-slate-400">
                  No delegates recorded for {committeeId}.
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => {
                const isExpanded = expandedDelegateId === r.delegate.id;
                const rank = rankedMap.get(r.delegate.id);

                return (
                  <React.Fragment key={r.delegate.id}>
                    <tr
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td
                        onClick={() => setExpandedDelegateId(isExpanded ? null : r.delegate.id)}
                        className="p-3 border-r font-mono text-center font-bold text-slate-500"
                      >
                        {r.delegate.slNo}
                      </td>

                      <td
                        onClick={() => setExpandedDelegateId(isExpanded ? null : r.delegate.id)}
                        className="p-3 border-r font-bold text-slate-900 flex items-center gap-2"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>{r.delegate.delegateName}</span>
                      </td>

                      <td
                        onClick={() => setExpandedDelegateId(isExpanded ? null : r.delegate.id)}
                        className="p-3 border-r text-slate-700 font-medium"
                      >
                        {r.delegate.portfolio}
                      </td>

                      {/* Judge 1 Score */}
                      <td className="p-3 border-r text-center font-mono font-bold bg-slate-50/50">
                        <div className="flex items-center justify-center gap-1.5">
                          {r.j1Total !== null ? (
                            <span className="text-slate-900">{r.j1Total}</span>
                          ) : (
                            <span className="text-slate-300 font-normal">Pending</span>
                          )}
                          {isMasterAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEditModal(r.delegate, 1); }}
                              title="Edit Judge 1 Marks"
                              className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded-md transition"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Judge 2 Score */}
                      <td className="p-3 border-r text-center font-mono font-bold bg-slate-50/50">
                        <div className="flex items-center justify-center gap-1.5">
                          {r.j2Total !== null ? (
                            <span className="text-slate-900">{r.j2Total}</span>
                          ) : (
                            <span className="text-slate-300 font-normal">Pending</span>
                          )}
                          {isMasterAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEditModal(r.delegate, 2); }}
                              title="Edit Judge 2 Marks"
                              className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded-md transition"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Judge 3 Score */}
                      <td className="p-3 border-r text-center font-mono font-bold bg-slate-50/50">
                        <div className="flex items-center justify-center gap-1.5">
                          {r.j3Total !== null ? (
                            <span className="text-slate-900">{r.j3Total}</span>
                          ) : (
                            <span className="text-slate-300 font-normal">Pending</span>
                          )}
                          {isMasterAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEditModal(r.delegate, 3); }}
                              title="Edit Judge 3 Marks"
                              className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded-md transition"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Total Marks of All 3 Judges (300) */}
                      <td
                        onClick={() => setExpandedDelegateId(isExpanded ? null : r.delegate.id)}
                        className="p-3 border-r text-center font-mono font-black text-sm text-purple-950 bg-purple-50"
                      >
                        {r.completedJudgesCount > 0 ? (
                          <span>{r.overallTotal}</span>
                        ) : (
                          <span className="text-slate-300 font-normal text-xs">-</span>
                        )}
                      </td>

                      {/* Average Score */}
                      <td
                        onClick={() => setExpandedDelegateId(isExpanded ? null : r.delegate.id)}
                        className="p-3 border-r text-center font-mono font-black text-sm text-indigo-950 bg-indigo-50/80"
                      >
                        {r.completedJudgesCount > 0 ? (
                          <span>{r.averageScore}</span>
                        ) : (
                          <span className="text-slate-300 font-normal text-xs">-</span>
                        )}
                      </td>

                      {/* Rank */}
                      <td
                        onClick={() => setExpandedDelegateId(isExpanded ? null : r.delegate.id)}
                        className="p-3 text-center"
                      >
                        {getRankBadge(rank)}
                      </td>

                      {/* Master Edit Buttons */}
                      {isMasterAdmin && (
                        <td className="p-2 text-center bg-purple-50/50 border-l border-purple-100">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(r.delegate, 1)}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-2 py-1 rounded-md transition"
                            >
                              Edit J1
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(r.delegate, 2)}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-2 py-1 rounded-md transition"
                            >
                              Edit J2
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(r.delegate, 3)}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-2 py-1 rounded-md transition"
                            >
                              Edit J3
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>

                    {/* Detailed Rubric Criteria Breakdown Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b">
                        <td colSpan={isMasterAdmin ? 9 : 8} className="p-4">
                          <div className="bg-white border rounded-xl p-4 space-y-3">
                            <h5 className="text-xs font-bold text-slate-800 border-b pb-2 flex justify-between items-center">
                              <span>10 Rubric Criteria Breakdown for {r.delegate.delegateName} ({r.delegate.portfolio})</span>
                              <span className="text-slate-400 font-mono text-[11px]">Judge 1 / Judge 2 / Judge 3</span>
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {RUBRIC_CRITERIA.map((c) => {
                                const j1 = r.j1Score?.criteriaScores?.[c.id] ?? '-';
                                const j2 = r.j2Score?.criteriaScores?.[c.id] ?? '-';
                                const j3 = r.j3Score?.criteriaScores?.[c.id] ?? '-';

                                return (
                                  <div key={c.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                                    <span className="text-slate-700 font-medium">{c.name}</span>
                                    <div className="font-mono font-bold space-x-2 text-xs">
                                      <span className="text-slate-800">J1: {j1}</span>
                                      <span className="text-slate-800">J2: {j2}</span>
                                      <span className="text-slate-800">J3: {j3}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MASTER ADMIN MARKS EDITING MODAL */}
      {editingData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-purple-900 text-white p-4 flex justify-between items-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">
                  Master Admin Marks Override
                </div>
                <h3 className="text-base font-bold">
                  Edit Marks for {editingData.delegate.delegateName} ({editingData.delegate.portfolio})
                </h3>
                <p className="text-xs text-purple-200 font-medium">
                  Updating Judge #{editingData.judgeIndex} Evaluation Sheet
                </p>
              </div>
              <button
                onClick={() => setEditingData(null)}
                className="p-1.5 text-purple-300 hover:text-white hover:bg-purple-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - 10 Criteria inputs */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-100">
                <span className="text-xs font-bold text-purple-950">
                  Total Marks Calculated:
                </span>
                <span className="font-mono text-lg font-black text-purple-900">
                  {currentModalTotal} / 100
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RUBRIC_CRITERIA.map((c) => {
                  const val = editingData.criteriaScores[c.id] ?? 0;
                  return (
                    <div key={c.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-800">{c.name}</label>
                        <span className="text-[10px] font-mono font-semibold text-slate-500">Max 10</span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={val}
                        onChange={(e) => {
                          const num = Math.min(10, Math.max(0, Number(e.target.value) || 0));
                          setEditingData({
                            ...editingData,
                            criteriaScores: {
                              ...editingData.criteriaScores,
                              [c.id]: num,
                            },
                          });
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm font-mono font-bold text-slate-900 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                      />
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Master Admin Comments / Remarks
                </label>
                <textarea
                  rows={2}
                  value={editingData.comments}
                  onChange={(e) => setEditingData({ ...editingData, comments: e.target.value })}
                  placeholder="Optional judge remarks or override notes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:bg-white focus:border-purple-600"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingData(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedScore}
                disabled={saving}
                className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <span>Saving Marks...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Update Marks</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
