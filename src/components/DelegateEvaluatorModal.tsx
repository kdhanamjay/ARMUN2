import React, { useState, useEffect } from 'react';
import { Delegate, RubricScore, CommitteeId } from '../types';
import { RUBRIC_CRITERIA } from '../data/initialData';
import { X, Check, Lock, Save, ChevronLeft, ChevronRight } from 'lucide-react';

interface DelegateEvaluatorModalProps {
  delegate: Delegate;
  committeeId: CommitteeId;
  judgeIndex: 1 | 2 | 3;
  existingScore: RubricScore | null;
  onSave: (score: { criteriaScores: Record<string, number>; comments: string; isLocked: boolean }) => Promise<void>;
  onClose: () => void;
  onNavigateDelegate?: (direction: 'next' | 'prev') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const DelegateEvaluatorModal: React.FC<DelegateEvaluatorModalProps> = ({
  delegate,
  committeeId,
  judgeIndex,
  existingScore,
  onSave,
  onClose,
  onNavigateDelegate,
  hasPrev,
  hasNext,
}) => {
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    RUBRIC_CRITERIA.forEach((c) => {
      initial[c.id] = existingScore?.criteriaScores?.[c.id] ?? 0;
    });
    return initial;
  });

  const [comments, setComments] = useState(existingScore?.comments || '');
  const [isLocked, setIsLocked] = useState(existingScore?.isLocked || false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const initial: Record<string, number> = {};
    RUBRIC_CRITERIA.forEach((c) => {
      initial[c.id] = existingScore?.criteriaScores?.[c.id] ?? 0;
    });
    setCriteriaScores(initial);
    setComments(existingScore?.comments || '');
    setIsLocked(existingScore?.isLocked || false);
    setValidationError(null);
  }, [delegate.id, existingScore]);

  // Calculate live total score out of 100
  const totalScore = Object.values(criteriaScores).reduce<number>((acc, val) => acc + (Number(val) || 0), 0);

  const handleScoreChange = (criterionId: string, value: number) => {
    if (isLocked) return;
    const clamped = Math.min(10, Math.max(0, value));
    setCriteriaScores((prev) => ({ ...prev, [criterionId]: clamped }));
    setSavedSuccess(false);
    setValidationError(null);
  };

  const handleSaveInternal = async (lockStatus: boolean) => {
    // Check if all criteria are filled/valid
    const unselected = RUBRIC_CRITERIA.filter((c) => criteriaScores[c.id] === undefined || criteriaScores[c.id] === null);
    if (unselected.length > 0) {
      setValidationError(`Mandatory Scoring Required: Please award marks (0-10) for all 10 rubric criteria. Missing: ${unselected.map(u => u.name).join(', ')}`);
      return;
    }

    setSaving(true);
    setValidationError(null);
    try {
      await onSave({
        criteriaScores,
        comments,
        isLocked: lockStatus,
      });
      setIsLocked(lockStatus);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 85) return 'bg-indigo-100 text-indigo-900 border-indigo-300';
    if (score >= 70) return 'bg-teal-100 text-teal-900 border-teal-300';
    if (score >= 50) return 'bg-amber-100 text-amber-900 border-amber-300';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white max-w-3xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex justify-between items-center border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold font-mono text-sm shadow-xs">
              #{delegate.slNo}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {delegate.delegateName}
                </h2>
                <span className="text-xs bg-slate-800 text-indigo-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                  {committeeId}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Portfolio: <span className="text-slate-200 font-bold">{delegate.portfolio}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Score Counter Badge */}
            <div className={`px-3 py-1.5 rounded-xl border text-sm font-bold font-mono ${getScoreBadgeClass(totalScore)}`}>
              {totalScore} / 100
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lock Warning Banner */}
        {isLocked && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-4 py-2.5 text-xs font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>This evaluation sheet is locked and submitted by Judge #{judgeIndex}.</span>
          </div>
        )}

        {validationError && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 py-3 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <span className="text-rose-600 font-mono text-sm">⚠️</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* Main Rubrics List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between border-b border-slate-200 pb-2">
            <span>ARMUN Edition-2 Delegate Evaluation Rubrics (10 Criteria, 10 Marks Each)</span>
            <span className="text-indigo-700 font-semibold">Evaluator: Judge #{judgeIndex}</span>
          </div>

          <div className="space-y-4">
            {RUBRIC_CRITERIA.map((criterion, index) => {
              const currentScore = criteriaScores[criterion.id] ?? 0;

              return (
                <div
                  key={criterion.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 transition-all hover:border-slate-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {index + 1}.
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {criterion.name}
                        </h4>
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          Max: 10M
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 pl-5">
                        {criterion.description}
                      </p>
                    </div>

                    {/* Numeric Input */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-xs font-medium text-slate-400">Score:</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        disabled={isLocked}
                        value={currentScore}
                        onChange={(e) => handleScoreChange(criterion.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center font-mono font-bold text-base bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white text-slate-900 rounded-xl p-2 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-400">/ 10</span>
                    </div>
                  </div>

                  {/* Touch Quick Buttons for Mobile Phones (0 to 10) */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {Array.from({ length: 11 }).map((_, val) => (
                      <button
                        key={val}
                        type="button"
                        disabled={isLocked}
                        onClick={() => handleScoreChange(criterion.id, val)}
                        className={`flex-1 min-w-[30px] sm:min-w-[36px] py-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
                          currentScore === val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-105'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 disabled:opacity-50'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Judge Comments */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Judge Remarks / Feedback (Optional)
            </label>
            <textarea
              disabled={isLocked}
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter observations on speech clarity, motion quality, diplomacy..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 focus:bg-white outline-none"
            ></textarea>
          </div>
        </div>

        {/* Modal Bottom Sticky Footer */}
        <div className="bg-white border-t border-slate-200 p-3 sm:p-4 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Navigation between Delegates */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            {onNavigateDelegate && (
              <>
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => onNavigateDelegate('prev')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() => onNavigateDelegate('next')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition"
                >
                  <span>Next Delegate</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Save & Submit Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {savedSuccess && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Saved!</span>
              </span>
            )}

            {!isLocked && (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveInternal(false)}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 transition shadow-xs"
                >
                  <Save className="w-4 h-4 text-slate-600" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveInternal(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20"
                >
                  <Lock className="w-4 h-4 text-indigo-200" />
                  <span>Submit & Lock Evaluation</span>
                </button>
              </>
            )}

            {isLocked && (
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs"
              >
                Close Sheet
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
