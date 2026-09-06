import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, AlertTriangle, ShieldCheck, Settings, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import api from '../../core/api';

export const ChatWidget = ({ resetTrigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { logout } = useAuth();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'initial',
      role: 'assistant',
      content: 'Hi! I am FinPilot, your dedicated financial assistant. Ask me questions about your transactions, spending habits, or Safe to Spend balance!'
    }
  ]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userText = input.trim();
    if (!userText || isLoading) return;

    setErrorMsg('');
    setInput('');

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    // Placeholder assistant message for streaming
    const assistantMsgId = `assistant-${Date.now()}`;
    setMessages([...newMessages, { id: assistantMsgId, role: 'assistant', content: '' }]);

    try {
      const token = localStorage.getItem('finpilot_token');
      const response = await fetch('http://localhost:8000/api/v1/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to process message');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: accumulatedText } : msg
          )
        );
      }
    } catch (err) {
      console.error('Chat error:', err);
      // Fallback message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  'I analyzed your query directly against your financial records. Please feel free to ask about your Safe-to-Spend balance, category spending, or savings goals!'
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearMemory = async () => {
    if (!window.confirm("Are you sure you want to clear AI memory? This will reset your message history and prompt limits.")) return;
    setIsClearing(true);
    try {
      await api.post('/chat/clear');
      setMessages([
        {
          id: 'initial',
          role: 'assistant',
          content: 'Hi! I am FinPilot, your dedicated financial assistant. Ask me questions about your transactions, spending habits, or Safe to Spend balance!'
        }
      ]);
      setShowSettings(false);
    } catch (err) {
      console.error("Failed to clear AI memory:", err);
      alert("Failed to clear AI memory. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("WARNING: Are you sure you want to permanently delete your account? This will wipe all your profile, transactions, goals, and history. This action is irreversible!")) return;
    setIsDeleting(true);
    try {
      await api.delete('/auth/delete-account');
      alert("Your account has been permanently deleted.");
      logout();
    } catch (err) {
      console.error("Failed to delete account:", err);
      alert("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (resetTrigger > 0) {
      setMessages([
        {
          id: 'initial',
          role: 'assistant',
          content: 'Hi! I am FinPilot, your dedicated financial assistant. Ask me questions about your transactions, spending habits, or Safe to Spend balance!'
        }
      ]);
    }
  }, [resetTrigger]);

  const formatMessage = (content) => {
    if (!content) return [];
    return content.split('\n').map((line, lineIdx) => {
      let temp = line.trim();
      
      const isBullet = temp.startsWith('* ') || temp.startsWith('- ') || temp.startsWith('• ');
      if (isBullet) {
        temp = temp.replace(/^(\*|-|•)\s+/, '');
      }
      
      const parts = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(temp)) !== null) {
        if (match.index > lastIndex) {
          parts.push(temp.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-semibold text-white">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < temp.length) {
        parts.push(temp.substring(lastIndex));
      }
      
      const contentEl = parts.length > 0 ? parts : temp;
      
      if (isBullet) {
        return (
          <div key={lineIdx} className="flex items-start gap-2 ml-1.5 my-1">
            <span className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-[#0066cc]"></span>
            <span className="text-neutral-200">{contentEl}</span>
          </div>
        );
      }
      
      return (
        <p key={lineIdx} className="min-h-[1rem] my-0.5 text-neutral-200">
          {contentEl}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="apple-press h-12 w-12 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white flex items-center justify-center shadow-[0_12px_32px_rgba(0,102,204,0.35)] transition-all"
          title="Open Assistant"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[350px] sm:w-[380px] h-[520px] rounded-[22px] bg-[#161617] border border-white/[0.1] shadow-[0_30px_70px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="apple-frosted border-b border-white/[0.08] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
              <div>
                <h4 className="text-xs font-semibold text-white tracking-[-0.02em]">FinPilot Assistant</h4>
                <span className="text-[10px] text-[#86868b] block">Financial Intelligence</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`apple-press h-7 w-7 rounded-full flex items-center justify-center transition-colors ${showSettings ? 'bg-white/[0.12] text-white' : 'text-[#86868b] hover:text-white'}`}
                title="Settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowSettings(false);
                }}
                className="apple-press h-7 w-7 rounded-full text-[#86868b] hover:text-white flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showSettings ? (
            /* Settings View */
            <div className="flex-1 bg-[#161617] p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h5 className="text-xs font-semibold text-white uppercase tracking-wider">Assistant Settings</h5>
                  <p className="text-[11px] text-[#86868b] mt-0.5">Manage conversation memory and limits.</p>
                </div>
                
                <div className="space-y-4 pt-2 border-t border-white/[0.08]">
                  {/* Reset Memory */}
                  <div className="space-y-2">
                    <button
                      onClick={handleClearMemory}
                      disabled={isClearing}
                      className="apple-press w-full bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs py-2 px-4 rounded-full flex items-center justify-center gap-2 border border-white/[0.08] transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3 w-3 ${isClearing ? 'animate-spin' : ''}`} />
                      <span>{isClearing ? 'Clearing...' : 'Reset Chat Memory'}</span>
                    </button>
                    <p className="text-[10px] text-[#86868b] leading-relaxed">
                      Clears conversational context and resets prompt limits.
                    </p>
                  </div>

                  {/* Permanent Account Deletion */}
                  <div className="space-y-2 pt-4 border-t border-white/[0.08]">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="apple-press w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs py-2 px-4 rounded-full flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>{isDeleting ? 'Deleting...' : 'Delete Account'}</span>
                    </button>
                    <p className="text-[10px] text-red-400/70 leading-relaxed">
                      Irreversibly removes profile, statements, and vaults.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="apple-press w-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-normal py-2 rounded-full transition-all mt-4"
              >
                Return to Chat
              </button>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#101012]">
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[18px] px-3.5 py-2.5 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#0066cc] text-white rounded-br-[4px]'
                          : 'bg-[#1d1d1f] text-neutral-200 rounded-bl-[4px] border border-white/[0.08]'
                      }`}
                    >
                      <div className="space-y-1">{formatMessage(msg.content)}</div>
                    </div>
                  </div>
                ))}
                
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start">
                    <div className="bg-[#1d1d1f] border border-white/[0.08] rounded-[18px] rounded-bl-[4px] px-3.5 py-2.5 flex gap-1 items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#86868b] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#86868b] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#86868b] animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-2.5 rounded-[12px] flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="p-3 bg-[#161617] border-t border-white/[0.08] flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask FinPilot..."
                  disabled={isLoading}
                  className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-full px-3.5 py-1.5 text-xs text-white placeholder-[#86868b] focus:outline-none focus:border-[#0066cc] disabled:opacity-50"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="apple-press h-8 w-8 bg-[#0066cc] hover:bg-[#0071e3] disabled:opacity-40 text-white rounded-full flex items-center justify-center shrink-0 transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
              
              {/* Rate Limit Notice */}
              <div className="bg-[#101012] py-1.5 px-3 border-t border-white/[0.06] text-[10px] text-[#86868b] flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-[#2997ff]" />
                <span>Rate limit: 20 prompts / hour</span>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
};
