import React, { useState } from 'react';
import api from '../../core/api';
import { X, Plus, AlertTriangle } from 'lucide-react';

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
      // Reset form states
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-xl shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-6">Add Savings Goal</h3>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-6 flex items-start gap-2.5 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Goal Name
            </label>
            <input
              type="text"
              placeholder="e.g. Goa Trip, New Laptop..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-850 border border-slate-750 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-finpilot-primary placeholder-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Target Amount (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 15000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full bg-slate-850 border border-slate-750 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-finpilot-primary placeholder-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Target Date (Optional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-850 border border-slate-750 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-finpilot-primary"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-750 text-slate-400 rounded-lg hover:text-white transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name || !targetAmount}
              className="px-5 py-2 rounded-lg text-white font-medium bg-finpilot-primary hover:bg-finpilot-primary-hover transition-colors disabled:opacity-50 flex items-center gap-1.5 text-sm"
            >
              {loading ? 'Saving...' : 'Add Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
