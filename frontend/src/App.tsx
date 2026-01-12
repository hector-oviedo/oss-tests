import { useState, useRef, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';

function App() {
  const { messages, isLoading, sendMessage, stopGeneration, clearHistory } = useChat();
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="flex h-screen bg-[#0B0F19] text-slate-100 font-sans overflow-hidden">
      <Sidebar isOpen={showSettings} onClear={clearHistory} />

      <div className="flex-1 flex flex-col relative bg-[#0B0F19]">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-[#0F131F]">
          <span className="font-bold">LocalAI</span>
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-slate-400"><Settings2 size={20} /></button>
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