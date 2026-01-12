import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings2, Sparkles, StopCircle, Terminal, Zap, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Types
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

interface Settings {
  temperature: number;
  maxTokens: number;
  topP: number;
}

function App() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    temperature: 0.7,
    maxTokens: 1024,
    topP: 0.95,
  });
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handlers
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: botMessageId, text: '', sender: 'bot', timestamp: Date.now() }]);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage.text,
          max_tokens: settings.maxTokens,
          temperature: settings.temperature,
          top_p: settings.topP,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) throw new Error('No response body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            accumulatedText += data.text;
            
            setMessages((prev) => 
              prev.map((msg) => 
                msg.id === botMessageId ? { ...msg, text: accumulatedText } : msg
              )
            );
          } catch (err) {
            console.error('Error parsing chunk:', err);
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Generation stopped by user');
      } else {
        console.error('Inference error:', error);
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === botMessageId ? { ...msg, text: msg.text + '\n\n*[Error: Connection failed or interrupted]*' } : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F19] text-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar (Settings) */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-[#0F131F] border-r border-slate-800 transform transition-transform duration-300 ease-in-out
        ${showSettings ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">LocalAI <span className="text-xs font-normal text-slate-500 ml-1">v1.0</span></h1>
          </div>

          <div className="space-y-8 flex-1">
            
            {/* Model Info card */}
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2 text-indigo-400">
                <Terminal size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Active Model</span>
              </div>
              <div className="text-sm font-medium text-slate-200">openai/gpt-oss-20b</div>
              <div className="flex items-center gap-2 mt-2">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                 <span className="text-xs text-slate-400">Online & Ready</span>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Temperature</span>
                  <span className="text-slate-200 font-mono">{settings.temperature}</span>
                </div>
                <input 
                  type="range" min="0" max="2" step="0.1" 
                  value={settings.temperature}
                  onChange={(e) => setSettings(s => ({...s, temperature: parseFloat(e.target.value)}))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <p className="text-xs text-slate-500">Higher values make output more random.</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Max Tokens</span>
                  <span className="text-slate-200 font-mono">{settings.maxTokens}</span>
                </div>
                <input 
                  type="range" min="64" max="4096" step="64" 
                  value={settings.maxTokens}
                  onChange={(e) => setSettings(s => ({...s, maxTokens: parseInt(e.target.value)}))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Top P</span>
                  <span className="text-slate-200 font-mono">{settings.topP}</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.05" 
                  value={settings.topP}
                  onChange={(e) => setSettings(s => ({...s, topP: parseFloat(e.target.value)}))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
             <button 
               onClick={handleClear}
               className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors w-full px-2 py-2 rounded-lg hover:bg-slate-800/50"
             >
               <Trash2 size={16} />
               Clear History
             </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[#0B0F19]">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-[#0F131F]">
           <span className="font-bold">LocalAI</span>
           <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-slate-400">
             <Settings2 size={20} />
           </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
            
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-700 slide-in-from-bottom-4">
                <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-4">
                  <Sparkles size={40} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-slate-200">
                  How can I help you today?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                  {['Explain Quantum Computing', 'Write a Python script', 'Haiku about robots', 'Debug my code'].map((suggestion) => (
                    <button 
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-sm text-slate-300 transition-all hover:scale-[1.02] text-left"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-6 animate-in fade-in duration-300 slide-in-from-bottom-2 ${ 
                  msg.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg
                  ${msg.sender === 'user' ? 'bg-slate-700 ring-2 ring-slate-800' : 'bg-indigo-600 ring-2 ring-indigo-900'}
                `}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Message Bubble */}
                <div className={`
                  relative max-w-[85%] rounded-2xl px-6 py-4 text-[15px] leading-7 shadow-sm
                  ${msg.sender === 'user' 
                    ? 'bg-slate-800 text-slate-100 rounded-tr-sm' 
                    : 'bg-transparent text-slate-200 -ml-2'
                  }
                `}>
                  {msg.sender === 'bot' ? (
                     <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      className="markdown-content prose prose-invert prose-p:leading-7 prose-pre:bg-[#1e1e1e] prose-pre:rounded-xl prose-pre:border prose-pre:border-slate-800"
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <div className="rounded-xl overflow-hidden my-4 border border-slate-700/50 shadow-sm">
                              <div className="bg-[#2d2d2d] px-4 py-2 text-xs text-slate-400 flex items-center justify-between">
                                <span>{match[1]}</span>
                              </div>
                              <SyntaxHighlighter
                                {...props}
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{ margin: 0, borderRadius: 0, background: '#1e1e1e' }}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code {...props} className={`${className} bg-slate-800/50 px-1.5 py-0.5 rounded text-indigo-300 text-sm`}>
                              {children}
                            </code>
                          )
                        }
                      }}
                     >
                       {msg.text}
                     </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                  {msg.sender === 'bot' && !msg.text && (
                    <div className="flex items-center gap-1 h-6">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19] to-transparent z-10">
          <div className="max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
              <form 
                onSubmit={handleSubmit}
                className="relative flex items-end gap-2 bg-[#1E2330] rounded-2xl p-2 border border-slate-700/50 shadow-xl"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Send a message..."
                  rows={1}
                  className="w-full bg-transparent border-none text-slate-200 placeholder-slate-500 focus:ring-0 resize-none py-3 px-4 max-h-32 scrollbar-hide"
                  disabled={isLoading}
                />
                
                {isLoading ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all"
                    title="Stop generation"
                  >
                    <StopCircle size={20} />
                  </button>
                ) : (
                   <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                  >
                    <Send size={20} />
                  </button>
                )}
              </form>
            </div>
            <p className="text-center text-xs text-slate-600 mt-4">
              AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
