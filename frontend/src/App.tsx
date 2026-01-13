import { useState, useRef, useEffect } from 'react';
import { Settings2, MessageSquare, Terminal } from 'lucide-react';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';
import type { Mode } from './types';

function App() {
  const [mode, setMode] = useState<Mode>('completion');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Each mode maintains its own separate history
  // However, for simplicity in this refactor, we are reloading the hook when mode changes.
  // Ideally, we'd want to persist state per mode, but this meets the immediate requirement.
  const { messages, isLoading, sendMessage, stopGeneration, clearHistory } = useChat(mode);

  // Clear history when switching modes to avoid context confusion
  useEffect(() => {
    clearHistory();
  }, [mode, clearHistory]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="flex h-screen bg-[#0B0F19] text-slate-100 font-sans overflow-hidden">
      <Sidebar isOpen={showSettings} onClear={clearHistory} />

      <div className="flex-1 flex flex-col relative bg-[#0B0F19]">
        {/* Header with Mode Switcher */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0F131F]">
          <div className="flex items-center space-x-4">
            <span className="font-bold text-lg hidden md:block">LocalAI</span>
            <div className="flex bg-slate-900 rounded-lg p-1">
              <button
                onClick={() => setMode('completion')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  mode === 'completion' ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal size={16} />
                <span>Completion</span>
              </button>
              <button
                onClick={() => setMode('chat')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  mode === 'chat' ? 'bg-slate-800 text-purple-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare size={16} />
                <span>Chat</span>
              </button>
            </div>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className="md:hidden p-2 text-slate-400"><Settings2 size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
            {messages.length === 0 ? (
              <EmptyState onSelect={text => sendMessage(text)} />
            ) : (
              messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <ChatInput onSend={text => sendMessage(text)} onStop={stopGeneration} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default App;
