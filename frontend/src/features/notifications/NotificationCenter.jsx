import React, { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, AlertCircle, Clock, CheckCircle2, X } from 'lucide-react';
import api from '../../core/api';

export const NotificationCenter = ({ refreshTrigger, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const popoverRef = useRef(null);

  useEffect(() => {
    fetchAlerts();
  }, [refreshTrigger]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/commitments');
      const commitments = res.data || [];
      
      const items = [];
      commitments.forEach(c => {
        if (!c.is_paid_this_month) {
          if (c.days_until_due <= 0) {
            items.push({
              id: c.id,
              title: `${c.name} is Overdue / Due Today`,
              desc: `₹${parseFloat(c.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} was due on day ${c.due_day}.`,
              type: 'urgent',
              time: 'Action Required',
              commitment: c
            });
          } else if (c.days_until_due <= 5) {
            items.push({
              id: c.id,
              title: `${c.name} Due in ${c.days_until_due} day${c.days_until_due > 1 ? 's' : ''}`,
              desc: `₹${parseFloat(c.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} reserved from Safe-to-Spend.`,
              type: 'upcoming',
              time: `Due on ${new Date(c.next_due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
              commitment: c
            });
          }
        }
      });

      setNotifications(items);
      setUnreadCount(items.length);
    } catch (err) {
      console.error('Error fetching notification alerts:', err);
    }
  };

  const handleMarkPaid = async (commitment) => {
    try {
      // Create an expense transaction for this commitment in current cycle
      await api.post('/transactions/', {
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(commitment.amount),
        type: 'expense',
        category: commitment.category || 'Subscriptions',
        description: `${commitment.name} (Settled)`
      });
      fetchAlerts();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error marking bill paid:', err);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="apple-press relative h-8 w-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#86868b] hover:text-white border border-white/[0.06] flex items-center justify-center transition-colors"
        title="Notifications & Bill Reminders"
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#0066cc] text-white text-[9px] font-semibold flex items-center justify-center border border-[#101012]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Apple Frosted Notification Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-[20px] bg-[#1a1a1c]/95 backdrop-blur-2xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white tracking-[-0.01em]">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-[#0066cc]/20 text-[#2997ff] px-2 py-0.2 rounded-full font-medium">
                  {unreadCount} urgent
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#86868b] hover:text-white p-1 rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center space-y-1">
              <CheckCircle2 className="h-6 w-6 text-emerald-400/80 mx-auto mb-2" />
              <p className="text-xs text-white font-medium">All caught up</p>
              <p className="text-[11px] text-[#86868b]">No bills due in the immediate 5-day horizon.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-[14px] bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.04] transition-all space-y-2"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {item.type === 'urgent' ? (
                        <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-[#2997ff]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-xs font-medium text-white truncate">{item.title}</h4>
                        <span className="text-[9px] text-[#86868b] shrink-0">{item.time}</span>
                      </div>
                      <p className="text-[11px] text-[#86868b] mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleMarkPaid(item.commitment)}
                      className="apple-press bg-white/[0.08] hover:bg-white/[0.14] text-white text-[10px] font-normal px-2.5 py-1 rounded-full flex items-center gap-1 transition-all"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                      <span>Mark Settled</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
