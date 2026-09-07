import React, { useState, useEffect } from 'react';
import api from '../../core/api';
import { Landmark, TrendingUp, CreditCard, ShieldAlert, ArrowUpRight, ArrowDownRight, ChevronRight, Wallet } from 'lucide-react';

export const NetWorthCard = ({ refreshTrigger, onOpenManager }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNetWorthSummary();
  }, [refreshTrigger]);

  const fetchNetWorthSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounts/summary');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch net worth summary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="rounded-[22px] bg-[#161617] border border-white/[0.08] p-6 animate-pulse space-y-4">
        <div className="h-4 w-32 bg-white/10 rounded-md"></div>
        <div className="h-10 w-48 bg-white/10 rounded-md"></div>
        <div className="h-16 w-full bg-white/5 rounded-xl"></div>
      </div>
    );
  }

  const netWorth = parseFloat(data?.net_worth || 0);
  const totalAssets = parseFloat(data?.total_assets || 0);
  const totalLiabilities = parseFloat(data?.total_liabilities || 0);
  const liquidCash = parseFloat(data?.liquid_cash || 0);
  const investments = parseFloat(data?.investments || 0);
  const creditDues = parseFloat(data?.credit_dues || 0);
  const loans = parseFloat(data?.loans || 0);
  const creditUtil = parseFloat(data?.credit_utilization || 0);
  const creditStatus = data?.credit_utilization_status || 'healthy';
  const totalCreditLimit = parseFloat(data?.total_credit_limit || 0);

  const getStatusColor = (status) => {
    if (status === 'healthy') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (status === 'moderate') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  const getStatusLabel = (status) => {
    if (status === 'healthy') return 'Optimal (<30%)';
    if (status === 'moderate') return 'Moderate (30-50%)';
    return 'High Risk (>50%)';
  };

  return (
    <div className="rounded-[22px] bg-[#161617] border border-white/[0.08] p-6 md:p-8 space-y-6 shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all">
      
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-[#2997ff]/10 border border-[#2997ff]/20 flex items-center justify-center text-[#2997ff]">
            <Landmark className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-[-0.02em] text-white">Consolidated Net Worth</h2>
            <p className="text-[11px] text-[#86868b]">Real-time balance across {data?.accounts?.length || 1} connected accounts</p>
          </div>
        </div>

        <button
          onClick={onOpenManager}
          className="apple-press text-xs text-[#2997ff] hover:text-[#52a9ff] font-medium flex items-center gap-1 transition-colors px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]"
        >
          <span>Manage Accounts</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Main Net Worth Hero & Assets vs Liabilities Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left: Net Worth Big Metric */}
        <div className="lg:col-span-5 space-y-1.5 border-b lg:border-b-0 lg:border-r border-white/[0.06] pb-4 lg:pb-0 lg:pr-6">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">Total Net Worth</span>
          <div className="text-3xl sm:text-4xl font-semibold tracking-[-0.035em] text-white font-sans">
            ₹{netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-[11px] text-[#30d158]">
              <ArrowUpRight className="h-3 w-3" />
              <span>₹{totalAssets.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Assets</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#ff453a]">
              <ArrowDownRight className="h-3 w-3" />
              <span>₹{totalLiabilities.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Debt</span>
            </span>
          </div>
        </div>

        {/* Right: 4-Pillar Portfolio Distribution */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Liquid Cash */}
          <div className="rounded-[14px] bg-[#1d1d1f] border border-white/[0.06] p-3 space-y-1">
            <div className="flex items-center justify-between text-[#86868b]">
              <span className="text-[10px] uppercase font-semibold">Liquid Cash</span>
              <Wallet className="h-3 w-3 text-[#2997ff]" />
            </div>
            <div className="text-sm font-semibold tracking-[-0.02em] text-white">
              ₹{liquidCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[9px] text-[#86868b] block">Bank & Savings</span>
          </div>

          {/* Investments */}
          <div className="rounded-[14px] bg-[#1d1d1f] border border-white/[0.06] p-3 space-y-1">
            <div className="flex items-center justify-between text-[#86868b]">
              <span className="text-[10px] uppercase font-semibold">Investments</span>
              <TrendingUp className="h-3 w-3 text-[#30d158]" />
            </div>
            <div className="text-sm font-semibold tracking-[-0.02em] text-white">
              ₹{investments.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[9px] text-[#86868b] block">Equities, MF, FDs</span>
          </div>

          {/* Credit Card Dues */}
          <div className="rounded-[14px] bg-[#1d1d1f] border border-white/[0.06] p-3 space-y-1">
            <div className="flex items-center justify-between text-[#86868b]">
              <span className="text-[10px] uppercase font-semibold">Credit Dues</span>
              <CreditCard className="h-3 w-3 text-[#ff9f0a]" />
            </div>
            <div className="text-sm font-semibold tracking-[-0.02em] text-white">
              ₹{creditDues.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[9px] text-[#86868b] block">Revolving Dues</span>
          </div>

          {/* Loans */}
          <div className="rounded-[14px] bg-[#1d1d1f] border border-white/[0.06] p-3 space-y-1">
            <div className="flex items-center justify-between text-[#86868b]">
              <span className="text-[10px] uppercase font-semibold">Term Loans</span>
              <ShieldAlert className="h-3 w-3 text-[#ff453a]" />
            </div>
            <div className="text-sm font-semibold tracking-[-0.02em] text-white">
              ₹{loans.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[9px] text-[#86868b] block">Principal Due</span>
          </div>

        </div>
      </div>

      {/* Credit Card Utilization Bar */}
      {totalCreditLimit > 0 && (
        <div className="pt-2 border-t border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#86868b] font-normal">Credit Card Utilization:</span>
              <span className="text-xs font-semibold text-white">{creditUtil}%</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(creditStatus)}`}>
                {getStatusLabel(creditStatus)}
              </span>
            </div>
            <span className="text-[11px] text-[#86868b]">
              ₹{creditDues.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / ₹{totalCreditLimit.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Limit
            </span>
          </div>

          {/* Apple Progress Bar */}
          <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                creditStatus === 'healthy'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                  : creditStatus === 'moderate'
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                  : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
              }`}
              style={{ width: `${Math.min(creditUtil, 100)}%` }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
