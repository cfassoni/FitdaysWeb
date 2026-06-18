import { useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { api } from '../lib/api';
import type { UploadResponse } from '../lib/api';
import { 
  Upload, 
  File, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Database,
  RefreshCw,
  Plus
} from 'lucide-react';

interface ImportProps {
  onImportSuccess: () => void;
}

export default function Import({ onImportSuccess }: ImportProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      // Basic check for CSV
      if (droppedFile.name.endsWith('.csv') || droppedFile.type === 'text/csv') {
        setFile(droppedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Please drop a valid CSV file');
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv') || selectedFile.type === 'text/csv') {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Please select a valid CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setError(null);
    setIsUploading(true);
    setResult(null);

    try {
      const response = await api.uploadCSV(file);
      setResult(response);
      setFile(null); // Reset file selection
    } catch (err: any) {
      setError(err.message || 'Failed to upload and parse file');
    } finally {
      setIsUploading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground m-0">Import Fitdays CSV</h1>
        <p className="text-sm text-muted-foreground">
          Upload your exported CSV file from the Fitdays app to update your progress dashboard.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/25 text-destructive rounded-xl text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-semibold block">Import Failed</span>
            <span className="text-xs opacity-90">{error}</span>
          </div>
        </div>
      )}

      {/* Upload layout */}
      {!result ? (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6">
          <h3 className="text-lg font-bold text-foreground mb-1">Select File</h3>

          {/* Dotted drag zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all min-h-[260px] relative ${
              dragActive 
                ? 'border-primary bg-primary/5 scale-[0.99]' 
                : 'border-border bg-muted/20 hover:border-muted-foreground/30 hover:bg-muted/30'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Upload className="h-6 w-6" />
            </div>
            
            <p className="text-sm font-semibold mb-1">
              Drag & drop your CSV file here, or <span className="text-primary hover:underline cursor-pointer">browse</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Only standard Fitdays CSV reports are supported.
            </p>
          </div>

          {/* File Selected Card */}
          {file && (
            <div className="bg-muted/40 border border-border rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                  <File className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
              </div>
              
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Upload & Parse</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Upload Success Summary Card */
        <div className="bg-card border border-border rounded-2xl p-8 shadow-md flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-foreground">Import Completed!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your Fitdays file was parsed and processed successfully.
            </p>
          </div>

          {/* Stats Breakdown Grid */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-md bg-muted/30 border border-border p-4 rounded-xl">
            <div className="text-center space-y-1">
              <div className="mx-auto h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Database className="h-4 w-4" />
              </div>
              <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Processed</span>
              <span className="text-base font-bold">{result.total_processed}</span>
            </div>

            <div className="text-center space-y-1 border-x border-border">
              <div className="mx-auto h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Inserted</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{result.inserted}</span>
            </div>

            <div className="text-center space-y-1">
              <div className="mx-auto h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <RefreshCw className="h-4 w-4" />
              </div>
              <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Updated</span>
              <span className="text-base font-bold text-amber-600 dark:text-amber-500">{result.updated}</span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex gap-3">
            <button
              onClick={() => setResult(null)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Upload Another File
            </button>
            <button
              onClick={onImportSuccess}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs rounded-lg transition-colors shadow-md shadow-primary/10 cursor-pointer"
            >
              <span>View Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
