import React, { useState } from 'react';
import api from '../../core/api';
import { Upload, X, CheckCircle, AlertTriangle } from 'lucide-react';

export const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setResult(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/transactions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload statement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-finpilot-card w-full max-w-md p-6 rounded-xl border border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
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
              onClick={onClose}
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
  );
};
