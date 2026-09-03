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
    <div className="rounded-[18px] bg-[#161617] border border-white/[0.08] overflow-hidden">
      {/* Header */}
      <div className="p-5 md:p-6 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white tracking-[-0.02em]">Transaction Ledger</h3>
          <p className="text-xs text-[#86868b] font-normal mt-0.5">Ingested statements & manual logs</p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="apple-press bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs px-3.5 py-1.5 rounded-full focus:outline-none focus:border-[#0066cc] cursor-pointer transition-colors"
          >
            <option value="" className="bg-[#1d1d1f]">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat} className="bg-[#1d1d1f]">{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b border-white/[0.06]">
              <th className="px-6 py-3.5">Description</th>
              <th className="px-6 py-3.5">Date</th>
              <th className="px-6 py-3.5">Category</th>
              <th className="px-6 py-3.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-[#0066cc] mx-auto"></div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-14 text-xs text-[#86868b]">
                  No transaction records found. Upload a statement to begin.
                </td>
              </tr>
            ) : (
              transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors text-xs">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.06] text-neutral-400'}`}>
                        {tx.type === 'income' ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                      </div>
                      <span className="font-normal text-[#f5f5f7] max-w-xs truncate" title={tx.description}>
                        {tx.description}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#86868b] whitespace-nowrap">
                    {tx.date}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={tx.category}
                      onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                      className="bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.06] text-[#f5f5f7] text-[11px] px-2.5 py-1 rounded-full focus:outline-none focus:border-[#0066cc] cursor-pointer transition-colors"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-[#1d1d1f]">{cat}</option>
                      ))}
                    </select>
                  </td>
                  <td className={`px-6 py-4 text-right font-medium whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                    {tx.type === 'income' ? '+' : '-'} ₹{parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-white/[0.08] flex items-center justify-between gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="apple-press h-8 w-8 rounded-full border border-white/[0.08] bg-white/[0.04] text-[#86868b] hover:text-white flex items-center justify-center transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[11px] text-[#86868b]">
            Page <span className="text-white font-medium">{page}</span> of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="apple-press h-8 w-8 rounded-full border border-white/[0.08] bg-white/[0.04] text-[#86868b] hover:text-white flex items-center justify-center transition-colors disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
