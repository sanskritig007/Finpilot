import React, { useState, useEffect } from 'react';
import { Zap, X, Calendar, ArrowRight } from 'lucide-react';
import api from '../../core/api';

export const UpcomingBillBanner = ({ refreshTrigger, onScrollToCommitments }) => {
  const [urgentBills, setUrgentBills] = useState([]);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    fetchUrgent();
  }, [refreshTrigger]);

  const fetchUrgent = async () => {
    try {
      const res = await api.get('/commitments');
      const commitments = res.data || [];
      const urgent = commitments.filter(
        (c) => !c.is_paid_this_month && c.days_until_due <= 3
      );
      setUrgentBills(urgent);
    } catch (err) {
      console.error('Error checking urgent bills:', err);
    }
  };

  if (isDismissed || urgentBills.length === 0) return null;

  const totalUrgent = urgentBills.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
  const billNames = urgentBills.map((c) => c.name).join(', ');

  return (
    <div className="bg-[#18181b] border border-[#2997ff]/25 p-4 rounded-[18px] flex flex-wrap items-center justify-between gap-4 text-xs text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-full bg-[#2997ff]/15 flex items-center justify-center text-[#2997ff] shrink-0">
          <Zap className="h-3.5 w-3.5 animate-pulse" />
        </div>
        <div>
          <span className="font-semibold text-white">Upcoming Obligations: </span>
          <span className="text-[#a1a1a6]">
            {billNames} ({urgentBills[0]?.days_until_due <= 0 ? 'Due Today / Overdue' : `due in ${urgentBills[0]?.days_until_due}d`}) totaling{' '}
            <strong className="text-white">₹{totalUrgent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> — secured from Safe-to-Spend.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onScrollToCommitments && (
          <button
            onClick={onScrollToCommitments}
            className="apple-press bg-white/[0.08] hover:bg-white/[0.14] text-white text-[11px] font-normal px-3 py-1.5 rounded-full flex items-center gap-1 transition-all"
          >
            <span>Review</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={() => setIsDismissed(true)}
          className="apple-press h-7 w-7 rounded-full text-[#86868b] hover:text-white flex items-center justify-center"
          title="Dismiss notice"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
