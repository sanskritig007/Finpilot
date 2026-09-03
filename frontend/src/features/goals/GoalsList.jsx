import React, { useState, useEffect } from 'react';
import api from '../../core/api';
import { AddGoalModal } from './AddGoalModal';
import { Trash2, Plus, DollarSign, Check, Calendar } from 'lucide-react';

// Savings goals management component with Apple aesthetic
export const GoalsList = ({ refreshTrigger, onUpdate }) => {
  const [goals, setGoals] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [fundingGoalId, setFundingGoalId] = useState(null);
  const [fundAmount, setFundAmount] = useState('');
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    fetchGoals();
  }, [refreshTrigger]);

  const fetchGoals = async () => {
    try {
      const response = await api.get('/goals/');
      setGoals(response.data);
    } catch (err) {
      console.error('Error fetching savings goals:', err);
    }
  };

  const handleDelete = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await api.delete(`/goals/${goalId}`);
      fetchGoals();
      onUpdate();
    } catch (err) {
      console.error('Error deleting savings goal:', err);
    }
  };

  const handleAddFunds = async (goal) => {
    if (!fundAmount || isNaN(fundAmount) || parseFloat(fundAmount) <= 0) return;
    
    setLoadingId(goal.id);
    const added = parseFloat(fundAmount);
    const newCurrent = parseFloat(goal.current_amount) + added;
    const isCompleted = newCurrent >= parseFloat(goal.target_amount);

    try {
      await api.put(`/goals/${goal.id}`, {
        current_amount: newCurrent,
        status: isCompleted ? 'completed' : goal.status
      });
      setFundAmount('');
      setFundingGoalId(null);
      fetchGoals();
      onUpdate();
    } catch (err) {
      console.error('Error adding funds to savings goal:', err);
    } finally {
      setLoadingId(null);
    }
  };

  const getProgressPercentage = (current, target) => {
    const curr = parseFloat(current);
    const targ = parseFloat(target);
    if (!targ || targ <= 0) return 0;
    return Math.min(Math.round((curr / targ) * 100), 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const getMonthlyRecommendation = (targetAmount, currentAmount, targetDate) => {
    if (!targetDate) return null;
    const today = new Date();
    const target = new Date(targetDate);
    
    let months = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth());
    if (months <= 0) months = 1;
    
    const remaining = parseFloat(targetAmount) - parseFloat(currentAmount);
    if (remaining <= 0) return 0;
    
    return Math.round(remaining / months);
  };

  return (
    <div className="rounded-[18px] bg-[#161617] border border-white/[0.08] p-5 md:p-6 space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <h3 className="text-base font-semibold text-white tracking-[-0.02em]">Savings Vaults</h3>
          <p className="text-xs text-[#86868b] font-normal">Dedicated capital targets</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="apple-press h-7 w-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.06] flex items-center justify-center transition-colors"
          title="Add New Vault"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Vaults List */}
      <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-0.5">
        {goals.length === 0 ? (
          <div className="text-center py-10 text-[#86868b] text-xs">
            <p>No active savings vaults configured.</p>
            <p className="mt-1">Tap + to establish a savings target.</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
            const isCompleted = goal.status === 'completed' || progress >= 100;
            
            return (
              <div 
                key={goal.id} 
                className={`p-4 rounded-[14px] border transition-all ${
                  isCompleted 
                    ? 'bg-emerald-950/20 border-emerald-500/20' 
                    : 'bg-[#1d1d1f] border-white/[0.08]'
                }`}
              >
                
                {/* Vault Title & Actions */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-medium text-xs text-white flex items-center gap-1.5">
                      <span>{goal.name}</span>
                      {isCompleted && (
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Check className="h-2.5 w-2.5" /> Fulfilled
                        </span>
                      )}
                    </h4>
                    {goal.target_date && (
                      <>
                        <p className="text-[10px] text-[#86868b] flex items-center gap-1 mt-0.5">
                          <Calendar className="h-2.5 w-2.5 opacity-70" />
                          <span>Maturity: {formatDate(goal.target_date)}</span>
                        </p>
                        {!isCompleted && (
                          <p className="text-[10px] text-[#2997ff] font-normal mt-1">
                            Save ₹{getMonthlyRecommendation(goal.target_amount, goal.current_amount, goal.target_date).toLocaleString('en-IN')}/mo
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Action Icons */}
                  <div className="flex items-center gap-1">
                    {!isCompleted && (
                      <button
                        onClick={() => {
                          setFundingGoalId(fundingGoalId === goal.id ? null : goal.id);
                          setFundAmount('');
                        }}
                        className={`apple-press p-1.5 rounded-full text-[#86868b] hover:text-white transition-colors ${
                          fundingGoalId === goal.id ? 'bg-white/[0.12] text-white' : 'hover:bg-white/[0.06]'
                        }`}
                        title="Add Funds"
                      >
                        <DollarSign className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="apple-press p-1.5 rounded-full text-[#86868b] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#86868b]">
                      ₹{parseFloat(goal.current_amount).toLocaleString('en-IN')} / ₹{parseFloat(goal.target_amount).toLocaleString('en-IN')}
                    </span>
                    <span className={`font-medium ${isCompleted ? 'text-emerald-400' : 'text-[#2997ff]'}`}>
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-[#0066cc]'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Inline Add Funds */}
                {fundingGoalId === goal.id && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06] flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Amount to deposit..."
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      className="flex-1 bg-black/50 border border-white/[0.12] text-white text-[11px] rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#0066cc]"
                      autoFocus
                    />
                    <button
                      onClick={() => handleAddFunds(goal)}
                      disabled={loadingId === goal.id || !fundAmount}
                      className="apple-press px-2.5 py-1 bg-[#0066cc] text-white text-[10px] font-medium rounded-full hover:bg-[#0071e3] disabled:opacity-40 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setFundingGoalId(null);
                        setFundAmount('');
                      }}
                      className="apple-press px-2 py-1 text-[#86868b] text-[10px] rounded-full hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Add Goal Modal */}
      <AddGoalModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onGoalAdded={() => {
          fetchGoals();
          onUpdate();
        }}
      />

    </div>
  );
};
