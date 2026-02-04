
import React, { useState } from 'react';
import { Download, RefreshCw, Plus, Trash2, Undo2, Redo2, Settings, X, Save } from 'lucide-react';

interface ToolbarProps {
  onAddRoot: () => void;
  onClear: () => void;
  onExport: () => void;
  onAutoLayout: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  systemInstruction: string;
  onUpdateInstruction: (val: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  onAddRoot, 
  onClear, 
  onExport, 
  onAutoLayout,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  systemInstruction,
  onUpdateInstruction
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempInstruction, setTempInstruction] = useState(systemInstruction);

  const handleSaveSettings = () => {
    onUpdateInstruction(tempInstruction);
    setIsSettingsOpen(false);
  };

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 sm:gap-2 bg-white/95 backdrop-blur-md px-2 sm:px-4 py-2 rounded-2xl border border-slate-200 shadow-2xl max-w-[95vw] sm:max-w-none overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1 shrink-0">
          <span className="text-indigo-600 font-black text-base sm:text-lg tracking-tighter flex items-center gap-1.5">
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] shadow-inner shrink-0">AI</div>
            <span className="hidden xs:inline">Tree</span>
          </span>
        </div>
        
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 sm:p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-20 rounded-xl transition-all"
            title="Undo"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 sm:p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-20 rounded-xl transition-all"
            title="Redo"
          >
            <Redo2 size={18} />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-0.5 sm:mx-1 shrink-0" />

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onAddRoot}
            className="flex items-center gap-1 px-2.5 sm:px-4 py-1.5 bg-indigo-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-md active:scale-95"
          >
            <Plus size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">New Root</span>
            <span className="sm:hidden">Root</span>
          </button>

          <button
            onClick={onAutoLayout}
            className="p-1.5 sm:p-2 bg-white text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            title="Auto Layout"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={() => {
              setTempInstruction(systemInstruction);
              setIsSettingsOpen(true);
            }}
            className="p-1.5 sm:p-2 bg-white text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            title="AI Settings"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={onExport}
            className="p-1.5 sm:p-2 bg-white text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            title="Export"
          >
            <Download size={16} />
          </button>

          <button
            onClick={onClear}
            className="p-1.5 sm:p-2 bg-white text-red-500 rounded-xl border border-red-100 hover:bg-red-50 transition-all shadow-sm active:scale-95"
            title="Clear"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-indigo-600" />
                <h3 className="font-bold text-slate-800">AI Settings</h3>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Custom System Instruction
              </label>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Add instructions to guide how AI generates child nodes (e.g., "Always output in Japanese", "Be extremely concise", etc.)
              </p>
              <textarea
                value={tempInstruction}
                onChange={(e) => setTempInstruction(e.target.value)}
                placeholder="Example: Always output in Japanese. Use formal tone."
                className="w-full h-32 p-3 text-base text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none font-medium"
              />
            </div>
            <div className="flex gap-2 p-6 pt-0">
              <button 
                onClick={() => setTempInstruction("Always output in Japanese.")}
                className="text-[10px] px-3 py-1.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Set Japanese
              </button>
              <button 
                onClick={() => setTempInstruction("")}
                className="text-[10px] px-3 py-1.5 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Reset
              </button>
              <div className="flex-1" />
              <button
                onClick={handleSaveSettings}
                className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg active:scale-95 transition-all"
              >
                <Save size={16} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Toolbar;
