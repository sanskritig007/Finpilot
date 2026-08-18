import React from 'react';
import { Sparkles, RefreshCw, AlertCircle, Quote } from 'lucide-react';

export const AICoachCard = ({ insights, loading, onRefresh }) => {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-slate-800 rounded-lg"></div>
            <div>
              <div className="h-4 w-32 bg-slate-800 rounded mb-1.5"></div>
              <div className="h-3 w-48 bg-slate-800 rounded"></div>
            </div>
          </div>
          <div className="h-8 w-8 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-4 w-full bg-slate-800 rounded"></div>
          <div className="h-4 w-5/6 bg-slate-800 rounded"></div>
        </div>
        <div className="space-y-2.5 pt-4">
          <div className="h-3 w-4/5 bg-slate-800 rounded"></div>
          <div className="h-3 w-3/4 bg-slate-800 rounded"></div>
          <div className="h-3 w-5/6 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900/40 to-slate-950/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      
      {/* Background Gradient Orbs */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-finpilot-primary/5 blur-3xl group-hover:bg-finpilot-primary/10 transition-colors duration-500"></div>
      
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">AI Coach Insights</h4>
            <p className="text-[11px] text-finpilot-muted">Personalized financial advice powered by FinPilot AI</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg border border-slate-850 bg-slate-900 text-finpilot-muted hover:text-white hover:border-slate-700 transition-all shadow-md active:scale-95 flex items-center justify-center"
          title="Regenerate Insights"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Analysis */}
      <div className="text-slate-200 text-sm leading-relaxed mb-5 font-semibold bg-slate-950/30 border border-slate-850/40 p-4 rounded-xl">
        {insights.analysis}
      </div>

      {/* Recommendations */}
      <div className="space-y-3 mb-6">
        <span className="text-[10px] font-black text-finpilot-muted uppercase tracking-wider block mb-1">Recommendations</span>
        {insights.recommendations && insights.recommendations.map((rec, index) => (
          <div key={index} className="flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
            <span className="text-indigo-400 font-bold shrink-0 mt-0.5">✨</span>
            <span>{rec}</span>
          </div>
        ))}
      </div>

      {/* Encouragement */}
      {insights.encouragement && (
        <div className="border-t border-slate-800/80 pt-4 mt-4 flex items-start gap-3 bg-indigo-950/10 p-3 rounded-lg border border-indigo-900/20">
          <Quote className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5 opacity-60" />
          <p className="text-xs text-indigo-300 italic font-medium">
            {insights.encouragement}
          </p>
        </div>
      )}

    </div>
  );
};
