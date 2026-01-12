import React, { memo } from 'react';
import { Zap, Terminal, Trash2 } from 'lucide-react';
import type { Settings } from '../types';
import { useHealth } from '../hooks/useHealth';

interface SidebarProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  isOpen: boolean;
  onClear: () => void;
}

export const Sidebar = memo(({ settings, setSettings, isOpen, onClear }: SidebarProps) => {
  const { isOnline, modelName } = useHealth();

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-[#0F131F] border-r border-slate-800 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
      <div className="flex flex-col h-full p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20"><Zap size={18} className="text-white" /></div>
          <h1 className="text-xl font-bold tracking-tight">LocalAI <span className="text-xs font-normal text-slate-500 ml-1">v1.0</span></h1>
        </div>
        <div className="space-y-8 flex-1">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2 text-indigo-400"><Terminal size={16} /><span className="text-xs font-bold uppercase tracking-wider">Active Model</span></div>
            <div className="text-sm font-medium text-slate-200">{isOnline ? modelName : 'Disconnected'}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs text-slate-400">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <div className="space-y-6">
            <RangeControl label="Temperature" value={settings.temperature} min={0} max={2} step={0.1} onChange={(v: number) => setSettings(s => ({...s, temperature: v}))} desc="Higher = more random" />
            <RangeControl label="Max Tokens" value={settings.maxTokens} min={64} max={4096} step={64} onChange={(v: number) => setSettings(s => ({...s, maxTokens: v}))} />
            <RangeControl label="Top P" value={settings.topP} min={0} max={1} step={0.05} onChange={(v: number) => setSettings(s => ({...s, topP: v}))} />
          </div>
        </div>
        <div className="pt-6 border-t border-slate-800">
          <button onClick={onClear} className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors w-full px-2 py-2 rounded-lg hover:bg-slate-800/50"><Trash2 size={16} />Clear History</button>
        </div>
      </div>
    </div>
  );
});

const RangeControl = ({ label, value, min, max, step, onChange, desc }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between text-sm"><span className="text-slate-400">{label}</span><span className="text-slate-200 font-mono">{value}</span></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
    {desc && <p className="text-xs text-slate-500">{desc}</p>}
  </div>
);
