import React from 'react';
import { ShieldAlert, EyeOff, Lock } from 'lucide-react';

interface SecurityOverlayProps {
  isProtected: boolean;
  alertMessage: string | null;
  judgeInfo?: string;
  isJudgeView?: boolean;
}

export const SecurityOverlay: React.FC<SecurityOverlayProps> = ({
  isProtected,
  alertMessage,
  judgeInfo,
  isJudgeView = false,
}) => {
  return (
    <>
      {/* Background Watermark for Judge View */}
      {isJudgeView && (
        <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden opacity-[0.035] select-none flex flex-col justify-between p-8">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="flex justify-between text-xs font-mono font-black tracking-widest text-slate-900 rotate-[-12deg] space-x-12 whitespace-nowrap">
              <span>ARMUN EDITION-2 CONFIDENTIAL EVALUATION</span>
              <span>{judgeInfo || 'RESTRICTED JUDGE SHEET'}</span>
              <span>DO NOT SCREENSHOT</span>
            </div>
          ))}
        </div>
      )}

      {/* Floating Alert Banner when shortcut or context menu blocked */}
      {alertMessage && !isProtected && (
        <div className="fixed top-4 right-4 z-50 bg-rose-900/95 text-rose-100 border border-rose-600 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur animate-in fade-in slide-in-from-top-2">
          <ShieldAlert className="w-5 h-5 text-rose-300 shrink-0" />
          <div className="text-xs font-semibold">{alertMessage}</div>
        </div>
      )}

      {/* Screen Blur / Blackout overlay when window loses focus */}
      {isProtected && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4">
            <EyeOff className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-2">
            Screen Protected for Security
          </h2>
          <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            Content hidden because window focus was lost, tab was switched, or screen capture was detected. Click or switch back to continue evaluation.
          </p>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-400 text-xs px-3.5 py-2 rounded-xl font-mono">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>ARMUN Edition-2 Security System Active</span>
          </div>
        </div>
      )}
    </>
  );
};
