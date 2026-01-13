import { useState, useRef, useCallback } from 'react';
import type { Message, Mode } from '../types';

export const useChat = (mode: Mode) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: Date.now() };
    const botMsgId = (Date.now() + 1).toString();
    
    // Optimistically update UI
    setMessages(prev => [...prev, userMsg, { id: botMsgId, text: '', sender: 'bot', timestamp: Date.now() }]);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const endpoint = mode === 'chat' 
        ? 'http://localhost:8000/chat' 
        : 'http://localhost:8000/completion';
      
      let payload;
      if (mode === 'chat') {
        // Construct messages list for chat mode
        // Note: We include previous history for context
        // This effectively rebuilds the conversation history for every request
        // since the backend is stateless
        const history = messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));
        history.push({ role: 'user', content: text });
        
        payload = { messages: history };
      } else {
        // Completion mode just sends the raw prompt
        payload = { prompt: text };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
            setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, text: accumulatedText } : msg));
          } catch (e) { console.error('Parse error', e); }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, text: msg.text + '\n*[Error: Failed]*' } : msg));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [isLoading, mode, messages]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

  const clearHistory = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, stopGeneration, clearHistory };
};