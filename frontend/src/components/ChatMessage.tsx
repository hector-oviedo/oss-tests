import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User } from 'lucide-react';
import { Message } from '../types';

export const ChatMessage = memo(({ message }: { message: Message }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex gap-6 animate-in fade-in duration-300 slide-in-from-bottom-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${isUser ? 'bg-slate-700 ring-2 ring-slate-800' : 'bg-indigo-600 ring-2 ring-indigo-900'}`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={`relative max-w-[85%] rounded-2xl px-6 py-4 text-[15px] leading-7 shadow-sm ${isUser ? 'bg-slate-800 text-slate-100 rounded-tr-sm' : 'bg-transparent text-slate-200 -ml-2'}`}>
        {isUser ? message.text : (
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            className="markdown-content prose prose-invert prose-p:leading-7 prose-pre:bg-[#1e1e1e] prose-pre:rounded-xl prose-pre:border prose-pre:border-slate-800"
            components={{
              code({node, inline, className, children, ...props}: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="rounded-xl overflow-hidden my-4 border border-slate-700/50 shadow-sm">
                    <div className="bg-[#2d2d2d] px-4 py-2 text-xs text-slate-400 flex justify-between"><span>{match[1]}</span></div>
                    <SyntaxHighlighter {...props} style={vscDarkPlus} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: 0, background: '#1e1e1e' }}>
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : <code {...props} className={`${className} bg-slate-800/50 px-1.5 py-0.5 rounded text-indigo-300 text-sm`}>{children}</code>;
              }
            }}
          >
            {message.text}
          </ReactMarkdown>
        )}
        {!isUser && !message.text && (
          <div className="flex gap-1 h-6 items-center"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75" /><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" /></div>
        )}
      </div>
    </div>
  );
});
