import React, { useState } from 'react';
import { CommitteeId, UserRole } from '../types';
import { COMMITTEES } from '../data/initialData';
import { Shield, Lock, Smartphone, ChevronRight, AlertCircle, KeyRound } from 'lucide-react';

interface LoginModalProps {
  onLogin: (payload: { role: UserRole; committeeId?: CommitteeId; judgeIndex?: 1 | 2 | 3; pin: string }) => Promise<{ success: boolean; message?: string }>;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('judge');
  const [committeeId, setCommitteeId] = useState<CommitteeId>('UNSC');
  const [judgeIndex, setJudgeIndex] = useState<1 | 2 | 3>(1);
  const [pin, setPin] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Please enter your security password/PIN.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await onLogin({ role, committeeId, judgeIndex, pin });
      if (!res.success) {
        setErrorMsg(res.message || 'Authentication failed. Please check your password/PIN.');
      }
    } catch (err: any) {
      setErrorMsg('Error connecting to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white p-6 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center font-black text-white text-sm shadow-inner">
              ARV
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                ARMUN EDITION-2
              </h2>
              <p className="text-xs text-indigo-200 font-medium">
                Official Rubrics Evaluation Portal
              </p>
            </div>
          </div>
          
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Please log in with your assigned credentials. Each judge's evaluation remains strictly isolated and confidential.
          </p>
        </div>

        <div className="p-6">
          {/* Role Toggle Selector */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setRole('judge'); setErrorMsg(null); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition-all ${
                role === 'judge'
                  ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Judge</span>
            </button>

            <button
              type="button"
              onClick={() => { setRole('admin'); setErrorMsg(null); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition-all ${
                role === 'admin'
                  ? 'bg-white text-amber-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Secretariat</span>
            </button>

            <button
              type="button"
              onClick={() => { setRole('masteradmin'); setErrorMsg(null); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition-all ${
                role === 'masteradmin'
                  ? 'bg-white text-purple-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Master Admin</span>
            </button>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl mb-5 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {role === 'judge' && (
              <>
                {/* Committee Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Select Committee
                  </label>
                  <select
                    value={committeeId}
                    onChange={(e) => {
                      setCommitteeId(e.target.value as CommitteeId);
                      setPin('');
                    }}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white text-slate-900 text-sm rounded-xl p-3 font-medium transition-all outline-none"
                  >
                    {COMMITTEES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Judge Slot Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Select Judge Slot
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setJudgeIndex(num as 1 | 2 | 3);
                          setPin('');
                        }}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 ${
                          judgeIndex === num
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-600/20'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs text-slate-500 font-normal">Slot</span>
                        <span>Judge {num}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Security PIN / Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                {role === 'masteradmin'
                  ? 'Master Admin Password'
                  : role === 'admin'
                  ? 'Secretariat Admin Password'
                  : `PIN for ${committeeId} - Judge ${judgeIndex}`}
              </label>
              <input
                type="password"
                inputMode={role === 'judge' ? 'numeric' : 'text'}
                placeholder={
                  role === 'masteradmin'
                    ? 'Enter Master Admin Password'
                    : role === 'admin'
                    ? 'Enter Admin Password'
                    : 'Enter Security PIN'
                }
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white text-slate-900 text-base tracking-widest font-mono rounded-xl p-3 transition-all outline-none"
                autoFocus
              />
              {role === 'masteradmin' && (
                <p className="text-[11px] text-purple-700 font-medium mt-1.5 bg-purple-50 p-2 rounded-lg border border-purple-100">
                  ⚡ <strong>Master Admin Access:</strong> Modify/update marks for any judge and print score sheets.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-4 text-white ${
                role === 'masteradmin'
                  ? 'bg-purple-700 hover:bg-purple-600 active:bg-purple-800 shadow-purple-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-600/20'
              }`}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>
                    {role === 'masteradmin'
                      ? 'Access Master Admin Panel'
                      : role === 'admin'
                      ? 'Access Secretariat Panel'
                      : `Enter Judge ${judgeIndex} Portal`}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
          <span>Optimized for Mobile Phones, Tablets & Desktop Browsers</span>
        </div>

      </div>
    </div>
  );
};
