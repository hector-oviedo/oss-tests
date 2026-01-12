import React, { useState, memo } from 'react';
import { Send, StopCircle } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isLoading: boolean;
}

export const ChatInput = memo(({ onSend, onStop, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="p-4 md:p-6 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19] to-transparent z-10">
      <div className="max-w-3xl mx-auto relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000" />
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-[#1E2330] rounded-2xl p-2 border border-slate-700/50 shadow-xl">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            placeholder="Send a message..."
            rows={1}
            className="w-full bg-transparent border-none text-slate-200 placeholder-slate-500 focus:ring-0 resize-none py-3 px-4 max-h-32 scrollbar-hide"
            disabled={isLoading}
          />
          {isLoading ? (
            <button type="button" onClick={onStop} className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all"><StopCircle size={20} /></button>
          ) : (
            <button type="submit" disabled={!input.trim()} className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20"><Send size={20} /></button>
          )}
        </form>
      </div>
      <p className="text-center text-xs text-slate-600 mt-4">AI can make mistakes. Verify important info.</p>
    </div>
  );
});
