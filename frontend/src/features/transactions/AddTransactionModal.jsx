import React, { useState } from 'react';
import api from '../../core/api';
import { X, AlertTriangle } from 'lucide-react';

const CATEGORIES = [
  'Uncategorized',
  'Food & Dining',
  'Shopping',
  'Rent & Housing',
  'Salary',
  'Entertainment',
  'Bills & Utilities',
  'Travel & Transport',
  'Investment',
  'Refund'
];

export const AddTransactionModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'expense',
    category: 'Uncategorized',
    description: ''
  });
  const [hasManuallySelected, setHasManuallySelected] = useState(false);
  const [isAutoSuggested, setIsAutoSuggested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const guessCategory = (description, type) => {
    const desc = description.trim().toLowerCase();
    if (!desc) return 'Uncategorized';

    if (type === 'income') {
      if (['salary', 'paycheck', 'wages', 'stipend', 'bonus', 'credit'].some(k => desc.includes(k))) return 'Salary';
      if (['refund', 'cashback', 'reversal', 'returned'].some(k => desc.includes(k))) return 'Refund';
    }

    if (['swiggy', 'zomato', 'starbucks', 'mcdonald', 'burger', 'pizza', 'kfc', 'cafe', 'restaurant', 'dining', 'food', 'tea', 'coffee', 'chai', 'bakery', 'subway', 'domino'].some(k => desc.includes(k))) return 'Food & Dining';
    if (['amazon', 'flipkart', 'myntra', 'shopping', 'retail', 'decathlon', 'clothing', 'fashion', 'store', 'mall', 'supermarket', 'grocery', 'groceries', 'instamart', 'blinkit', 'zepto', 'dmart', 'market'].some(k => desc.includes(k))) return 'Shopping';
    if (['rent', 'housing', 'landlord', 'maintenance', 'society', 'pg', 'hostel', 'lease'].some(k => desc.includes(k))) return 'Rent & Housing';
    if (['netflix', 'spotify', 'prime video', 'disney', 'hotstar', 'youtube premium', 'movie', 'cinema', 'pvr', 'inox', 'bookmyshow', 'ticket', 'gaming', 'steam', 'playstation', 'xbox', 'pubg', 'club'].some(k => desc.includes(k))) return 'Entertainment';
    if (['electricity', 'water', 'wifi', 'broadband', 'phone bill', 'recharge', 'jio', 'airtel', 'vi ', 'gas', 'cylinder', 'power', 'utility', 'insurance', 'premium'].some(k => desc.includes(k))) return 'Bills & Utilities';
    if (['uber', 'ola', 'auto', 'petrol', 'fuel', 'shell', 'travel', 'irctc', 'flight', 'airline', 'metro', 'bus', 'cab', 'taxi', 'rapido', 'makemytrip', 'goibibo', 'toll', 'fastag'].some(k => desc.includes(k))) return 'Travel & Transport';
    if (['saved to', 'saving', 'investment', 'mutual fund', 'groww', 'zerodha', 'stocks', 'etf', 'sip', 'fd ', 'fixed deposit', 'recurring deposit'].some(k => desc.includes(k))) return 'Investment';
    if (['refund', 'cashback', 'reversal'].some(k => desc.includes(k))) return 'Refund';

    return 'Uncategorized';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'description' || name === 'type') {
        if (!hasManuallySelected) {
          const guessed = guessCategory(updated.description, updated.type);
          if (guessed !== 'Uncategorized') {
            updated.category = guessed;
            setIsAutoSuggested(true);
          } else {
            updated.category = 'Uncategorized';
            setIsAutoSuggested(false);
          }
        }
      }
      
      if (name === 'category') {
        setHasManuallySelected(true);
        setIsAutoSuggested(false);
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.description.trim()) {
      setError('Description is required.');
      return;
    }
    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/transactions/', {
        date: formData.date,
        amount: parsedAmount,
        type: formData.type,
        category: formData.category,
        description: formData.description.trim()
      });

      // Reset Form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'expense',
        category: 'Uncategorized',
        description: ''
      });
      setHasManuallySelected(false);
      setIsAutoSuggested(false);

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Add manual transaction error:", err);
      const detail = err.response?.data?.detail || 'Failed to add transaction. Try again.';
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-xl shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-6">Add Manual Transaction</h3>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-5 flex items-start gap-2.5 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Description / Payee
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Local Tea Shop, HDFC Salary"
              className="w-full bg-slate-850 border border-slate-750 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-finpilot-primary"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full bg-slate-850 border border-slate-750 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-finpilot-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-slate-850 border border-slate-750 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-finpilot-primary cursor-pointer"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex justify-between items-center">
                <span>Category</span>
                {isAutoSuggested && (
                  <span className="text-[10px] text-finpilot-primary font-bold animate-pulse lowercase">
                    ✨ auto-suggested
                  </span>
                )}
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-slate-850 border border-slate-750 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-finpilot-primary cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full bg-slate-850 border border-slate-750 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-finpilot-primary"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 mt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg text-white font-medium bg-finpilot-primary hover:bg-finpilot-primary-hover disabled:opacity-50 transition-colors text-sm"
            >
              {isSubmitting ? 'Saving...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
