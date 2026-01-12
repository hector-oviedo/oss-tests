import { Sparkles } from 'lucide-react';

export const EmptyState = ({ onSelect }: { onSelect: (text: string) => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-700 slide-in-from-bottom-4">
    <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-4">
      <Sparkles size={40} className="text-white" />
    </div>
    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-slate-200">How can I help you today?</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
      {['Explain Quantum Computing', 'Write a Python script', 'Haiku about robots', 'Debug my code'].map(s => (
        <button key={s} onClick={() => onSelect(s)} className="p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-sm text-slate-300 transition-all hover:scale-[1.02] text-left">{s}</button>
      ))}
    </div>
  </div>
);
