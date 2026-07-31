import React, { useState, useRef, useEffect } from 'react';
import api from '../../core/api';
import { MessageSquare, X, Send, AlertTriangle, ShieldCheck } from 'lucide-react';

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I am FinPilot, your AI financial assistant. Ask me questions about your transactions, spending habits, or Safe to Spend balance!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      // Send message history including the new user message
      const response = await api.post('/chat', {
        messages: [...messages.map(m => ({ role: m.role, content: m.content })), userMessage]
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send message. Make sure your server is online.');
    } finally {
      setLoading(false);
    }
  };

  const formatMessage = (content) => {
    return content.split('\n').map((line, lineIdx) => {
      let temp = line.trim();
      
      // Check if bullet line
      const isBullet = temp.startsWith('* ') || temp.startsWith('- ');
      if (isBullet) {
        temp = temp.substring(2);
      }
      
      // Parse **bold** parts
      const parts = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(temp)) !== null) {
        if (match.index > lastIndex) {
          parts.push(temp.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold text-white">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < temp.length) {
        parts.push(temp.substring(lastIndex));
      }
      
      const contentEl = parts.length > 0 ? parts : temp;
      
      if (isBullet) {
        return (
          <div key={lineIdx} className="flex items-start gap-2 ml-2 my-1">
            <span className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-finpilot-primary"></span>
            <span className="text-slate-100">{contentEl}</span>
          </div>
        );
      }
      
      return (
        <p key={lineIdx} className="min-h-[1rem] my-0.5 text-slate-100">
          {contentEl}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-finpilot-primary hover:bg-finpilot-primary-hover text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all flex items-center justify-center animate-bounce-subtle"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[500px] bg-finpilot-card border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <h4 className="text-sm font-bold text-white leading-none">FinPilot AI</h4>
                <span className="text-[10px] text-finpilot-muted mt-0.5 block">AI Companion</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-finpilot-muted hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/20">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-finpilot-primary text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60'
                  }`}
                >
                  <div className="space-y-1">{formatMessage(msg.content)}</div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700/60 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-finpilot-muted animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-finpilot-muted animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-finpilot-muted animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg flex items-start gap-2.5 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-slate-900/60 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask FinPilot..."
              disabled={loading}
              className="flex-1 bg-slate-850 border border-slate-750 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-finpilot-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-finpilot-primary hover:bg-finpilot-primary-hover disabled:opacity-50 text-white p-2 rounded-xl transition-all flex items-center justify-center shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          
          {/* Rate Limit Notice */}
          <div className="bg-slate-950 p-2 border-t border-slate-800 text-[10px] text-finpilot-muted flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            <span>Rate limit: 20 prompts / hour</span>
          </div>

        </div>
      )}

    </div>
  );
};
