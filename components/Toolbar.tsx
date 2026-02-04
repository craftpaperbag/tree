
import React, { useState } from 'react';
import { Download, RefreshCw, Plus, Trash2, Undo2, Redo2, Settings, X, Save, Info, FileText, ArrowRight, Brain, HelpCircle, Layers, Wand2, Layout, History, Terminal } from 'lucide-react';
import { PromptLog } from '../types';

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
  promptLogs: PromptLog[];
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
  onUpdateInstruction,
  promptLogs
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempInstruction, setTempInstruction] = useState(systemInstruction);
  const [activeTab, setActiveTab] = useState<'general' | 'transparency' | 'about'>('general');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const handleSaveSettings = () => {
    onUpdateInstruction(tempInstruction);
    setIsSettingsOpen(false);
  };

  // 実際に使用されているプロンプトのテンプレート
  const whyPrompt = "You are a logical analyst specializing in '5 Whys' root cause analysis. Your task is to identify deep, underlying causes and reasons. STRICT RULE: Focus only on 'why' the issue exists. DO NOT provide solutions, actions, or countermeasures. Provide 3 brief, distinct, and logical causes or reasons for it. Keep each point under 10 words.";
  const whatPrompt = "You are a strategic consultant specializing in decomposition and structural thinking. Given an idea or task and its broader context, provide 3 brief, distinct components, sub-tasks, or 'What/How' elements that make it up. Keep each point under 10 words.";
  const refinePrompt = `You are an expert editor. Rewrite the given short phrase to be more natural, grammatically correct, and professional while strictly preserving its original meaning.
For Japanese output, always use "である" style (da/de-aru) instead of "です/ます" style.
Example: "事務手順煩雑" -> "事務の手順が煩雑である"
Example: "コスト高い" -> "運用コストが高騰している"
Keep it concise (ideally under 15 words). 
Return ONLY the refined text string.`;

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
              setActiveTab('general');
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
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-indigo-600" />
                <h3 className="font-bold text-slate-800">AI Settings & Info</h3>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 shrink-0">
              <button 
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
              >
                Settings
              </button>
              <button 
                onClick={() => setActiveTab('transparency')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'transparency' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
              >
                Transparency
              </button>
              <button 
                onClick={() => setActiveTab('about')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'about' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
              >
                About
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Custom System Instruction
                    </label>
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                      AIが子ノードを生成する際の追加指示を設定できます。
                    </p>
                    <textarea
                      value={tempInstruction}
                      onChange={(e) => setTempInstruction(e.target.value)}
                      placeholder="例: 常に日本語で出力してください。丁寧な口調で。"
                      className="w-full h-32 p-3 text-base text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none font-medium"
                    />
                  </div>
                  <div className="flex gap-2">
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
                  </div>
                </div>
              )}

              {activeTab === 'transparency' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <section>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
                      <History size={16} className="text-indigo-500" />
                      Request History
                    </h4>
                    {promptLogs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No history yet. Start expanding nodes to see logs.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {promptLogs.map((log) => (
                          <div key={log.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <button 
                              onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${log.type === 'expand' ? (log.mode === 'why' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600') : 'bg-emerald-100 text-emerald-600'}`}>
                                  {log.type === 'expand' ? (log.mode === 'why' ? <HelpCircle size={14} /> : <Layers size={14} />) : <Wand2 size={14} />}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-bold text-slate-800 truncate max-w-[150px]">"{log.input}"</span>
                                  <span className="text-[9px] text-slate-400 font-medium">
                                    {new Date(log.timestamp).toLocaleTimeString()} · {log.type === 'expand' ? (log.mode === 'why' ? 'Why? 分析' : '要素分解') : '文章校正'}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight size={14} className={`text-slate-300 transition-transform duration-200 ${expandedLogId === log.id ? 'rotate-90' : ''}`} />
                            </button>
                            {expandedLogId === log.id && (
                              <div className="p-4 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-4">
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                      <Terminal size={12} className="text-slate-400" />
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Prompt Sent to Gemini</span>
                                    </div>
                                    <pre className="text-[10px] p-3 bg-slate-900 text-indigo-100 rounded-xl font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
                                      {log.fullPrompt}
                                    </pre>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                      <FileText size={12} className="text-slate-400" />
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Response</span>
                                    </div>
                                    <pre className="text-[10px] p-3 bg-white text-slate-700 rounded-xl font-mono overflow-x-auto border border-slate-200 leading-relaxed shadow-sm">
                                      {log.response}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
                      <Brain size={16} className="text-indigo-500" />
                      Process Flow
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { step: 1, text: "ノードのテキストをキャプチャ", icon: <FileText size={14} /> },
                        { step: 2, text: "分析モード（Why / What）を選択", icon: <ArrowRight size={14} /> },
                        { step: 3, text: "システム命令と追加指示を統合", icon: <Settings size={14} /> },
                        { step: 4, text: "Gemini 3 Flash API へリクエスト", icon: <Plus size={14} /> },
                        { step: 5, text: "JSONレスポンスを解析しツリーを更新", icon: <RefreshCw size={14} /> },
                      ].map((s) => (
                        <div key={s.step} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {s.step}
                          </div>
                          <div className="flex-1 text-xs font-semibold text-slate-700 flex items-center gap-2">
                            <span className="text-slate-400">{s.icon}</span>
                            {s.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
                      <Info size={16} className="text-amber-500" />
                      Core Templates
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2 block">Why Analysis Mode</span>
                        <code className="text-[11px] text-amber-900 leading-relaxed block font-mono bg-white/50 p-3 rounded-lg border border-amber-50 whitespace-pre-wrap">
                          {whyPrompt}
                        </code>
                      </div>
                      <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-2 block">What Decomposition Mode</span>
                        <code className="text-[11px] text-indigo-900 leading-relaxed block font-mono bg-white/50 p-3 rounded-lg border border-indigo-50 whitespace-pre-wrap">
                          {whatPrompt}
                        </code>
                      </div>
                      <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2 block">Text Refinement Mode</span>
                        <code className="text-[11px] text-emerald-900 leading-relaxed block font-mono bg-white/50 p-3 rounded-lg border border-emerald-50 whitespace-pre-wrap">
                          {refinePrompt}
                        </code>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl">
                    <h4 className="text-2xl font-black mb-2 tracking-tight">AI Thought Expansion Tree</h4>
                    <p className="text-indigo-100 text-sm leading-relaxed font-medium">
                      Google Gemini AIを活用し、アイデアの「要素分解」や「原因分析」を直感的に行えるマインドマッピングツールです。
                    </p>
                  </div>

                  <section className="space-y-4">
                    <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wider">主な機能</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 items-start">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                          <HelpCircle size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Why? 分析</p>
                          <p className="text-[11px] text-slate-500">問題の根本原因を論理的に深掘りします。</p>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 items-start">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                          <Layers size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">What? 分解</p>
                          <p className="text-[11px] text-slate-500">タスクや概念を構成要素へ分解します。</p>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 items-start">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                          <Wand2 size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">文章校正 (Refine)</p>
                          <p className="text-[11px] text-slate-500">短いメモを自然な文章に整えます。</p>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 items-start">
                        <div className="p-2 bg-slate-200 text-slate-600 rounded-lg">
                          <Layout size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">オートレイアウト</p>
                          <p className="text-[11px] text-slate-500">ノードを自動で最適な位置に配置します。</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="p-4 bg-slate-900 rounded-2xl text-slate-300 text-xs leading-relaxed border border-slate-800">
                    <p className="mb-2 text-slate-100 font-bold">開発者ノート:</p>
                    <p>
                      本ツールは思考の整理を加速させるために設計されました。
                      データはすべてブラウザのLocalStorageに保存され、外部サーバーに送信されるのはAIリクエスト時のテキストのみです。
                    </p>
                  </section>
                </div>
              )}
            </div>

            <div className="p-6 pt-2 border-t border-slate-100 bg-slate-50/30 shrink-0 flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-medium">
                Using: Google Gemini 3 Flash Preview
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-5 py-2 text-slate-600 text-sm font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Close
                </button>
                {activeTab === 'general' && (
                  <button
                    onClick={handleSaveSettings}
                    className="flex items-center gap-1.5 px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg active:scale-95 transition-all"
                  >
                    <Save size={16} />
                    Save Settings
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Internal icon for the list
const ChevronRight = ({ size, className }: { size: number, className: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default Toolbar;
