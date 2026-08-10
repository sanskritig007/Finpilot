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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-xl shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-6">Account Settings</h3>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-6 flex items-start gap-2.5 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-3 rounded mb-6 flex items-start gap-2.5 text-sm">
            <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Reset AI Memory */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              AI Chat Memory
            </label>
            <button
              onClick={handleClearMemory}
              disabled={isClearing}
              className="w-full bg-slate-850 hover:bg-slate-800 text-white font-medium text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-slate-750 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isClearing ? 'animate-spin' : ''}`} />
              <span>{isClearing ? 'Clearing Memory...' : 'Reset AI Memory'}</span>
            </button>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Deletes current conversational context and resets your hourly prompt limits to start a fresh chat.
            </p>
          </div>

          {/* Account Deletion */}
          <div className="space-y-2 pt-6 border-t border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-red-400">
              Danger Zone
            </label>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="w-full bg-red-950/20 hover:bg-red-900/30 border border-red-900/50 text-red-400 hover:text-red-300 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isDeleting ? 'Deleting Account...' : 'Delete Account Permanently'}</span>
            </button>
            <p className="text-[10px] text-red-500/80 leading-relaxed font-medium">
              Warning: This will permanently wipe your profile, linked bank details, goals, and transaction history. This action is irreversible.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-6 mt-6 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-white font-medium bg-finpilot-primary hover:bg-finpilot-primary-hover transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
