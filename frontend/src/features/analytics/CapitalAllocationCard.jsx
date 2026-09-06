import React, { useState, useEffect } from 'react';
import { Activity, Zap, TrendingUp, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';
import api from '../../core/api';

export const CapitalAllocationCard = ({ refreshTrigger }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [refreshTrigger]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/spending');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching spending analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="rounded-[22px] bg-[#161617] border border-white/[0.08] p-6 md:p-8 space-y-4 animate-pulse">
        <div className="h-4 w-48 bg-white/[0.08] rounded-full"></div>
        <div className="h-3 w-full bg-white/[0.08] rounded-full"></div>
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="h-12 bg-white/[0.06] rounded-[14px]"></div>
          <div className="h-12 bg-white/[0.06] rounded-[14px]"></div>
          <div className="h-12 bg-white/[0.06] rounded-[14px]"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { allocation, velocity, top_categories } = data;
  const needsPct = allocation.needs_percent || 0;
  const wantsPct = allocation.wants_percent || 0;
  const savingsPct = allocation.savings_percent || 0;

  const isRapid = velocity.velocity_status === 'rapid_burn';
  const isElevated = velocity.velocity_status === 'elevated';

  return (
    <div className="rounded-[22px] bg-[#161617] border border-white/[0.08] p-6 md:p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      
      {/* Header with Title & Velocity Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
            <Activity className="h-3.5 w-3.5 text-[#2997ff]" />
            <span>Macro Allocation & Burn Pace</span>
          </div>
          <h3 className="text-lg font-semibold text-white tracking-[-0.02em] mt-0.5">
            50/30/20 Capital Velocity
          </h3>
        </div>

        {/* Daily Velocity Pill */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-normal border transition-all ${
          isRapid
            ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
            : isElevated
            ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
        }`}>
          <Zap className="h-3 w-3" />
          <span>
            <strong>₹{parseFloat(velocity.current_daily_pace).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/day</strong> pace • {
              isRapid ? 'Rapid Burn' : isElevated ? 'Elevated' : 'On Target'
            }
          </span>
        </div>
      </div>

      {/* Apple Card Segmented Horizontal Bar */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full flex overflow-hidden bg-white/[0.06] p-0.5 gap-1">
          <div
            style={{ width: `${Math.max(needsPct, 3)}%` }}
            className="h-full bg-[#0066cc] rounded-full transition-all duration-700 hover:brightness-125"
            title={`Needs: ₹${parseFloat(allocation.needs_amount).toLocaleString('en-IN')} (${needsPct}%)`}
          />
          <div
            style={{ width: `${Math.max(wantsPct, 3)}%` }}
            className="h-full bg-[#af52de] rounded-full transition-all duration-700 hover:brightness-125"
            title={`Wants: ₹${parseFloat(allocation.wants_amount).toLocaleString('en-IN')} (${wantsPct}%)`}
          />
          <div
            style={{ width: `${Math.max(savingsPct, 3)}%` }}
            className="h-full bg-[#30d158] rounded-full transition-all duration-700 hover:brightness-125"
            title={`Savings: ₹${parseFloat(allocation.savings_amount).toLocaleString('en-IN')} (${savingsPct}%)`}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#86868b] font-normal px-0.5">
          <span>Month-to-date Pool: ₹{parseFloat(allocation.total_pool).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          <span>Day {velocity.days_passed} of {velocity.days_passed + velocity.days_remaining} ({velocity.days_remaining}d left)</span>
        </div>
      </div>

      {/* 3-Column Legend Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Needs Card */}
        <div className="rounded-[16px] bg-[#1d1d1f] border border-white/[0.06] p-4 space-y-1.5 hover:border-[#0066cc]/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#0066cc]"></span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white">Needs</span>
            </div>
            <span className="text-[10px] text-[#86868b]">Target 50%</span>
          </div>
          <div className="text-base font-semibold tracking-[-0.02em] text-white">
            {needsPct}%
          </div>
          <span className="text-[11px] text-[#86868b] block">
            ₹{parseFloat(allocation.needs_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })} (Rent & Essentials)
          </span>
        </div>

        {/* Wants Card */}
        <div className="rounded-[16px] bg-[#1d1d1f] border border-white/[0.06] p-4 space-y-1.5 hover:border-[#af52de]/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#af52de]"></span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white">Wants</span>
            </div>
            <span className="text-[10px] text-[#86868b]">Target 30%</span>
          </div>
          <div className="text-base font-semibold tracking-[-0.02em] text-white">
            {wantsPct}%
          </div>
          <span className="text-[11px] text-[#86868b] block">
            ₹{parseFloat(allocation.wants_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })} (Discretionary)
          </span>
        </div>

        {/* Savings Card */}
        <div className="rounded-[16px] bg-[#1d1d1f] border border-white/[0.06] p-4 space-y-1.5 hover:border-[#30d158]/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#30d158]"></span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white">Savings</span>
            </div>
            <span className="text-[10px] text-[#86868b]">Target 20%</span>
          </div>
          <div className="text-base font-semibold tracking-[-0.02em] text-white">
            {savingsPct}%
          </div>
          <span className="text-[11px] text-[#86868b] block">
            ₹{parseFloat(allocation.savings_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })} (Vault Reserves)
          </span>
        </div>

      </div>

      {/* Velocity Footer & Top Categories */}
      <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#a1a1a6]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2997ff]"></span>
          <span>{velocity.velocity_message}</span>
        </div>

        {top_categories && top_categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-[#86868b]">Top Outflows:</span>
            {top_categories.slice(0, 3).map((cat) => (
              <span
                key={cat.category}
                className="text-[11px] bg-white/[0.06] text-white px-2 py-0.5 rounded-full"
              >
                {cat.category} ({cat.percentage}%)
              </span>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
