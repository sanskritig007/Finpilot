import React, { useState } from 'react';
import api from '../../core/api';
import { useAuth } from '../auth/AuthContext';
import { X, RefreshCw, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const SettingsModal = ({ isOpen, onClose, onResetChat }) => {
  const [isClearing, setIsClearing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { logout } = useAuth();

  if (!isOpen) return null;

  const handleClearMemory = async () => {
    if (!window.confirm("Are you sure you want to clear AI memory? This will reset your message history and prompt limits.")) return;
    setIsClearing(true);
    setError('');
    setMessage('');
    try {
      await api.post('/chat/clear');
      onResetChat();
      setMessage("AI memory successfully reset.");
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError("Failed to clear AI memory. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("WARNING: Are you sure you want to permanently delete your account? This will wipe all your profile, transactions, goals, and history. This action is irreversible!")) return;
    setIsDeleting(true);
    setError('');
    setMessage('');
    try {
      await api.delete('/auth/delete-account');
      alert("Your account has been permanently deleted.");
      logout();
    } catch (err) {
      setError("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
      <div className="bg-[#161617] border border-white/[0.1] w-full max-w-md p-6 md:p-8 rounded-[22px] shadow-[0_30px_70px_rgba(0,0,0,0.8)] relative">
        <button
          onClick={onClose}
          className="apple-press absolute top-5 right-5 h-7 w-7 rounded-full text-[#86868b] hover:text-white flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-lg font-semibold text-white tracking-[-0.02em] mb-6">Settings</h3>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-[12px] mb-5 flex items-start gap-2 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-[12px] mb-5 flex items-start gap-2 text-xs">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Reset AI Memory */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
              Conversational State
            </label>
            <button
              onClick={handleClearMemory}
              disabled={isClearing}
              className="apple-press w-full bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs py-2 px-4 rounded-full flex items-center justify-center gap-2 border border-white/[0.08] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isClearing ? 'animate-spin' : ''}`} />
              <span>{isClearing ? 'Resetting Context...' : 'Clear Assistant Memory'}</span>
            </button>
            <p className="text-[10px] text-[#86868b] leading-relaxed">
              Clears context cache and resets hourly prompt quota.
            </p>
          </div>

          {/* Account Deletion */}
          <div className="space-y-2 pt-6 border-t border-white/[0.08]">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-red-400/80">
              Account Deletion
            </label>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="apple-press w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs py-2 px-4 rounded-full flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Account Permanently'}</span>
            </button>
            <p className="text-[10px] text-red-400/60 leading-relaxed">
              Wipes all user profile data, statements, and vault records. Irreversible.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 mt-6 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="apple-press bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-normal px-5 py-2 rounded-full transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
