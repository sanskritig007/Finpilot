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
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
        <div className="bg-finpilot-card w-full max-w-md p-6 rounded-xl border border-slate-700 shadow-2xl relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-finpilot-muted hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <h3 className="text-xl font-bold text-white mb-6">Upload Bank Statement</h3>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-6 flex items-start gap-2.5 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded mb-6 text-sm space-y-2">
              <div className="flex items-center gap-2.5 font-semibold text-white">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>{result.message}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700/50 text-finpilot-muted">
                <div>Imported: <span className="text-white font-bold">{result.total_imported}</span></div>
                <div>Skipped (Dup): <span className="text-white font-bold">{result.duplicates_skipped}</span></div>
              </div>
            </div>
          )}

          {/* Column Mapping Summary */}
          {mappings && (
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 text-xs space-y-1 mb-6">
              <div className="flex justify-between items-center text-[10px] font-bold text-finpilot-primary uppercase tracking-wider">
                <span>✓ Mapped Columns Configured</span>
                <button 
                  type="button" 
                  onClick={() => setShowMappingModal(true)}
                  className="hover:underline text-white font-semibold flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-finpilot-muted mt-1.5">
                <div>Date: <span className="text-slate-200">{mappings.date}</span></div>
                <div>Desc: <span className="text-slate-200">{mappings.description}</span></div>
                {mappings.amount ? (
                  <div className="col-span-2">Amount: <span className="text-slate-200">{mappings.amount}</span></div>
                ) : (
                  <>
                    <div>Debit: <span className="text-slate-200">{mappings.debit}</span></div>
                    <div>Credit: <span className="text-slate-200">{mappings.credit}</span></div>
                  </>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-finpilot-primary transition-colors cursor-pointer relative bg-slate-800/30">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="mx-auto h-10 w-10 text-finpilot-muted mb-3" />
              <p className="text-sm text-white font-medium">
                {file ? file.name : 'Click to upload or drag & drop'}
              </p>
              <p className="text-xs text-finpilot-muted mt-1.5">
                Only CSV files are supported.
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-slate-700 text-finpilot-muted rounded-lg hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="px-5 py-2 rounded-lg text-white font-medium bg-finpilot-primary hover:bg-finpilot-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Import Data'}
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
