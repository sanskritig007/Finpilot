import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

export const AICoachCard = ({ insights, loading, onRefresh }) => {
  // Skeleton loader on initial fetch
  if (loading && !insights) {
    return (
      <div className="rounded-[18px] bg-[#161617] border border-white/[0.08] p-6 md:p-8 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-white/[0.08] rounded-full"></div>
          <div className="h-7 w-7 bg-white/[0.08] rounded-full"></div>
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-4 w-full bg-white/[0.08] rounded"></div>
          <div className="h-4 w-5/6 bg-white/[0.08] rounded"></div>
        </div>
        <div className="space-y-2 pt-3">
          <div className="h-3 w-4/5 bg-white/[0.05] rounded"></div>
          <div className="h-3 w-3/4 bg-white/[0.05] rounded"></div>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className={`rounded-[18px] bg-[#161617] border border-white/[0.08] p-6 md:p-8 space-y-5 transition-all duration-300 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#2997ff]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
            FinPilot Intelligence
          </span>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="apple-press h-7 w-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#86868b] hover:text-white border border-white/[0.06] flex items-center justify-center transition-colors disabled:opacity-50"
          title="Regenerate Analysis"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin text-[#2997ff]' : ''}`} />
        </button>
      </div>

      {/* Analysis Headline */}
      <p className="text-sm md:text-base text-[#f5f5f7] leading-relaxed font-normal">
        {insights.analysis}
      </p>

      {/* Recommendations Minimalist List */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div className="space-y-2.5 pt-1 border-t border-white/[0.06]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block pt-3">
            Key Recommendations
          </span>
          <div className="space-y-2">
            {insights.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2.5 text-xs text-neutral-300 leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0066cc] mt-1.5 shrink-0"></span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encouragement */}
      {insights.encouragement && (
        <div className="pt-2">
          <p className="text-xs text-[#86868b] italic">
            "{insights.encouragement}"
          </p>
        </div>
      )}

    </div>
  );
};
