import React, { useState } from 'react';
import api from '../../core/api';
import { X, AlertTriangle } from 'lucide-react';

export const AddGoalModal = ({ isOpen, onClose, onGoalAdded }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount || isNaN(targetAmount) || parseFloat(targetAmount) <= 0) {
      setError('Please provide a valid goal name and target amount.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/goals/', {
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
        target_date: targetDate ? targetDate : null,
      });
      setName('');
      setTargetAmount('');
      setTargetDate('');
      onGoalAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create savings goal.');
    } finally {
      setLoading(false);
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

        <h3 className="text-lg font-semibold text-white tracking-[-0.02em] mb-6">Create Savings Vault</h3>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-[12px] mb-5 flex items-start gap-2 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
              Vault Name / Purpose
            </label>
            <input
              type="text"
              placeholder="e.g. Goa Trip, New Laptop..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] text-white rounded-[12px] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#0066cc] placeholder-[#86868b]"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
              Target Capital (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 15000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] text-white rounded-[12px] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#0066cc] placeholder-[#86868b]"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
              Maturity Target Date (Optional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] text-white rounded-[12px] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#0066cc]"
            />
          </div>

          <div className="flex gap-2.5 justify-end pt-4 mt-6 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="apple-press px-4 py-2 rounded-full text-[#86868b] hover:text-white transition-colors text-xs font-normal"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="apple-press px-5 py-2 rounded-full text-white font-medium bg-[#0066cc] hover:bg-[#0071e3] transition-colors text-xs disabled:opacity-40"
            >
              {loading ? 'Creating...' : 'Establish Vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
