import React, { useState } from 'react';
import api from '../../core/api';
import { X, AlertTriangle } from 'lucide-react';

export const AddCommitmentModal = ({ isOpen, onClose, onCommitmentAdded }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Subscriptions');
  const [dueDay, setDueDay] = useState('5');
  const [frequency, setFrequency] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please provide a valid obligation name and amount.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/commitments', {
        name: name.trim(),
        amount: parseFloat(amount),
        category: category,
        due_day: parseInt(dueDay, 10) || 1,
        frequency: frequency,
      });
      setName('');
      setAmount('');
      setCategory('Subscriptions');
      setDueDay('5');
      onCommitmentAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save fixed commitment.');
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

        <h3 className="text-lg font-semibold text-white tracking-[-0.02em] mb-6">Add Fixed Commitment</h3>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-[12px] mb-5 flex items-start gap-2 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
              Obligation Name
            </label>
            <input
              type="text"
              placeholder="e.g. House Rent, Netflix, Car Loan EMI..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] text-white rounded-[12px] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#0066cc] placeholder-[#86868b]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                Amount (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 18000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.08] text-white rounded-[12px] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#0066cc] placeholder-[#86868b]"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                Due Day of Month
              </label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="1 - 31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.08] text-white rounded-[12px] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#0066cc]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1d1d1f] border border-white/[0.08] text-white rounded-[12px] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#0066cc]"
              >
                <option value="Housing">Housing & Rent</option>
                <option value="Subscriptions">Subscriptions</option>
                <option value="Debt & Loans">Debt & Loans</option>
                <option value="Utilities">Utilities & Bills</option>
                <option value="Insurance">Insurance</option>
                <option value="Other">Other Fixed</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                Cadence
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full bg-[#1d1d1f] border border-white/[0.08] text-white rounded-[12px] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#0066cc]"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
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
              {loading ? 'Saving...' : 'Lock Obligation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
