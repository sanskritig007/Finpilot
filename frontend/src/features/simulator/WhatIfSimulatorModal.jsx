import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShieldCheck, AlertTriangle, AlertCircle, ArrowRight, Zap, CheckCircle2, Sliders } from 'lucide-react';
import api from '../../core/api';

export const WhatIfSimulatorModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('New Purchase');
  const [amount, setAmount] = useState(25000);
  const [paymentMode, setPaymentMode] = useState('upfront');
  const [emiMonths, setEmiMonths] = useState(6);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Preset chips
  const presets = [
    { label: '₹5k', value: 5000 },
    { label: '₹15k', value: 15000 },
    { label: '₹40k', value: 40000 },
    { label: '₹75k', value: 75000 },
    { label: '₹1.5L', value: 150000 },
  ];

  useEffect(() => {
    if (isOpen && amount > 0) {
      runSimulation();
    }
  }, [isOpen, amount, paymentMode, emiMonths]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.post('/simulator/simulate', {
        name: name.trim() || 'Planned Purchase',
        amount: parseFloat(amount) || 1000,
        payment_mode: paymentMode,
        emi_months: parseInt(emiMonths, 10) || 3,
      });
      setResult(res.data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4 py-6 overflow-y-auto">
      <div className="bg-[#161617] border border-white/[0.1] w-full max-w-2xl p-6 md:p-8 rounded-[22px] shadow-[0_30px_80px_rgba(0,0,0,0.85)] relative space-y-6 my-auto max-h-[90vh] overflow-y-auto">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="apple-press absolute top-5 right-5 h-7 w-7 rounded-full text-[#86868b] hover:text-white flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Title */}
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#2997ff]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Decision Intelligence</span>
          </div>
          <h2 className="text-xl font-semibold text-white tracking-[-0.03em] mt-1">Can I Afford This?</h2>
          <p className="text-xs text-[#86868b] font-normal mt-0.5">
            Real-time cash flow & savings goal stress test before spending.
          </p>
        </div>

        {/* Controls Grid */}
        <div className="space-y-4 bg-[#1d1d1f]/60 p-4 sm:p-5 rounded-[18px] border border-white/[0.06]">
          
          {/* Purchase Name & Preset Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-6">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#86868b] mb-1">
                Planned Item / Expense
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MacBook Air, Goa Trip, iPhone..."
                className="w-full bg-white/[0.06] border border-white/[0.08] text-white rounded-[12px] px-3 py-1.5 text-xs focus:outline-none focus:border-[#0066cc]"
              />
            </div>
            
            <div className="sm:col-span-6">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#86868b] mb-1">
                Quick Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setAmount(p.value)}
                    className={`apple-press text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                      amount === p.value
                        ? 'bg-[#0066cc] border-[#0066cc] text-white font-medium'
                        : 'bg-white/[0.04] border-white/[0.08] text-[#86868b] hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Amount Slider & Input */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
                Estimated Cost
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-[#86868b]">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-28 bg-white/[0.06] border border-white/[0.08] text-right text-sm font-semibold text-white rounded-[10px] px-2.5 py-1 focus:outline-none focus:border-[#0066cc]"
                />
              </div>
            </div>

            <input
              type="range"
              min="1000"
              max="200000"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full accent-[#0066cc] cursor-pointer h-1.5 bg-white/[0.1] rounded-lg"
            />
          </div>

          {/* Payment Mode Selector */}
          <div className="pt-2 border-t border-white/[0.06]">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#86868b] mb-2">
              Payment Structure
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setPaymentMode('upfront')}
                className={`apple-press p-2.5 rounded-[12px] border text-center transition-all ${
                  paymentMode === 'upfront'
                    ? 'bg-[#0066cc] border-[#0066cc] text-white'
                    : 'bg-white/[0.04] border-white/[0.06] text-[#86868b] hover:text-white'
                }`}
              >
                <div className="text-xs font-semibold">Upfront Cash</div>
                <div className="text-[10px] opacity-80 mt-0.5">100% immediate</div>
              </button>

              {[3, 6, 12].map((m) => {
                const isSelected = paymentMode === 'emi' && emiMonths === m;
                const monthlyAmt = (amount / m).toFixed(0);
                return (
                  <button
                    key={m}
                    onClick={() => {
                      setPaymentMode('emi');
                      setEmiMonths(m);
                    }}
                    className={`apple-press p-2.5 rounded-[12px] border text-center transition-all ${
                      isSelected
                        ? 'bg-[#0066cc] border-[#0066cc] text-white'
                        : 'bg-white/[0.04] border-white/[0.06] text-[#86868b] hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-semibold">{m} Mo EMI</div>
                    <div className="text-[10px] opacity-80 mt-0.5">₹{parseFloat(monthlyAmt).toLocaleString('en-IN')}/mo</div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Live Simulation Results */}
        {result && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Verdict Card */}
            <div
              className={`p-4 rounded-[18px] border flex items-start gap-3.5 transition-all ${
                result.verdict === 'safe'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                  : result.verdict === 'caution'
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {result.verdict === 'safe' ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                ) : result.verdict === 'caution' ? (
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                )}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold tracking-[-0.01em]">{result.verdict_title}</h4>
                <p className="text-xs opacity-90 leading-relaxed font-normal">{result.verdict_message}</p>
              </div>
            </div>

            {/* Before vs After Delta Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Safe to Spend Delta */}
              <div className="rounded-[16px] bg-[#1d1d1f] border border-white/[0.08] p-4 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
                  Safe To Spend
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#86868b] line-through">
                    ₹{parseFloat(result.safe_to_spend.before).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-[#86868b]">→</span>
                  <span className={`text-base font-semibold ${
                    parseFloat(result.safe_to_spend.after) < 0 ? 'text-rose-400' : 'text-white'
                  }`}>
                    ₹{parseFloat(result.safe_to_spend.after).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <span className="text-[10px] text-rose-400/90 block">
                  {parseFloat(result.safe_to_spend.delta) < 0 ? '' : '+'}
                  ₹{parseFloat(result.safe_to_spend.delta).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>

              {/* Runway Delta */}
              <div className="rounded-[16px] bg-[#1d1d1f] border border-white/[0.08] p-4 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
                  Survival Runway
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#86868b]">
                    {result.runway.before_months} mo
                  </span>
                  <span className="text-xs text-[#86868b]">→</span>
                  <span className={`text-base font-semibold ${
                    result.runway.after_status === 'healthy'
                      ? 'text-emerald-400'
                      : result.runway.after_status === 'caution'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}>
                    {result.runway.after_months} mo
                  </span>
                </div>
                <span className="text-[10px] text-[#86868b] block capitalize">
                  {result.runway.after_status} zone
                </span>
              </div>

              {/* Balance / Monthly Obligation Delta */}
              <div className="rounded-[16px] bg-[#1d1d1f] border border-white/[0.08] p-4 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
                  {paymentMode === 'emi' ? 'Monthly Fixed Bills' : 'Liquid Balance'}
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#86868b]">
                    ₹{(paymentMode === 'emi' ? parseFloat(result.upcoming_fixed_expenses.before) : parseFloat(result.total_balance.before)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-[#86868b]">→</span>
                  <span className="text-base font-semibold text-white">
                    ₹{(paymentMode === 'emi' ? parseFloat(result.upcoming_fixed_expenses.after) : parseFloat(result.total_balance.after)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <span className="text-[10px] text-[#86868b] block">
                  {paymentMode === 'emi' ? `+₹${(amount/emiMonths).toFixed(0)}/mo added` : `-₹${amount.toLocaleString('en-IN')} upfront`}
                </span>
              </div>

            </div>

            {/* Savings Goals Impact */}
            {result.goal_delays && result.goal_delays.length > 0 && (
              <div className="rounded-[16px] bg-[#1d1d1f]/70 border border-white/[0.06] p-4 space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
                  Savings Vaults Impact
                </span>
                <div className="space-y-1.5">
                  {result.goal_delays.map((g) => (
                    <div key={g.goal_id} className="flex items-center justify-between text-xs">
                      <span className="text-white font-medium">{g.goal_name}</span>
                      <span className="text-amber-400/90 text-[11px] font-normal">
                        +{g.delay_days} days target delay
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actionable Advice & Alternative Mode */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="space-y-1.5 text-xs text-[#86868b]">
                {result.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-[#2997ff] shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="apple-press bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs px-5 py-2 rounded-full transition-all"
          >
            Close Simulator
          </button>
        </div>

      </div>
    </div>
  );
};
