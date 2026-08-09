import React, { useState, useEffect } from 'react';
import api from '../../core/api';
import { AddGoalModal } from './AddGoalModal';
import { Target, Trash2, Plus, DollarSign, Check, X, Calendar } from 'lucide-react';

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

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/80 rounded-xl p-6 shadow-xl space-y-6">
      
      {/* Title Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-finpilot-primary" />
          <h3 className="text-lg font-bold text-white">Savings Goals</h3>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="p-1.5 rounded-lg bg-finpilot-primary/10 hover:bg-finpilot-primary/25 text-finpilot-primary hover:text-white transition-all"
          title="Add New Goal"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Goals Cards List */}
      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
        {goals.length === 0 ? (
          <div className="text-center py-8 text-finpilot-muted text-sm">
            <p>No active savings goals.</p>
            <p className="text-xs mt-1">Click the + icon to configure one.</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
            const isCompleted = goal.status === 'completed' || progress >= 100;
            
            return (
              <div 
                key={goal.id} 
                className={`p-4 rounded-xl border transition-all ${
                  isCompleted 
                    ? 'bg-emerald-950/20 border-emerald-500/20 shadow-md shadow-emerald-500/5' 
                    : 'bg-slate-850/50 border-slate-750 hover:border-slate-700'
                }`}
              >
                
                {/* Header Information */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{goal.name}</span>
                      {isCompleted && (
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Check className="h-3 w-3" /> Done
                        </span>
                      )}
                    </h4>
                    {goal.target_date && (
                      <p className="text-[10px] text-finpilot-muted flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>Target: {formatDate(goal.target_date)}</span>
                      </p>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {!isCompleted && (
                      <button
                        onClick={() => {
                          setFundingGoalId(fundingGoalId === goal.id ? null : goal.id);
                          setFundAmount('');
                        }}
                        className={`p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors ${
                          fundingGoalId === goal.id ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'
                        }`}
                        title="Add Funds"
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-finpilot-muted">
                      ₹{parseFloat(goal.current_amount).toLocaleString('en-IN')} / ₹{parseFloat(goal.target_amount).toLocaleString('en-IN')}
                    </span>
                    <span className={`font-bold ${isCompleted ? 'text-emerald-400' : 'text-finpilot-primary'}`}>
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-550 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-finpilot-primary'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Inline Add Funds Drawer */}
                {fundingGoalId === goal.id && (
                  <div className="mt-3.5 pt-3 border-t border-slate-800 flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Amount to save..."
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-750 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-finpilot-primary"
                    />
                    <button
                      onClick={() => handleAddFunds(goal)}
                      disabled={loadingId === goal.id || !fundAmount}
                      className="p-1.5 bg-finpilot-primary text-white rounded-lg hover:bg-finpilot-primary-hover disabled:opacity-50 transition-colors"
                      title="Save Amount"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setFundingGoalId(null);
                        setFundAmount('');
                      }}
                      className="p-1.5 border border-slate-750 text-slate-400 rounded-lg hover:text-white transition-colors"
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
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
