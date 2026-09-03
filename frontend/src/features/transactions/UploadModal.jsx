import React, { useState } from 'react';
import api from '../../core/api';
import { Upload, X, CheckCircle, AlertTriangle, Settings } from 'lucide-react';
import { CSVMappingModal } from './CSVMappingModal';

export const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [mappings, setMappings] = useState(null);
  const [showMappingModal, setShowMappingModal] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setResult(null);
    setMappings(null);

    // Read headers of the selected CSV file locally
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const firstLine = text.split('\n')[0];
      if (firstLine) {
        const headers = firstLine.split(',')
          .map(h => h.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
        setCsvHeaders(headers);
        setShowMappingModal(true);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleConfirmMapping = (selectedMappings) => {
    setMappings(selectedMappings);
    setShowMappingModal(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    // Append custom column mapping query parameters
    let url = '/transactions/upload';
    if (mappings) {
      const params = new URLSearchParams();
      if (mappings.date) params.append('mapping_date', mappings.date);
      if (mappings.description) params.append('mapping_desc', mappings.description);
      if (mappings.amount) params.append('mapping_amount', mappings.amount);
      if (mappings.debit) params.append('mapping_debit', mappings.debit);
      if (mappings.credit) params.append('mapping_credit', mappings.credit);
      if (mappings.category) params.append('mapping_category', mappings.category);
      if (mappings.type) params.append('mapping_type', mappings.type);
      url += `?${params.toString()}`;
    }

    try {
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
      if (onUploadSuccess) onUploadSuccess();
      
      // Auto-close modal after 1.5 seconds so they see the success results
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload statement.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setFile(null);
    setResult(null);
    setError('');
    setMappings(null);
    setCsvHeaders([]);
    setShowMappingModal(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
        <div className="bg-[#161617] w-full max-w-md p-6 md:p-8 rounded-[22px] border border-white/[0.1] shadow-[0_30px_70px_rgba(0,0,0,0.8)] relative">
          <button
            onClick={handleClose}
            className="apple-press absolute top-5 right-5 h-7 w-7 rounded-full text-[#86868b] hover:text-white flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>

          <h3 className="text-lg font-semibold text-white tracking-[-0.02em] mb-6">Upload Bank Statement</h3>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-[12px] mb-5 flex items-start gap-2 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-[14px] mb-5 text-xs space-y-2">
              <div className="flex items-center gap-2 font-medium text-white">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>{result.message}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-emerald-500/20 text-[#86868b]">
                <div>Imported: <span className="text-white font-medium">{result.total_imported}</span></div>
                <div>Skipped (Dup): <span className="text-white font-medium">{result.duplicates_skipped}</span></div>
              </div>
            </div>
          )}

          {/* Column Mapping Summary */}
          {mappings && (
            <div className="bg-white/[0.04] p-3 rounded-[14px] border border-white/[0.08] text-xs space-y-1 mb-5">
              <div className="flex justify-between items-center text-[10px] font-semibold text-[#2997ff] uppercase tracking-wider">
                <span>✓ Schema Mapping Configured</span>
                <button 
                  type="button" 
                  onClick={() => setShowMappingModal(true)}
                  className="hover:underline text-white font-normal flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" />
                  <span>Configure</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[#86868b] text-[11px] mt-1.5">
                <div>Date: <span className="text-[#f5f5f7]">{mappings.date}</span></div>
                <div>Desc: <span className="text-[#f5f5f7]">{mappings.description}</span></div>
                {mappings.amount ? (
                  <div className="col-span-2">Amount: <span className="text-[#f5f5f7]">{mappings.amount}</span></div>
                ) : (
                  <>
                    <div>Debit: <span className="text-[#f5f5f7]">{mappings.debit}</span></div>
                    <div>Credit: <span className="text-[#f5f5f7]">{mappings.credit}</span></div>
                  </>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-5">
            <div className="border border-dashed border-white/[0.14] rounded-[16px] p-6 text-center hover:bg-white/[0.03] transition-colors cursor-pointer relative bg-white/[0.02]">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="mx-auto h-8 w-8 text-[#86868b] mb-2.5 opacity-80" />
              <p className="text-xs text-white font-medium">
                {file ? file.name : 'Select CSV file from device'}
              </p>
              <p className="text-[11px] text-[#86868b] mt-1">
                Supports all standard bank statement formats.
              </p>
            </div>

            <div className="flex gap-2.5 justify-end pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={handleClose}
                className="apple-press px-4 py-2 text-xs font-normal text-[#86868b] hover:text-white rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="apple-press px-5 py-2 rounded-full text-white text-xs font-medium bg-[#0066cc] hover:bg-[#0071e3] transition-colors disabled:opacity-40"
              >
                {loading ? 'Ingesting...' : 'Import Statement'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CSVMappingModal
        isOpen={showMappingModal}
        headers={csvHeaders}
        onConfirm={handleConfirmMapping}
        onClose={() => setShowMappingModal(false)}
      />
    </>
  );
};
