import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, X, ArrowRight } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="relative max-w-lg w-full bg-[#161617] border border-white/[0.1] rounded-[22px] shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="h-4 w-4 text-[#2997ff]" />
            <div>
              <h3 className="text-base font-semibold text-white tracking-[-0.02em]">Schema Mapping</h3>
              <p className="text-[11px] text-[#86868b] font-normal">Match CSV columns to standard data model</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="apple-press h-7 w-7 rounded-full text-[#86868b] hover:text-white flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 max-h-[70vh] overflow-y-auto">
          
          {/* Detected Headers */}
          <div className="bg-white/[0.03] p-3.5 rounded-[14px] border border-white/[0.06] space-y-2">
            <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block">
              Detected File Headers
            </span>
            <div className="flex flex-wrap gap-1.5">
              {headers.map((h, i) => (
                <span key={i} className="text-[10px] bg-white/[0.06] text-[#f5f5f7] px-2 py-0.5 rounded-full border border-white/[0.06]">
                  {h}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            
            {/* Date */}
            <div>
              <label className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">Date Column *</label>
              <select
                value={mappings.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                required
                className="w-full bg-white/[0.06] border border-white/[0.08] text-white rounded-[12px] px-3 py-2 text-xs focus:outline-none focus:border-[#0066cc]"
              >
                <option value="" className="bg-[#1d1d1f]">-- Select Date --</option>
                {headers.map((h, i) => (
                  <option key={i} value={h} className="bg-[#1d1d1f]">{h}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">Description Column *</label>
              <select
                value={mappings.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                required
                className="w-full bg-white/[0.06] border border-white/[0.08] text-white rounded-[12px] px-3 py-2 text-xs focus:outline-none focus:border-[#0066cc]"
              >
                <option value="" className="bg-[#1d1d1f]">-- Select Description --</option>
                {headers.map((h, i) => (
                  <option key={i} value={h} className="bg-[#1d1d1f]">{h}</option>
                ))}
              </select>
            </div>

            {/* Split Toggle */}
            <div className="border-t border-white/[0.06] pt-4">
              <label className="flex items-center justify-between text-xs font-normal text-[#f5f5f7] cursor-pointer mb-3">
                <span>Split Debit & Credit Columns</span>
                <input
                  type="checkbox"
                  checked={isSplit}
                  onChange={(e) => setIsSplit(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-9 h-5 bg-white/[0.14] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0066cc]"></div>
              </label>

              {isSplit ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">Debit (Outflow) *</label>
                    <select
                      value={mappings.debit}
                      onChange={(e) => handleFieldChange('debit', e.target.value)}
                      required
                      className="w-full bg-white/[0.06] border border-white/[0.08] text-white rounded-[12px] px-3 py-2 text-xs focus:outline-none focus:border-[#0066cc]"
                    >
                      <option value="" className="bg-[#1d1d1f]">-- Select Debit --</option>
                      {headers.map((h, i) => (
                        <option key={i} value={h} className="bg-[#1d1d1f]">{h}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">Credit (Inflow) *</label>
                    <select
                      value={mappings.credit}
                      onChange={(e) => handleFieldChange('credit', e.target.value)}
                      required
                      className="w-full bg-white/[0.06] border border-white/[0.08] text-white rounded-[12px] px-3 py-2 text-xs focus:outline-none focus:border-[#0066cc]"
                    >
                      <option value="" className="bg-[#1d1d1f]">-- Select Credit --</option>
                      {headers.map((h, i) => (
                        <option key={i} value={h} className="bg-[#1d1d1f]">{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">Amount Column *</label>
                  <select
                    value={mappings.amount}
                    onChange={(e) => handleFieldChange('amount', e.target.value)}
                    required
                    className="w-full bg-white/[0.06] border border-white/[0.08] text-white rounded-[12px] px-3 py-2 text-xs focus:outline-none focus:border-[#0066cc]"
                  >
                    <option value="" className="bg-[#1d1d1f]">-- Select Amount --</option>
                    {headers.map((h, i) => (
                      <option key={i} value={h} className="bg-[#1d1d1f]">{h}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Optional Fields */}
            <div className="border-t border-white/[0.06] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">Category (Optional)</label>
                <select
                  value={mappings.category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  className="w-full bg-white/[0.06] border border-white/[0.08] text-white rounded-[12px] px-3 py-2 text-xs focus:outline-none focus:border-[#0066cc]"
                >
                  <option value="" className="bg-[#1d1d1f]">-- Auto-Categorize --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={h} className="bg-[#1d1d1f]">{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">Type (Optional)</label>
                <select
                  value={mappings.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  className="w-full bg-white/[0.06] border border-white/[0.08] text-white rounded-[12px] px-3 py-2 text-xs focus:outline-none focus:border-[#0066cc]"
                >
                  <option value="" className="bg-[#1d1d1f]">-- Inferred --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={h} className="bg-[#1d1d1f]">{h}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-white/[0.08] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="apple-press px-4 py-2 text-[#86868b] hover:text-white rounded-full text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="apple-press bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium px-5 py-2 rounded-full transition-colors flex items-center gap-1.5"
            >
              <span>Confirm Mapping</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
