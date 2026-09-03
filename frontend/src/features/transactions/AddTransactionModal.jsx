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
          const guessed = guessCategory(
            name === 'description' ? value : prev.description,
            name === 'type' ? value : prev.type
          );
          if (guessed !== 'Uncategorized') {
            updated.category = guessed;
            setIsAutoSuggested(true);
          } else {
            setIsAutoSuggested(false);
          }
        }
      } else if (name === 'category') {
        setHasManuallySelected(true);
        setIsAutoSuggested(false);
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.date) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/transactions/manual', {
        date: formData.date,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        description: formData.description
      });
      
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
      <div className="bg-[#161617] border border-white/[0.1] w-full max-w-md p-6 md:p-8 rounded-[22px] shadow-[0_30px_70px_rgba(0,0,0,0.8)] relative">
        <button
          onClick={onClose}
          className="apple-press absolute top-5 right-5 h-7 w-7 rounded-full text-[#86868b] hover:text-white flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-lg font-semibold text-white tracking-[-0.02em] mb-6">Log Transaction</h3>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-[12px] mb-5 flex items-start gap-2 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
              Payee / Description
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Local Tea Shop, HDFC Salary"
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-[12px] px-3.5 py-2.5 text-xs text-white placeholder-[#86868b] focus:outline-none focus:border-[#0066cc]"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-[12px] px-3.5 py-2.5 text-xs text-white placeholder-[#86868b] focus:outline-none focus:border-[#0066cc]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Type */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-[12px] px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#0066cc] cursor-pointer"
              >
                <option value="expense" className="bg-[#1d1d1f]">Expense</option>
                <option value="income" className="bg-[#1d1d1f]">Income</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5 flex justify-between items-center">
                <span>Category</span>
                {isAutoSuggested && (
                  <span className="text-[10px] text-[#2997ff] font-normal lowercase">
                    auto-detected
                  </span>
                )}
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-[12px] px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#0066cc] cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-[#1d1d1f]">{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-[12px] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#0066cc]"
              required
            />
          </div>

          {/* Actions */}
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
              disabled={isSubmitting}
              className="apple-press px-5 py-2 rounded-full text-white font-medium bg-[#0066cc] hover:bg-[#0071e3] disabled:opacity-40 transition-colors text-xs"
            >
              {isSubmitting ? 'Saving...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
