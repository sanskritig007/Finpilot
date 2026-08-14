import React, { useState, useEffect } from 'react';
import api from '../../core/api';
import { UploadModal } from '../transactions/UploadModal';
import { TransactionList } from '../transactions/TransactionList';
import { useAuth } from '../auth/AuthContext';
import { ChatWidget } from '../chat/ChatWidget';
import { Wallet, ShieldCheck, Lock, Edit3, Plus, LogOut, Settings, AlertTriangle } from 'lucide-react';
import { GoalsList } from '../goals/GoalsList';
import { SettingsModal } from './SettingsModal';
import { AddTransactionModal } from '../transactions/AddTransactionModal';

export const DashboardView = () => {
  const { logout } = useAuth();
  const [summary, setSummary] = useState({
    total_balance: 0,
    active_goals_locked: 0,
    upcoming_fixed_expenses: 0,
    safe_to_spend: 0,
  });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [chatResetTrigger, setChatResetTrigger] = useState(0);
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
              onClick={() => setIsAddTransactionOpen(true)}
              className="bg-slate-800 hover:bg-slate-750 hover:text-white border border-slate-700 text-slate-200 font-semibold text-sm px-5 py-2.5 rounded-lg shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Transaction</span>
            </button>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="bg-finpilot-primary hover:bg-finpilot-primary-hover text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Upload CSV</span>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-finpilot-muted hover:text-white p-2.5 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
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

        {/* Sandbox Session Warning Banner */}
        {localStorage.getItem('finpilot_is_sandbox') === 'true' && (
          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-blue-400 text-sm font-semibold">
            <div className="flex items-center gap-3">
              <span className="shrink-0 h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span>💡 You are in Sandbox Mode. Test manual entries, edit categories, and chat with FinPilot! Any changes are temporary.</span>
            </div>
            <button
              onClick={logout}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20 shrink-0"
            >
              Create Account
            </button>
          </div>
        )}

        {/* Budget Warning Banners */}
        {(() => {
          const safeToSpendVal = parseFloat(summary.safe_to_spend) || 0;
          const totalBalanceVal = parseFloat(summary.total_balance) || 0;
          const isExceeded = safeToSpendVal <= 0;
          const isWarning = !isExceeded && totalBalanceVal > 0 && safeToSpendVal < (totalBalanceVal * 0.15);
          
          if (isExceeded) {
            return (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm font-semibold animate-pulse">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>Alert: You have exceeded your Safe to Spend budget! Consider postponing non-essential shopping or adjusting your savings goals.</span>
              </div>
            );
          }
          if (isWarning) {
            return (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center gap-3 text-amber-400 text-sm font-medium">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>Warning: Your Safe to Spend balance is running low (less than 15% of your total balance). Watch your spending!</span>
              </div>
            );
          }
          return null;
        })()}

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Safe To Spend */}
          {(() => {
            const safeToSpendVal = parseFloat(summary.safe_to_spend) || 0;
            const totalBalanceVal = parseFloat(summary.total_balance) || 0;
            const isExceeded = safeToSpendVal <= 0;
            const isWarning = !isExceeded && totalBalanceVal > 0 && safeToSpendVal < (totalBalanceVal * 0.15);
            
            let cardBg = "bg-gradient-to-br from-blue-900/60 to-slate-900/90 border border-blue-500/30";
            let glowBg = "bg-blue-500/10 group-hover:bg-blue-500/20";
            let iconWrapper = "bg-blue-500/10 text-blue-400";
            let descText = "Available balance safe for daily expenses";
            let descColor = "text-finpilot-muted";
            
            if (isExceeded) {
              cardBg = "bg-gradient-to-br from-red-950/40 to-slate-900/90 border border-red-500/40";
              glowBg = "bg-red-500/10 group-hover:bg-red-500/20";
              iconWrapper = "bg-red-500/15 text-red-400";
              descText = "🚨 Alert: Safe to Spend budget exceeded!";
              descColor = "text-red-400/90 font-medium";
            } else if (isWarning) {
              cardBg = "bg-gradient-to-br from-amber-950/40 to-slate-900/90 border border-amber-500/40";
              glowBg = "bg-amber-500/10 group-hover:bg-amber-500/20";
              iconWrapper = "bg-amber-500/15 text-amber-400";
              descText = "⚠️ Warning: Budget is running low (under 15%)";
              descColor = "text-amber-400/90 font-medium";
            }
            
            return (
              <div className={`${cardBg} p-6 rounded-xl shadow-2xl relative overflow-hidden group`}>
                <div className={`absolute top-0 right-0 w-32 h-32 ${glowBg} rounded-full blur-3xl transition-all`}></div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="text-finpilot-muted font-bold text-xs uppercase tracking-wider">Safe To Spend</span>
                  <div className={`p-2 rounded-lg ${iconWrapper}`}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
                <h2 className="text-3xl font-black text-white relative z-10">
                  ₹{parseFloat(summary.safe_to_spend).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h2>
                <p className={`text-xs ${descColor} mt-2 relative z-10`}>{descText}</p>
              </div>
            );
          })()}

          {/* Card 2: Total Balance */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/80 p-6 rounded-xl shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-finpilot-muted font-bold text-xs uppercase tracking-wider">Total Balance</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBalanceForm(!showBalanceForm)}
                  className="p-1 text-finpilot-muted hover:text-white transition-colors"
                  title="Update Current Balance"
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
                  placeholder="Current balance..."
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
            <p className="text-xs text-finpilot-muted mt-2">Monthly savings target required for active goals</p>
          </div>

        </div>

        {/* Main Workspace Layout (Transactions & Goals Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TransactionList refreshTrigger={refreshTrigger} />
          </div>
          <div className="lg:col-span-1">
            <GoalsList 
              refreshTrigger={refreshTrigger} 
              onUpdate={() => setRefreshTrigger(prev => prev + 1)} 
            />
          </div>
        </div>

        {/* Upload Statement Modal */}
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={() => setRefreshTrigger(prev => prev + 1)}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onResetChat={() => setChatResetTrigger(prev => prev + 1)}
        />

        {/* Add Manual Transaction Modal */}
        <AddTransactionModal
          isOpen={isAddTransactionOpen}
          onClose={() => setIsAddTransactionOpen(false)}
          onSuccess={() => setRefreshTrigger(prev => prev + 1)}
        />

        {/* Floating AI Chat Assistant */}
        <ChatWidget resetTrigger={chatResetTrigger} />

      </div>
    </div>
  );
};
