import React, { useState, useEffect } from 'react';
import api from '../../core/api';
import { UploadModal } from '../transactions/UploadModal';
import { TransactionList } from '../transactions/TransactionList';
import { useAuth } from '../auth/AuthContext';
import { Wallet, ShieldCheck, Lock, Edit3, Plus, LogOut } from 'lucide-react';

export const DashboardView = () => {
  const { logout } = useAuth();
  const [summary, setSummary] = useState({
    total_balance: 0,
    active_goals_locked: 0,
    upcoming_fixed_expenses: 0,
    safe_to_spend: 0,
  });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [openingBalance, setOpeningBalance] = useState('');
  const [showBalanceForm, setShowBalanceForm] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [refreshTrigger]);

  const fetchSummary = async () => {
    try {
      const response = await api.get('/dashboard/summary');
      setSummary(response.data);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    }
  };

  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    if (!openingBalance || isNaN(openingBalance)) return;

    try {
      await api.post('/dashboard/opening-balance', { amount: parseFloat(openingBalance) });
      setOpeningBalance('');
      setShowBalanceForm(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error setting opening balance:', err);
    }
  };

  return (
    <div className="min-h-screen bg-finpilot-dark text-finpilot-text p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">FinPilot AI</h1>
            <p className="text-finpilot-muted text-sm mt-1">Intelligent financial companion & analytics</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="bg-finpilot-primary hover:bg-finpilot-primary-hover text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Upload CSV</span>
            </button>
            <button
              onClick={logout}
              className="bg-slate-800 hover:bg-slate-700 text-finpilot-muted hover:text-white p-2.5 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Metrics Section (Premium Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Safe To Spend */}
          <div className="bg-gradient-to-br from-blue-900/60 to-slate-900/90 border border-blue-500/30 p-6 rounded-xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-finpilot-muted font-bold text-xs uppercase tracking-wider">Safe To Spend</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-white relative z-10">
              ₹{parseFloat(summary.safe_to_spend).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-finpilot-muted mt-2 relative z-10">Available balance safe for daily expenses</p>
          </div>

          {/* Card 2: Total Balance */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/80 p-6 rounded-xl shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-finpilot-muted font-bold text-xs uppercase tracking-wider">Total Balance</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBalanceForm(!showBalanceForm)}
                  className="p-1 text-finpilot-muted hover:text-white transition-colors"
                  title="Update Starting Balance"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <div className="p-2 rounded-lg bg-slate-800 text-finpilot-muted">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
            </div>
            
            {showBalanceForm ? (
              <form onSubmit={handleUpdateBalance} className="flex gap-2 relative z-10">
                <input
                  type="number"
                  placeholder="Starting balance..."
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="bg-slate-800 border border-slate-750 text-white text-sm rounded px-3 py-1 w-full focus:outline-none focus:ring-1 focus:ring-finpilot-primary"
                  required
                />
                <button
                  type="submit"
                  className="bg-finpilot-primary text-white text-xs font-bold px-3 py-1 rounded hover:bg-finpilot-primary-hover transition-colors"
                >
                  Set
                </button>
              </form>
            ) : (
              <h2 className="text-3xl font-black text-white">
                ₹{parseFloat(summary.total_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h2>
            )}
            <p className="text-xs text-finpilot-muted mt-2">Combined bank balance + statement deposits</p>
          </div>

          {/* Card 3: Goals Locked */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/80 p-6 rounded-xl shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-finpilot-muted font-bold text-xs uppercase tracking-wider">Goals Locked</span>
              <div className="p-2 rounded-lg bg-slate-800 text-finpilot-muted">
                <Lock className="h-5 w-5" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-white">
              ₹{parseFloat(summary.active_goals_locked).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-finpilot-muted mt-2">Savings goals target currently reserved</p>
          </div>

        </div>

        {/* Main Workspace Layout (Transaction Table) */}
        <TransactionList refreshTrigger={refreshTrigger} />

        {/* Upload Statement Modal */}
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={() => setRefreshTrigger(prev => prev + 1)}
        />

      </div>
    </div>
  );
};
