import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: botMessageId, text: '', sender: 'bot' }]);

    try {
      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          max_tokens: 512,
          temperature: 0.7,
        }),
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
    } catch (error) {
      console.error('Inference error:', error);
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === botMessageId ? { ...msg, text: 'Error: Failed to connect to inference server.' } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">GPT-OSS 20B</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Inference Server Active
            </p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Bot size={64} className="mb-4 opacity-20" />
            <p className="text-lg">Start a conversation with the model.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${ 
                msg.sender === 'user' ? 'bg-slate-700' : 'bg-indigo-600'
              }`}>
                {msg.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${ 
                msg.sender === 'user' 
                  ? 'bg-slate-800 text-slate-100 rounded-tr-none' 
                  : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
              }`}>
                {msg.text || (msg.sender === 'bot' && <span className="animate-pulse">...</span>)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-6 bg-slate-950">
        <form 
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-3 p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl transition-colors"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-600 mt-4 uppercase tracking-widest font-semibold">
          Local Inference • Powered by vLLM
        </p>
      </footer>
    </div>
  );
}

export default App;