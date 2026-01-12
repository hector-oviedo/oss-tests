import { useState, useRef, useCallback } from 'react';
import type { Message, Settings } from '../types';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string, settings: Settings) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: Date.now() };
    const botMsgId = (Date.now() + 1).toString();
    
    setMessages(prev => [...prev, userMsg, { id: botMsgId, text: '', sender: 'bot', timestamp: Date.now() }]);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
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
  }, [isLoading]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

  const clearHistory = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, stopGeneration, clearHistory };
};
