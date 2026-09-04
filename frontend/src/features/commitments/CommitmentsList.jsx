import React, { useState, useEffect } from 'react';
import api from '../../core/api';
import { Plus, Sparkles, Trash2, Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { AddCommitmentModal } from './AddCommitmentModal';

export const CommitmentsList = ({ refreshTrigger, onUpdate }) => {
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchCommitments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/commitments');
      setCommitments(response.data || []);
    } catch (err) {
      console.error('Error fetching commitments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommitments();
  }, [refreshTrigger]);

  const handleAutoDetect = async () => {
    setDetecting(true);
    setDetectMsg('');
    try {
      const res = await api.post('/commitments/detect');
      const count = res.data.newly_detected_count;
      if (count > 0) {
        setDetectMsg(`Auto-detected ${count} recurring subscription(s)!`);
      } else {
        setDetectMsg('No new repeating patterns found in recent transactions.');
      }
      fetchCommitments();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Auto-detect error:', err);
      setDetectMsg('Failed to run recurring detection.');
    } finally {
      setDetecting(false);
      setTimeout(() => setDetectMsg(''), 4000);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/commitments/${id}`);
      fetchCommitments();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error deleting commitment:', err);
    }
  };

  const totalMonthlyCommitment = commitments.reduce((sum, c) => {
    const amt = parseFloat(c.amount) || 0;
    if (c.frequency === 'yearly') return sum + (amt / 12);
    if (c.frequency === 'weekly') return sum + (amt * 4.33);
    return sum + amt;
  }, 0);

  return (
    <div className="rounded-[18px] bg-[#161617] border border-white/[0.08] p-6 space-y-6 shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white tracking-[-0.02em]">Fixed Commitments</h3>
            <span className="text-[10px] font-medium bg-white/[0.08] text-[#86868b] px-2 py-0.5 rounded-full">
              {commitments.length}
            </span>
          </div>
          <p className="text-xs text-[#86868b] font-normal mt-0.5">
            Total ₹{totalMonthlyCommitment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo reserved from Safe-to-Spend
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoDetect}
            disabled={detecting}
            className="apple-press bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.08] text-xs font-normal px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all disabled:opacity-40"
            title="Scan past transactions for recurring subscriptions"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#2997ff]" />
            <span>{detecting ? 'Scanning...' : 'Auto-Detect'}</span>
          </button>
          
          <button
            onClick={() => setIsAddOpen(true)}
            className="apple-press bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-normal px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Bill</span>
          </button>
        </div>
      </div>

      {/* Auto-detect notification badge */}
      {detectMsg && (
        <div className="bg-[#2997ff]/10 border border-[#2997ff]/20 text-[#2997ff] text-xs px-3.5 py-2.5 rounded-[12px] flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>{detectMsg}</span>
        </div>
      )}

      {/* Commitment List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-[#86868b]">Loading fixed obligations...</div>
      ) : commitments.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <p className="text-xs text-[#86868b]">No fixed commitments or subscriptions recorded.</p>
          <p className="text-[11px] text-[#86868b]/70">
            Click <strong>Auto-Detect</strong> to extract recurring bills from your transactions or add them manually.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {commitments.map((c) => {
            const isPaid = c.is_paid_this_month;
            const daysLeft = c.days_until_due;

            return (
              <div
                key={c.id}
                className="group flex items-center justify-between p-3.5 rounded-[14px] bg-[#1d1d1f]/60 hover:bg-[#1d1d1f] border border-white/[0.04] hover:border-white/[0.08] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 text-[#86868b]">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white truncate">{c.name}</span>
                      {c.auto_detected && (
                        <span className="text-[9px] font-normal uppercase tracking-wider text-[#2997ff] bg-[#2997ff]/10 px-1.5 py-0.2 rounded">
                          Auto
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#86868b] block">
                      {c.category} • Day {c.due_day} of month
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-white tracking-[-0.01em]">
                      ₹{parseFloat(c.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    
                    {/* Due Status Pill */}
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-normal">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Settled
                      </span>
                    ) : daysLeft === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                        <AlertCircle className="h-2.5 w-2.5" /> Due Today
                      </span>
                    ) : daysLeft > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#2997ff] font-normal">
                        <Clock className="h-2.5 w-2.5" /> In {daysLeft}d
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-medium">
                        <AlertCircle className="h-2.5 w-2.5" /> Overdue
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(c.id)}
                    className="apple-press p-1 text-[#86868b] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove obligation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddCommitmentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCommitmentAdded={() => {
          fetchCommitments();
          if (onUpdate) onUpdate();
        }}
      />
    </div>
  );
};
