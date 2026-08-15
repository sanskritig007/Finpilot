import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, X, HelpCircle, ArrowRight } from 'lucide-react';

export const CSVMappingModal = ({ isOpen, headers, onConfirm, onClose }) => {
  const [isSplit, setIsSplit] = useState(false);
  const [mappings, setMappings] = useState({
    date: '',
    description: '',
    amount: '',
    debit: '',
    credit: '',
    category: '',
    type: ''
  });

  useEffect(() => {
    if (isOpen && headers && headers.length > 0) {
      // Helper to auto-guess columns
      const guessColumn = (keys) => {
        for (const key of keys) {
          const matched = headers.find(h => h.toLowerCase().includes(key.toLowerCase()));
          if (matched) return matched;
        }
        return '';
      };

      const dateGuess = guessColumn(['date', 'txn date', 'value date']);
      const descGuess = guessColumn(['desc', 'narration', 'particulars', 'info']);
      const amountGuess = guessColumn(['amount', 'value', 'net flow']);
      const debitGuess = guessColumn(['debit', 'withdrawal', 'dr']);
      const creditGuess = guessColumn(['credit', 'deposit', 'cr']);
      const catGuess = guessColumn(['category', 'genre']);
      const typeGuess = guessColumn(['dr/cr', 'd/c', 'type', 'transaction type']);

      // Check if file contains debit/credit split columns instead of single amount
      const hasDebitCredit = debitGuess !== '' && creditGuess !== '';
      setIsSplit(hasDebitCredit);

      setMappings({
        date: dateGuess || headers[0] || '',
        description: descGuess || headers[1] || headers[0] || '',
        amount: amountGuess || (hasDebitCredit ? '' : headers[2] || ''),
        debit: debitGuess || '',
        credit: creditGuess || '',
        category: catGuess || '',
        type: typeGuess || ''
      });
    }
  }, [isOpen, headers]);

  if (!isOpen) return null;

  const handleFieldChange = (field, value) => {
    setMappings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!mappings.date || !mappings.description) {
      alert("Date and Description mapping columns are required.");
      return;
    }
    
    if (isSplit) {
      if (!mappings.debit || !mappings.credit) {
        alert("Both Debit and Credit mapping columns are required for split layout.");
        return;
      }
    } else {
      if (!mappings.amount) {
        alert("Amount mapping column is required for single amount layout.");
        return;
      }
    }

    // Prepare final mappings
    const finalMappings = {
      date: mappings.date,
      description: mappings.description,
    };

    if (isSplit) {
      finalMappings.debit = mappings.debit;
      finalMappings.credit = mappings.credit;
    } else {
      finalMappings.amount = mappings.amount;
    }

    if (mappings.category) finalMappings.category = mappings.category;
    if (mappings.type) finalMappings.type = mappings.type;

    onConfirm(finalMappings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative max-w-lg w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-finpilot-primary/10 text-finpilot-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Map CSV Columns</h3>
              <p className="text-xs text-finpilot-muted">Confirm how we should parse your statement file.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-finpilot-muted hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 max-h-[70vh] overflow-y-auto">
          
          {/* Mapped file summary */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-finpilot-muted uppercase tracking-wider">Detected Columns from CSV</span>
            <div className="flex flex-wrap gap-1.5">
              {headers.map((h, i) => (
                <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/50">
                  {h}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            
            {/* Required Field: Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date Column *</label>
              <select
                value={mappings.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-750 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-finpilot-primary"
              >
                <option value="">-- Select Date Column --</option>
                {headers.map((h, i) => (
                  <option key={i} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Required Field: Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description/Narration Column *</label>
              <select
                value={mappings.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-750 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-finpilot-primary"
              >
                <option value="">-- Select Description Column --</option>
                {headers.map((h, i) => (
                  <option key={i} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Split Toggle */}
            <div className="border-t border-slate-800/80 pt-4">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-300 cursor-pointer mb-3">
                <span>Separate Debit & Credit Columns</span>
                <input
                  type="checkbox"
                  checked={isSplit}
                  onChange={(e) => setIsSplit(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-9 h-5 bg-slate-750 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-finpilot-primary"></div>
              </label>

              {isSplit ? (
                /* Split Debit/Credit Layout */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Debit (Outflow) Column *</label>
                    <select
                      value={mappings.debit}
                      onChange={(e) => handleFieldChange('debit', e.target.value)}
                      required
                      className="w-full bg-slate-800 border border-slate-750 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-finpilot-primary"
                    >
                      <option value="">-- Select Debit --</option>
                      {headers.map((h, i) => (
                        <option key={i} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Credit (Inflow) Column *</label>
                    <select
                      value={mappings.credit}
                      onChange={(e) => handleFieldChange('credit', e.target.value)}
                      required
                      className="w-full bg-slate-800 border border-slate-750 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-finpilot-primary"
                    >
                      <option value="">-- Select Credit --</option>
                      {headers.map((h, i) => (
                        <option key={i} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                /* Single Amount Column Layout */
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Amount Column *</label>
                  <select
                    value={mappings.amount}
                    onChange={(e) => handleFieldChange('amount', e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-750 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-finpilot-primary"
                  >
                    <option value="">-- Select Amount --</option>
                    {headers.map((h, i) => (
                      <option key={i} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Optional Fields Toggle/Drawer */}
            <div className="border-t border-slate-800/80 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category Column (Optional)</label>
                <select
                  value={mappings.category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-750 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-finpilot-primary"
                >
                  <option value="">-- Auto-Categorize --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Type Column (Optional)</label>
                <select
                  value={mappings.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-750 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-finpilot-primary"
                >
                  <option value="">-- Guess from values --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-750 text-slate-300 hover:text-white rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-finpilot-primary hover:bg-finpilot-primary-hover text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-finpilot-primary/10"
            >
              <span>Import Statement</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
