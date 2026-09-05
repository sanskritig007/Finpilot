import React, { useState, useEffect, useRef } from 'react';
import api from '../../core/api';
import { UploadModal } from '../transactions/UploadModal';
import { TransactionList } from '../transactions/TransactionList';
import { useAuth } from '../auth/AuthContext';
import { ChatWidget } from '../chat/ChatWidget';
import { ShieldCheck, Lock, Edit3, Plus, LogOut, Settings, AlertTriangle, Zap, Calendar } from 'lucide-react';
import { GoalsList } from '../goals/GoalsList';
import { CommitmentsList } from '../commitments/CommitmentsList';
import { SettingsModal } from './SettingsModal';
import { AddTransactionModal } from '../transactions/AddTransactionModal';
import { AICoachCard } from './AICoachCard';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { UpcomingBillBanner } from '../notifications/UpcomingBillBanner';

export const DashboardView = () => {
  const { logout } = useAuth();
  const commitmentsSectionRef = useRef(null);
  const [summary, setSummary] = useState({
    total_balance: 0,
    active_goals_locked: 0,
    upcoming_fixed_expenses: 0,
    safe_to_spend: 0,
    runway_months: 0,
    monthly_burn: 0,
    runway_status: 'healthy',
  });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [chatResetTrigger, setChatResetTrigger] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [openingBalance, setOpeningBalance] = useState('');
  const [showBalanceForm, setShowBalanceForm] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
    fetchInsights();
  }, [refreshTrigger]);

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const response = await api.get(`/dashboard/insights?nocache=${Date.now()}`);
      setInsights(response.data);
    } catch (err) {
      console.error('Error fetching AI insights:', err);
    } finally {
      setInsightsLoading(false);
    }
  };

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

  const scrollToCommitments = () => {
    if (commitmentsSectionRef.current) {
      commitmentsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const safeToSpendVal = parseFloat(summary.safe_to_spend) || 0;
  const totalBalanceVal = parseFloat(summary.total_balance) || 0;
  const goalsLockedVal = parseFloat(summary.active_goals_locked) || 0;
  const fixedExpensesVal = parseFloat(summary.upcoming_fixed_expenses) || 0;
  const runwayMonths = parseFloat(summary.runway_months) || 0;
  const runwayStatus = summary.runway_status || 'healthy';

  const isExceeded = safeToSpendVal < 0;
  const isWarning = !isExceeded && totalBalanceVal > 0 && safeToSpendVal < (totalBalanceVal * 0.15);

  return (
    <div className="min-h-screen bg-[#101012] text-[#f5f5f7] pb-16">
      
      {/* Apple Sub-Nav: Frosted Top Bar */}
      <header className="sticky top-0 z-40 apple-frosted border-b border-white/[0.08] px-6 md:px-10 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-semibold tracking-[-0.03em] text-white">FinPilot</span>
            <span className="hidden sm:inline-block text-xs text-[#86868b] font-normal">Intelligent Finance Studio</span>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAddTransactionOpen(true)}
              className="apple-press bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.08] text-xs font-normal px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all"
            >
              <Plus className="h-3.5 w-3.5 opacity-80" />
              <span>Log Entry</span>
            </button>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="apple-press bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-normal px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-none"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Upload CSV</span>
            </button>

            {/* Apple Notification Bell */}
            <NotificationCenter 
              refreshTrigger={refreshTrigger} 
              onUpdate={() => setRefreshTrigger(prev => prev + 1)} 
            />

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="apple-press h-8 w-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#86868b] hover:text-white border border-white/[0.06] flex items-center justify-center transition-colors"
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={logout}
              className="apple-press h-8 w-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#86868b] hover:text-white border border-white/[0.06] flex items-center justify-center transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 md:px-10 pt-8 space-y-8">
        
        {/* Urgent Bill Radar Floating Banner */}
        <UpcomingBillBanner 
          refreshTrigger={refreshTrigger}
          onScrollToCommitments={scrollToCommitments}
        />

        {/* Sandbox Session Warning Banner */}
        {localStorage.getItem('finpilot_is_sandbox') === 'true' && (
          <div className="bg-[#1d1d1f] border border-blue-500/20 p-4 rounded-[16px] flex flex-wrap items-center justify-between gap-4 text-xs font-normal text-blue-300">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#2997ff] animate-pulse"></span>
              <span><strong>Sandbox Mode:</strong> Testing session active. Data is ephemeral.</span>
            </div>
            <button
              onClick={logout}
              className="apple-press bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-normal px-3.5 py-1.5 rounded-full transition-all"
            >
              Create Account
            </button>
          </div>
        )}

        {/* Budget Warning Banner */}
        {isExceeded && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-[16px] flex items-center gap-3 text-red-300 text-xs font-normal">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span><strong>Safe to Spend Exceeded:</strong> Current burn rate exceeds your available cushion. Consider postponing non-essential purchases.</span>
          </div>
        )}
        {isWarning && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-[16px] flex items-center gap-3 text-amber-300 text-xs font-normal">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span><strong>Low Runway:</strong> Available safe-to-spend is below 15% of total liquidity.</span>
          </div>
        )}

        {/* Apple Hero Studio Tile ("Apple Card" Safe to Spend & Runway Showcase) */}
        <div className="relative rounded-[22px] bg-[#161617] border border-white/[0.08] p-8 md:p-10 overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Huge Hero Number & Runway Badge */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#2997ff]" />
                  <span>Safe To Spend</span>
                </div>
                
                {/* Runway Status Pill */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal tracking-normal lowercase ${
                  runwayStatus === 'healthy' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : runwayStatus === 'caution'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  <Zap className="h-2.5 w-2.5" />
                  <span>{runwayMonths >= 99 ? '∞' : runwayMonths} mo runway</span>
                </span>
              </div>
              
              <div className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.035em] text-white font-sans">
                ₹{safeToSpendVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              
              <p className="text-xs text-[#86868b] font-normal pt-1">
                Net discretionary allowance after deducting locked goals & upcoming fixed bills.
              </p>
            </div>

            {/* Right: Balance, Goals & Fixed Mini Utility Cards */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Total Balance Card */}
              <div className="rounded-[18px] bg-[#1d1d1f] border border-white/[0.08] p-4 space-y-2 relative group">
                <div className="flex items-center justify-between text-[#86868b]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Balance</span>
                  <button
                    onClick={() => setShowBalanceForm(!showBalanceForm)}
                    className="apple-press p-1 text-[#86868b] hover:text-white transition-colors"
                    title="Edit Opening Balance"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>

                {showBalanceForm ? (
                  <form onSubmit={handleUpdateBalance} className="space-y-2">
                    <input
                      type="number"
                      placeholder="Amount..."
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      className="bg-black/50 border border-white/[0.14] text-white text-xs rounded-lg px-2 py-1 w-full focus:outline-none focus:border-[#0066cc]"
                      required
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <button
                        type="submit"
                        className="apple-press bg-[#0066cc] text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBalanceForm(false)}
                        className="apple-press bg-white/[0.08] text-[#86868b] text-[10px] px-2 py-0.5 rounded-full"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="text-base font-semibold tracking-[-0.02em] text-white">
                      ₹{totalBalanceVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <span className="text-[10px] text-[#86868b] block mt-0.5">Liquid capital</span>
                  </div>
                )}
              </div>

              {/* Goals Locked Card */}
              <div className="rounded-[18px] bg-[#1d1d1f] border border-white/[0.08] p-4 space-y-2">
                <div className="flex items-center justify-between text-[#86868b]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Vaults</span>
                  <Lock className="h-3 w-3 text-[#86868b]" />
                </div>
                <div>
                  <div className="text-base font-semibold tracking-[-0.02em] text-white">
                    ₹{goalsLockedVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <span className="text-[10px] text-[#86868b] block mt-0.5">Goals locked</span>
                </div>
              </div>

              {/* Fixed Obligations Card */}
              <div className="rounded-[18px] bg-[#1d1d1f] border border-white/[0.08] p-4 space-y-2">
                <div className="flex items-center justify-between text-[#86868b]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Fixed Bills</span>
                  <Calendar className="h-3 w-3 text-[#86868b]" />
                </div>
                <div>
                  <div className="text-base font-semibold tracking-[-0.02em] text-white">
                    ₹{fixedExpensesVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <span className="text-[10px] text-[#86868b] block mt-0.5">Due this cycle</span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* AI Advisor Insights Editorial Tile */}
        <AICoachCard
          insights={insights}
          loading={insightsLoading}
          onRefresh={fetchInsights}
        />

        {/* Main Workspace Layout (Transactions & Commitments/Goals Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <TransactionList refreshTrigger={refreshTrigger} />
          </div>
          <div className="lg:col-span-5 space-y-8" ref={commitmentsSectionRef}>
            <CommitmentsList 
              refreshTrigger={refreshTrigger} 
              onUpdate={() => setRefreshTrigger(prev => prev + 1)} 
            />
            <GoalsList 
              refreshTrigger={refreshTrigger} 
              onUpdate={() => setRefreshTrigger(prev => prev + 1)} 
            />
          </div>
        </div>

        {/* Modals & Dialogs */}
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={() => setRefreshTrigger(prev => prev + 1)}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onResetChat={() => setChatResetTrigger(prev => prev + 1)}
        />

        <AddTransactionModal
          isOpen={isAddTransactionOpen}
          onClose={() => setIsAddTransactionOpen(false)}
          onSuccess={() => setRefreshTrigger(prev => prev + 1)}
        />

        {/* Floating AI Assistant */}
        <ChatWidget resetTrigger={chatResetTrigger} />

      </main>
    </div>
  );
};
