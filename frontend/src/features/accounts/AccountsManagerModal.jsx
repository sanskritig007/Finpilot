import React, { useState, useEffect } from 'react';
import api from '../../core/api';
import { 
  X, Plus, CreditCard, Landmark, TrendingUp, ShieldAlert, 
  Check, Trash2, Edit3, Sparkles, AlertCircle, Building2, 
  Wallet, Layers, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking / Salary Account', category: 'bank', icon: Landmark },
  { value: 'savings', label: 'Savings Account', category: 'bank', icon: Landmark },
  { value: 'cash', label: 'Cash / Physical Wallet', category: 'bank', icon: Wallet },
  { value: 'investment', label: 'Stocks & Demat Portfolio', category: 'investment', icon: TrendingUp },
  { value: 'mutual_fund', label: 'Mutual Funds / SIP', category: 'investment', icon: TrendingUp },
  { value: 'crypto', label: 'Crypto & Web3 Assets', category: 'investment', icon: TrendingUp },
  { value: 'fixed_deposit', label: 'Fixed Deposit / PF', category: 'investment', icon: TrendingUp },
  { value: 'credit_card', label: 'Credit Card', category: 'credit', icon: CreditCard },
  { value: 'loan', label: 'Personal / Home / Car Loan', category: 'credit', icon: ShieldAlert },
];

const INSTITUTIONS = [
  'HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 
  'Kotak Mahindra', 'Zerodha', 'Groww', 'Upstox', 'Indmoney', 
  'Amex', 'OneCard', 'Cred', 'Other'
];

export const AccountsManagerModal = ({ isOpen, onClose, onUpdate }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    institution: 'HDFC Bank',
    account_type: 'checking',
    current_balance: '',
    credit_limit: '',
    is_primary: false,
  });

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingAccountId(null);
    setFormData({
      name: '',
      institution: 'HDFC Bank',
      account_type: 'checking',
      current_balance: '',
      credit_limit: '',
      is_primary: false,
    });
    setShowAddForm(true);
  };

  const handleOpenEdit = (acc) => {
    setEditingAccountId(acc.id);
    setFormData({
      name: acc.name,
      institution: acc.institution || 'Bank',
      account_type: acc.account_type,
      current_balance: acc.current_balance,
      credit_limit: acc.credit_limit || '',
      is_primary: acc.is_primary || false,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/accounts/${id}`);
      fetchAccounts();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert('Could not delete account.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      name: formData.name.trim(),
      institution: formData.institution,
      account_type: formData.account_type,
      current_balance: parseFloat(formData.current_balance) || 0.0,
      credit_limit: formData.account_type === 'credit_card' ? (parseFloat(formData.credit_limit) || null) : null,
      is_primary: formData.is_primary,
    };

    try {
      if (editingAccountId) {
        await api.put(`/accounts/${editingAccountId}`, payload);
      } else {
        await api.post('/accounts', payload);
      }
      setShowAddForm(false);
      setEditingAccountId(null);
      fetchAccounts();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error saving account:', err);
      setError('Could not save account details. Please check the inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredAccounts = accounts.filter(acc => {
    if (filterTab === 'all') return true;
    const type = (acc.account_type || '').toLowerCase();
    if (filterTab === 'bank') return ['checking', 'savings', 'cash'].includes(type);
    if (filterTab === 'investment') return ['investment', 'demat', 'mutual_fund', 'crypto', 'fixed_deposit', 'pf'].includes(type);
    if (filterTab === 'credit') return ['credit_card', 'loan', 'mortgage', 'emi', 'personal_loan', 'home_loan'].includes(type);
    return true;
  });

  const isCreditType = formData.account_type === 'credit_card';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl rounded-[24px] bg-[#161617] border border-white/[0.1] shadow-[0_32px_80px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Apple Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#1d1d1f]/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-[#0066cc]/10 border border-[#0066cc]/20 flex items-center justify-center text-[#2997ff]">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-[-0.02em] text-white">Accounts & Portfolio Aggregator</h2>
              <p className="text-[11px] text-[#86868b]">Manage all checking, investment, credit card, and loan ledgers</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!showAddForm && (
              <button
                onClick={handleOpenAdd}
                className="apple-press bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-normal px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Account</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="apple-press p-2 rounded-full text-[#86868b] hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add / Edit Form Chassis */}
          {showAddForm && (
            <div className="rounded-[18px] bg-[#1d1d1f] border border-white/[0.12] p-5 space-y-4 animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  {editingAccountId ? 'Edit Account' : 'Connect New Account'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-[#86868b] hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Account Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-[#86868b]">Account Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC Salary, Zerodha Kite"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>

                  {/* Institution */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-[#86868b]">Financial Institution</label>
                    <select
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0066cc]"
                    >
                      {INSTITUTIONS.map((inst) => (
                        <option key={inst} value={inst} className="bg-[#1d1d1f] text-white">{inst}</option>
                      ))}
                    </select>
                  </div>

                  {/* Account Type */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-[#86868b]">Account Type</label>
                    <select
                      value={formData.account_type}
                      onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0066cc]"
                    >
                      {ACCOUNT_TYPES.map((t) => (
                        <option key={t.value} value={t.value} className="bg-[#1d1d1f] text-white">
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Current Balance / Outstanding */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-[#86868b]">
                      {isCreditType || formData.account_type === 'loan' ? 'Current Outstanding Debt (₹)' : 'Current Asset Balance (₹)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.current_balance}
                      onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>

                  {/* Credit Limit if Credit Card */}
                  {isCreditType && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-[#86868b]">Total Credit Limit (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="e.g. 150000"
                        value={formData.credit_limit}
                        onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                        className="w-full bg-black/40 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#0066cc]"
                      />
                    </div>
                  )}

                  {/* Primary Toggle */}
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="is_primary"
                      checked={formData.is_primary}
                      onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                      className="rounded bg-black/40 border-white/20 text-[#0066cc] focus:ring-0"
                    />
                    <label htmlFor="is_primary" className="text-xs text-[#86868b] select-none cursor-pointer">
                      Set as Primary Default Account
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="apple-press bg-white/[0.06] hover:bg-white/[0.1] text-[#86868b] hover:text-white text-xs px-3.5 py-1.5 rounded-full transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="apple-press bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : (editingAccountId ? 'Update Account' : 'Add Account')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            {[
              { id: 'all', label: 'All Accounts' },
              { id: 'bank', label: 'Bank & Cash' },
              { id: 'investment', label: 'Investments' },
              { id: 'credit', label: 'Credit & Loans' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`apple-press text-xs font-normal px-3 py-1 rounded-full transition-all ${
                  filterTab === tab.id
                    ? 'bg-white text-black font-medium'
                    : 'text-[#86868b] hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Account Cards Grid */}
          {loading ? (
            <div className="py-12 text-center text-xs text-[#86868b] animate-pulse">
              Syncing accounts...
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Wallet className="h-8 w-8 text-[#86868b]/40 mx-auto" />
              <p className="text-xs text-[#86868b]">No accounts found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAccounts.map((acc) => {
                const isLiability = ['credit_card', 'loan', 'mortgage', 'emi'].includes((acc.account_type || '').toLowerCase());
                const isCreditCard = (acc.account_type || '').toLowerCase() === 'credit_card';
                const balanceVal = parseFloat(acc.current_balance || 0);
                const limitVal = parseFloat(acc.credit_limit || 0);
                const cardUtil = isCreditCard && limitVal > 0 ? Math.round((balanceVal / limitVal) * 100) : 0;

                return (
                  <div
                    key={acc.id}
                    className="rounded-[20px] bg-[#1d1d1f] border border-white/[0.08] p-5 space-y-4 hover:border-white/[0.18] transition-all relative group"
                  >
                    
                    {/* Top Row: Institution & Type Tag */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                          {isCreditCard ? (
                            <CreditCard className="h-4 w-4 text-[#ff9f0a]" />
                          ) : isLiability ? (
                            <ShieldAlert className="h-4 w-4 text-[#ff453a]" />
                          ) : (acc.account_type === 'investment' || acc.account_type === 'mutual_fund') ? (
                            <TrendingUp className="h-4 w-4 text-[#30d158]" />
                          ) : (
                            <Landmark className="h-4 w-4 text-[#2997ff]" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold tracking-[-0.02em] text-white">{acc.name}</h3>
                          <span className="text-[11px] text-[#86868b]">{acc.institution || 'Bank'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {acc.is_primary && (
                          <span className="text-[9px] font-semibold bg-[#2997ff]/10 border border-[#2997ff]/20 text-[#2997ff] px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Primary
                          </span>
                        )}
                        <span className="text-[9px] font-semibold bg-white/[0.06] text-[#86868b] px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {acc.account_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Balance & Debt Details */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-[#86868b] tracking-wider">
                        {isLiability ? 'Outstanding Due' : 'Available Balance'}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-semibold tracking-[-0.03em] ${isLiability ? 'text-[#ff453a]' : 'text-white'}`}>
                          ₹{balanceVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        {isLiability ? (
                          <span className="text-[11px] text-[#ff453a]/80">Debt</span>
                        ) : (
                          <span className="text-[11px] text-[#30d158]">Asset</span>
                        )}
                      </div>
                    </div>

                    {/* Credit Card Utilization Bar if applicable */}
                    {isCreditCard && limitVal > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
                        <div className="flex justify-between text-[11px] text-[#86868b]">
                          <span>Utilization: <strong className="text-white">{cardUtil}%</strong></span>
                          <span>Limit: ₹{limitVal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              cardUtil <= 30 ? 'bg-emerald-400' : cardUtil <= 50 ? 'bg-amber-400' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(cardUtil, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                      <button
                        onClick={() => handleOpenEdit(acc)}
                        className="apple-press p-1.5 rounded-lg text-[#86868b] hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="Edit Account"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(acc.id, acc.name)}
                        className="apple-press p-1.5 rounded-lg text-[#86868b] hover:text-[#ff453a] hover:bg-white/[0.06] transition-colors"
                        title="Delete Account"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
