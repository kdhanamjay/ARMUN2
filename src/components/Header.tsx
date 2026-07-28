import React from 'react';
import { UserSession } from '../types';
import { Lock, Shield, User, LogOut, Code, FileText, Smartphone } from 'lucide-react';

interface HeaderProps {
  session: UserSession;
  onLogout: () => void;
  onOpenPhpExporter: () => void;
  onOpenPrintModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onLogout,
  onOpenPhpExporter,
  onOpenPrintModal,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm text-slate-900 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Logo & School Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm text-white font-black tracking-tight text-sm">
              ARV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  AMARA RAJA VIDYALAYAM <span className="text-indigo-600 font-extrabold ml-1">ARMUN</span>
                </h1>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-mono border border-indigo-100 font-semibold">
                  CBSE 130513
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Diguvamagham, Chittoor • ARMUN Edition-2 Evaluation
              </p>
            </div>
          </div>

          {/* User Session & Actions */}
          <div className="flex items-center flex-wrap gap-2 justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-2 md:pt-0">
            {session.role === 'judge' && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5 text-xs text-indigo-900">
                <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">Active Evaluator</div>
                  <div className="font-bold">
                    {session.committeeId} — Judge #{session.judgeIndex}
                  </div>
                </div>
              </div>
            )}

            {session.role === 'admin' && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-xs text-amber-900">
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">Secretariat Panel</div>
                  <div className="font-bold">Secretariat Admin</div>
                </div>
              </div>
            )}

            {session.role === 'masteradmin' && (
              <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-1.5 text-xs text-purple-900">
                <Lock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-purple-600 font-semibold uppercase tracking-wider">Master Control</div>
                  <div className="font-bold">Master Admin (Full Rights)</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenPhpExporter}
                title="Download / View PHP & MySQL Source Code"
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                <Code className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">PHP/MySQL Code</span>
              </button>

              {(session.role === 'admin' || session.role === 'masteradmin') && onOpenPrintModal && (
                <button
                  onClick={onOpenPrintModal}
                  title="Print Official Rubric Sheets"
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-200"
                >
                  <FileText className="w-3.5 h-3.5 text-white" />
                  <span className="hidden sm:inline">Print Evaluation Sheet</span>
                </button>
              )}

              {session.role !== 'guest' && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
