import React, { useState, useEffect, useCallback } from 'react';
import api from '../../core/api';
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight } from 'lucide-react';

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

export const TransactionList = ({ refreshTrigger }) => {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const categoryParam = filterCategory ? `&category=${encodeURIComponent(filterCategory)}` : '';
      const response = await api.get(`/transactions?page=${page}&limit=10${categoryParam}`);
      setTransactions(response.data.data);
      setTotalPages(response.data.total_pages);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filterCategory]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshTrigger]);

  const handleCategoryChange = async (id, newCategory) => {
    try {
      await api.put(`/transactions/${id}`, { category: newCategory });
      setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, category: newCategory } : tx));
    } catch (err) {
      console.error('Error updating transaction category:', err);
    }
  };

  return (
    <div className="bg-finpilot-card rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-white">Transaction History</h3>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-finpilot-muted">Filter by Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-finpilot-primary"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/40 text-xs font-bold text-finpilot-muted uppercase border-b border-slate-700">
              <th className="px-6 py-4">Transaction</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-finpilot-primary mx-auto"></div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-12 text-sm text-finpilot-muted">
                  No transactions imported yet. Click "Upload CSV" above to get started.
                </td>
              </tr>
            ) : (
              transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-800/20 transition-colors text-sm">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {tx.type === 'income' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </div>
                      <span className="font-semibold text-white max-w-xs truncate" title={tx.description}>
                        {tx.description}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-finpilot-muted font-medium whitespace-nowrap">
                    {tx.date}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={tx.category}
                      onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                      className="bg-slate-800/60 border border-slate-700/60 text-white text-xs px-2.5 py-1 rounded focus:outline-none focus:ring-1 focus:ring-finpilot-primary cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                    {tx.type === 'income' ? '+' : '-'} ₹{parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-700 flex items-center justify-between gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 border border-slate-700 text-finpilot-muted rounded-lg hover:text-white transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs text-finpilot-muted">
            Page <span className="text-white font-bold">{page}</span> of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 border border-slate-700 text-finpilot-muted rounded-lg hover:text-white transition-colors disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};
