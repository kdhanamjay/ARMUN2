import React, { useState } from 'react';
import { CommitteeId, Delegate, RubricScore, CommitteeInfo } from '../types';
import { COMMITTEES as DEFAULT_COMMITTEES, RUBRIC_CRITERIA } from '../data/initialData';
import { Printer, X, Building2 } from 'lucide-react';

interface PrintableSheetProps {
  committeeId: CommitteeId;
  judgeIndex?: 1 | 2 | 3;
  delegates: Delegate[];
  scores: Record<string, RubricScore>;
  committees?: CommitteeInfo[];
  judgeNames?: Record<string, string>;
  onClose: () => void;
}

export const PrintableSheet: React.FC<PrintableSheetProps> = ({
  committeeId: initialCommitteeId,
  judgeIndex = 1,
  delegates,
  scores,
  committees,
  judgeNames,
  onClose,
}) => {
  const [selectedCommId, setSelectedCommId] = useState<CommitteeId>(initialCommitteeId || 'UNSC');
  const [sheetMode, setSheetMode] = useState<'master' | 'j1' | 'j2' | 'j3'>('master');

  const availableCommittees = committees && Array.isArray(committees) && committees.length > 0
    ? committees
    : DEFAULT_COMMITTEES;

  const committeeDelegates = delegates.filter((d) => d.committeeId === selectedCommId);
  const currentCommittee = availableCommittees.find((c) => c.id === selectedCommId) || {
    id: selectedCommId,
    name: selectedCommId,
    fullName: `Committee ${selectedCommId}`,
  };

  const getJudgeName = (slot: 1 | 2 | 3) => {
    const key = `${selectedCommId}-${slot}`;
    const custom = judgeNames?.[key];
    return custom && custom.trim() ? custom : `Judge ${slot}`;
  };

  // Compute aggregated scores & ranks for master sheet
  const rows = committeeDelegates.map((d) => {
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

    const hasAnyScore = validScores.length > 0;
    const totalAll3Judges = (j1Total ?? 0) + (j2Total ?? 0) + (j3Total ?? 0);
    const overallTotal = validScores.reduce((a, b) => a + b, 0);
    const averageScore = validScores.length > 0 ? parseFloat((overallTotal / validScores.length).toFixed(2)) : 0;

    return {
      delegate: d,
      j1Total,
      j2Total,
      j3Total,
      totalAll3Judges,
      hasAnyScore,
      averageScore,
    };
  });

  // Calculate Ranks for master sheet
  const sortedRows = [...rows].sort((a, b) => b.totalAll3Judges - a.totalAll3Judges || b.averageScore - a.averageScore);
  const rankMap = new Map<string, number>();
  sortedRows.forEach((r, idx) => {
    if (r.hasAnyScore) {
      rankMap.set(r.delegate.id, idx + 1);
    }
  });

  const handleTriggerPrint = () => {
    window.print();
  };

  const getRankText = (rank?: number) => {
    if (!rank) return '-';
    if (rank === 1) return 'Best Delegate (1st)';
    if (rank === 2) return 'High Commendation (2nd)';
    if (rank === 3) return 'Special Mention (3rd)';
    return `Rank #${rank}`;
  };

  const activeJudgeIndex: 1 | 2 | 3 = sheetMode === 'j1' ? 1 : sheetMode === 'j2' ? 2 : sheetMode === 'j3' ? 3 : (judgeIndex as 1 | 2 | 3);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto printable-modal-overlay">
      <div className="bg-white text-slate-900 max-w-6xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] printable-modal-box">
        
        {/* Print Controls Header (Hidden during actual print) */}
        <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl">
              <Building2 className="w-4 h-4 text-indigo-400 ml-2" />
              <select
                value={selectedCommId}
                onChange={(e) => setSelectedCommId(e.target.value as CommitteeId)}
                className="bg-slate-900 text-white font-bold text-xs p-1.5 rounded-lg border border-slate-700 outline-none"
              >
                {availableCommittees.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setSheetMode('master')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  sheetMode === 'master' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Master Consolidated Sheet
              </button>
              <button
                onClick={() => setSheetMode('j1')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  sheetMode === 'j1' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                {getJudgeName(1)} Sheet
              </button>
              <button
                onClick={() => setSheetMode('j2')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  sheetMode === 'j2' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                {getJudgeName(2)} Sheet
              </button>
              <button
                onClick={() => setSheetMode('j3')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  sheetMode === 'j3' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                {getJudgeName(3)} Sheet
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleTriggerPrint}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sheet</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Sheet Area */}
        <div className="p-6 sm:p-8 overflow-y-auto bg-white font-sans printable-area text-slate-900">
          
          {/* Header matching Official School Rubrics */}
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-4 space-y-0.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">AMARA RAJA VIDYALAYAM</h1>
            <p className="text-xs text-slate-700 font-semibold">
              Diguvamagham (V & P), Thavanampalli (M), Chittoor (Dt) - 517129
            </p>
            <p className="text-xs text-slate-700 font-medium">
              Affiliated to CBSE, New Delhi – Affiliation No: 130513
            </p>
            <h2 className="text-base font-extrabold uppercase text-slate-900 pt-1 tracking-wider">
              ARMUN EDITION-2 — OFFICIAL SCORE SHEET
            </h2>
            <div className="inline-block bg-slate-100 border border-slate-900 px-4 py-1 text-sm font-black mt-1">
              {currentCommittee.id} — {currentCommittee.fullName}
              {sheetMode !== 'master' && ` (${getJudgeName(activeJudgeIndex)} Rubric Matrix)`}
            </div>
          </div>

          {/* MODE 1: MASTER CONSOLIDATED SHEET (SHOWING TOTAL MARKS OF ALL 3 JUDGES) */}
          {sheetMode === 'master' ? (
            <table className="w-full text-left border-2 border-slate-900 text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-100 text-center font-black">
                  <th className="border-r-2 border-slate-900 p-2 w-10">SL</th>
                  <th className="border-r-2 border-slate-900 p-2 text-left">Delegate Student Name</th>
                  <th className="border-r-2 border-slate-900 p-2 text-left">Country / Portfolio</th>
                  <th className="border-r-2 border-slate-900 p-2 w-20">{getJudgeName(1)} (100)</th>
                  <th className="border-r-2 border-slate-900 p-2 w-20">{getJudgeName(2)} (100)</th>
                  <th className="border-r-2 border-slate-900 p-2 w-20">{getJudgeName(3)} (100)</th>
                  <th className="border-r-2 border-slate-900 p-2 w-24 bg-purple-100 text-purple-950 font-black">
                    Total Marks (300)
                  </th>
                  <th className="border-r-2 border-slate-900 p-2 w-20 bg-indigo-50 font-black">Average (100)</th>
                  <th className="p-2 w-32">Position / Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y border-slate-900 font-sans">
                {committeeDelegates.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500 italic">
                      No delegates found in committee {selectedCommId}.
                    </td>
                  </tr>
                ) : (
                  committeeDelegates.map((d, idx) => {
                    const r = rows.find((row) => row.delegate.id === d.id);
                    const rank = rankMap.get(d.id);

                    return (
                      <tr key={d.id} className="border-b border-slate-800 text-center h-9">
                        <td className="border-r-2 border-slate-900 p-2 font-mono font-bold">{d.slNo || idx + 1}</td>
                        <td className="border-r-2 border-slate-900 p-2 text-left font-bold text-slate-900">
                          {d.delegateName}
                        </td>
                        <td className="border-r-2 border-slate-900 p-2 text-left font-medium text-slate-800">
                          {d.portfolio}
                        </td>
                        <td className="border-r-2 border-slate-900 p-2 font-mono font-bold">
                          {r?.j1Total !== null && r?.j1Total !== undefined ? r.j1Total : '-'}
                        </td>
                        <td className="border-r-2 border-slate-900 p-2 font-mono font-bold">
                          {r?.j2Total !== null && r?.j2Total !== undefined ? r.j2Total : '-'}
                        </td>
                        <td className="border-r-2 border-slate-900 p-2 font-mono font-bold">
                          {r?.j3Total !== null && r?.j3Total !== undefined ? r.j3Total : '-'}
                        </td>
                        {/* COMBINED TOTAL MARKS OF ALL 3 JUDGES OUT OF 300 */}
                        <td className="border-r-2 border-slate-900 p-2 font-mono font-black text-sm bg-purple-50 text-purple-950">
                          {r?.hasAnyScore ? r.totalAll3Judges : '-'}
                        </td>
                        <td className="border-r-2 border-slate-900 p-2 font-mono font-black text-xs bg-indigo-50/50">
                          {r?.hasAnyScore ? r.averageScore : '-'}
                        </td>
                        <td className="p-2 font-bold text-xs">
                          {getRankText(rank)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* MODE 2: INDIVIDUAL JUDGE RUBRIC MATRIX */
            <table className="w-full text-left border-2 border-slate-900 text-[11px] border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-50 text-center font-bold">
                  <th className="border-r-2 border-slate-900 p-2 w-10">SL No</th>
                  <th className="border-r-2 border-slate-900 p-2 min-w-[140px] text-left">Delegate Name</th>
                  {RUBRIC_CRITERIA.map((c) => (
                    <th key={c.id} className="border-r border-slate-900 p-1 w-16 text-[10px] leading-tight">
                      <div className="font-bold">{c.name}</div>
                      <div className="text-[9px] font-mono text-slate-600">(10 M)</div>
                    </th>
                  ))}
                  <th className="p-2 w-16 font-black bg-slate-100">Total Marks (100)</th>
                </tr>
              </thead>
              <tbody className="divide-y border-slate-900 font-mono">
                {Array.from({ length: Math.max(12, committeeDelegates.length) }).map((_, idx) => {
                  const delegate = committeeDelegates[idx];
                  const scoreKey = delegate ? `${delegate.id}_J${activeJudgeIndex}` : null;
                  const score = scoreKey ? scores[scoreKey] : null;

                  return (
                    <tr key={idx} className="border-b border-slate-800 text-center h-8">
                      <td className="border-r-2 border-slate-900 p-1 font-bold">{idx + 1}</td>
                      <td className="border-r-2 border-slate-900 p-1 text-left font-sans font-semibold text-slate-900">
                        {delegate ? delegate.delegateName : ''}
                        {delegate ? <span className="block text-[9px] text-slate-500 font-normal">Portfolio: {delegate.portfolio}</span> : ''}
                      </td>
                      {RUBRIC_CRITERIA.map((c) => (
                        <td key={c.id} className="border-r border-slate-800 p-1">
                          {score?.criteriaScores?.[c.id] ?? ''}
                        </td>
                      ))}
                      <td className="p-1 font-black bg-slate-50 font-sans">
                        {score ? score.totalMarks : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Footer Signature Lines */}
          <div className="mt-12 flex justify-between items-center text-xs font-bold text-slate-800 pt-8 border-t border-slate-400">
            <div>{getJudgeName(1)} Sig: ____________________</div>
            <div>{getJudgeName(2)} Sig: ____________________</div>
            <div>{getJudgeName(3)} Sig: ____________________</div>
            <div>Secretariat Admin: ____________________</div>
          </div>

        </div>
      </div>
    </div>
  );
};
