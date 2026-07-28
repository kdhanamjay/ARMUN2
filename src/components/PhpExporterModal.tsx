import React, { useState } from 'react';
import { generatePhpProjectCode, PhpProjectFiles } from '../utils/phpExporter';
import { X, Download, Copy, Check, FileCode, Database } from 'lucide-react';

interface PhpExporterModalProps {
  onClose: () => void;
}

export const PhpExporterModal: React.FC<PhpExporterModalProps> = ({ onClose }) => {
  const files: PhpProjectFiles = generatePhpProjectCode();
  const fileKeys = Object.keys(files) as Array<keyof PhpProjectFiles>;
  const [selectedFile, setSelectedFile] = useState<keyof PhpProjectFiles>('index.php');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (content: string, filename: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(filename);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadSingle = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    fileKeys.forEach((key) => {
      handleDownloadSingle(key, files[key]);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 text-white max-w-5xl w-full rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Standalone PHP & MySQL Project Exporter
              </h2>
              <p className="text-xs text-slate-400">
                Generated source code for Amara Raja Vidyalayam ARMUN Edition-2 Evaluation System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download All PHP Files</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* File Selector Sidebar */}
          <div className="w-full md:w-64 bg-slate-950/50 p-3 border-r border-slate-800 shrink-0 space-y-1 overflow-y-auto">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
              Project Code Files
            </div>
            {fileKeys.map((filename) => {
              const isDb = filename.endsWith('.sql');
              const isSelected = selectedFile === filename;

              return (
                <button
                  key={filename}
                  onClick={() => setSelectedFile(filename)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-mono font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isDb ? <Database className="w-3.5 h-3.5 text-amber-400" /> : <FileCode className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{filename}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center shrink-0">
              <span className="text-xs font-mono font-bold text-indigo-300 flex items-center gap-1.5">
                <span>{selectedFile}</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(files[selectedFile], selectedFile)}
                  className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg transition"
                >
                  {copiedKey === selectedFile ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownloadSingle(selectedFile, files[selectedFile])}
                  className="flex items-center gap-1 text-xs bg-indigo-800 hover:bg-indigo-700 text-indigo-100 border border-indigo-600 px-2.5 py-1 rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-slate-300 bg-slate-950/40 leading-relaxed whitespace-pre selection:bg-indigo-500/30">
              {files[selectedFile]}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
