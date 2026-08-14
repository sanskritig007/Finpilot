import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Wallet, 
  Target, 
  MessageSquare, 
  ArrowRight, 
  ArrowLeft, 
  X,
  FileText,
  AlertTriangle
} from 'lucide-react';

export const DemoTourModal = ({ isOpen, onClose, onStartSignup }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: "FinPilot AI Overview",
      subtitle: "Intelligent Personal Finance & Budgeting",
      icon: <ShieldCheck className="h-12 w-12 text-blue-400" />,
      gradient: "from-blue-500/20 to-indigo-500/5",
      description: "FinPilot is a premium, secure financial companion. We help you track spending, calculate spendable allowances, and automate savings planning without manual spreadsheets.",
      bullets: [
        "🔒 Secure & Private: All data is isolated under JWT session encryption.",
        "📊 Automatic Dashboard: Dynamic calculations for checking balances.",
        "💡 Clear Memory Settings: Delete rate limits, chatbot memories, or accounts cascadingly with one click."
      ]
    },
    {
      title: "Safe-to-Spend Balance",
      subtitle: "No more budget guesswork",
      icon: <Wallet className="h-12 w-12 text-amber-400" />,
      gradient: "from-amber-500/20 to-orange-500/5",
      description: "Unlike normal banking apps that show your entire account balance as spendable, FinPilot calculates your exact spendable allowance after locking target monthly savings.",
      bullets: [
        "🎯 Formula: Safe to Spend = Total Balance - Active Goal Targets.",
        "⚠️ Under-budget Warning: Displays yellow card alerts when balance falls below 15%.",
        "🚨 Over-budget Alerts: Turns red when your locked targets exceed your wallet balance."
      ]
    },
    {
      title: "Smart Savings Goals",
      subtitle: "Target date saving made easy",
      icon: <Target className="h-12 w-12 text-emerald-400" />,
      gradient: "from-emerald-500/20 to-teal-500/5",
      description: "Set a savings target (e.g. ₹50,000 for a phone) and a target date. FinPilot dynamically computes how much you must save per month to stay on track.",
      bullets: [
        "📅 Dynamic Recommendation: E.g., 'Save ₹16,667 / month to buy by Nov 2026'.",
        "💸 Double-Entry Sync: When you add funds to a goal, they are automatically logged as a savings transfer to adjust your total balance.",
        "♻️ Refund on Delete: Deleting a goal automatically credits your saved funds back."
      ]
    },
    {
      title: "Gemini AI Chat Assistant",
      subtitle: "Conversational statement querying",
      icon: <MessageSquare className="h-12 w-12 text-purple-400" />,
      gradient: "from-purple-500/20 to-pink-500/5",
      description: "FinPilot is integrated with Google Gemini. Chat naturally to query your transactions, calculate categories, and ask for smart budgeting insights.",
      bullets: [
        "💬 'How much did I spend on Swiggy last week?'",
        "📈 'Am I saving enough to meet my phone goal?'",
        "🔒 Local rate-limiting ensures AI is safe, stable, and highly responsive."
      ]
    }
  ];

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      setActiveSlide(activeSlide + 1);
    }
  };

  const handlePrev = () => {
    if (activeSlide > 0) {
      setActiveSlide(activeSlide - 1);
    }
  };

  const current = slides[activeSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:min-h-[500px]">
        
        {/* Top Header / Close */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <span className="text-xs font-bold text-finpilot-primary uppercase tracking-widest">FinPilot Product Tour</span>
          <button 
            onClick={onClose}
            className="p-1 text-finpilot-muted hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Slide Content */}
        <div className="flex-1 p-8 flex flex-col justify-center">
          <div className="flex flex-col items-center md:items-start md:flex-row gap-6">
            
            {/* Left Icon Display */}
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${current.gradient} border border-slate-700/50 shrink-0 shadow-lg shadow-black/30`}>
              {current.icon}
            </div>

            {/* Right Information */}
            <div className="space-y-4 flex-1 text-center md:text-left">
              <div>
                <h3 className="text-2xl font-black text-white">{current.title}</h3>
                <p className="text-sm text-finpilot-primary font-medium">{current.subtitle}</p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {current.description}
              </p>
              
              <ul className="text-xs text-finpilot-muted space-y-2 border-t border-slate-800/80 pt-4 text-left max-w-md mx-auto md:mx-0">
                {current.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-slate-400 select-none">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Progress Indicators */}
          <div className="flex gap-1.5 order-2 sm:order-1">
            {slides.map((_, idx) => (
              <span 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeSlide ? 'w-6 bg-finpilot-primary' : 'w-1.5 bg-slate-700'}`}
              ></span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={activeSlide === 0}
                className="p-2 border border-slate-750 text-slate-400 hover:text-white hover:border-slate-650 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={activeSlide === slides.length - 1}
                className="p-2 border border-slate-750 text-slate-400 hover:text-white hover:border-slate-650 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {activeSlide === slides.length - 1 ? (
              <button
                onClick={() => {
                  onClose();
                  onStartSignup();
                }}
                className="bg-finpilot-primary hover:bg-finpilot-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1 shadow-lg shadow-finpilot-primary/20"
              >
                <span>Create Account to Start</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onStartSignup();
                }}
                className="text-xs text-finpilot-muted hover:text-white font-semibold transition-colors"
              >
                Skip Tour & Register
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
