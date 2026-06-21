import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import LocalizedDatePicker from '../components/LocalizedDatePicker';
import type { FitdaysRecord } from '../lib/api';
import { formatDate, formatDateTime } from '../lib/i18n';
import { 
  Loader2, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  X,
  Scale,
  Activity,
  Dumbbell,
  Heart,
  Droplet,
  UserCheck,
  Trash2,
  AlertTriangle,
  Paperclip,
  FileUp,
  ExternalLink,
  Share2,
  Copy,
  Check
} from 'lucide-react';

export default function History({ onLinksUpdated }: { onLinksUpdated?: (count: number) => void } = {}) {
  const { t, i18n } = useTranslation();
  const [records, setRecords] = useState<FitdaysRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Report attachment states
  const [activeMenuRecordId, setActiveMenuRecordId] = useState<number | null>(null);
  const [uploadRecordId, setUploadRecordId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuRecordId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);
  
  // Table search and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof FitdaysRecord>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Drawer state
  const [selectedRecord, setSelectedRecord] = useState<FitdaysRecord | null>(null);

  // Deletion States
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [idsToDelete, setIdsToDelete] = useState<number[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<{ success: boolean; title?: string; message: string } | null>(null);

  // Share Modal States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareDescription, setShareDescription] = useState('');
  const [sharePassword, setSharePassword] = useState('');
  const [shareIncludeAttachments, setShareIncludeAttachments] = useState(true);
  const [shareExpiration, setShareExpiration] = useState<'never' | '1d' | '7d' | '30d' | 'custom'>('never');
  const [shareCustomExpiryDate, setShareCustomExpiryDate] = useState('');
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [createdShareLink, setCreatedShareLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCreateShareSubmit = async () => {
    if (!shareDescription.trim()) {
      setShareError(t('common.required'));
      return;
    }
    
    try {
      setIsCreatingShare(true);
      setShareError(null);
      
      let expires_at: string | null = null;
      if (shareExpiration === '1d') {
        expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      } else if (shareExpiration === '7d') {
        expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (shareExpiration === '30d') {
        expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (shareExpiration === 'custom' && shareCustomExpiryDate) {
        expires_at = new Date(shareCustomExpiryDate + 'T23:59:59').toISOString();
      }
      
      const response = await api.createSharedLink(
        shareDescription,
        sharePassword || null,
        shareIncludeAttachments,
        expires_at,
        selectedIds
      );

      if (onLinksUpdated) {
        try {
          const links = await api.getSharedLinks();
          const activeCount = links.filter(l => !l.expires_at || new Date(l.expires_at) > new Date()).length;
          onLinksUpdated(activeCount);
        } catch (err) {
          console.error("Failed to update active link count:", err);
        }
      }
      
      const linkUrl = `${window.location.origin}/shared/${response.token}`;
      setCreatedShareLink(linkUrl);
      
      // Auto-copy to clipboard
      try {
        await navigator.clipboard.writeText(linkUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Clipboard copy failed:", err);
      }
      
    } catch (err: any) {
      setShareError(err.message || t('sharing.limitError'));
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    setShareDescription('');
    setSharePassword('');
    setShareIncludeAttachments(true);
    setShareExpiration('never');
    setShareCustomExpiryDate('');
    setCreatedShareLink(null);
    setShareError(null);
    setIsCopied(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      const res = await api.deleteRecords(idsToDelete);
      
      const successCount = res.deleted.length;
      const failCount = res.failed.length;
      
      if (successCount > 0) {
        setRecords(prev => prev.filter(r => !res.deleted.includes(r.id)));
        setSelectedIds(prev => prev.filter(id => !res.deleted.includes(id)));
      }
      
      if (failCount === 0) {
        setDeleteFeedback({
          success: true,
          message: `${successCount} record${successCount > 1 ? 's' : ''} deleted successfully.`
        });
      } else {
        const failReasons = res.failed.map(f => `ID ${f.id}: ${f.reason}`).join('\n');
        setDeleteFeedback({
          success: false,
          message: `${successCount} deleted, ${failCount} failed.\nFailures:\n${failReasons}`
        });
      }
      
      setIsDeleteConfirmOpen(false);
      setIdsToDelete([]);
    } catch (err: any) {
      setDeleteFeedback({
        success: false,
        message: err.message || 'An error occurred during deletion.'
      });
      setIsDeleteConfirmOpen(false);
      setIdsToDelete([]);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setUploadError(null);
    const ALLOWED_TYPES = ["image/png", "image/jpeg", "application/pdf"];
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(t('history.report.pdfOnly'));
      setSelectedFile(null);
      return;
    }
    
    if (file.size > MAX_SIZE) {
      setUploadError(t('history.report.exceedsSize'));
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!uploadRecordId || !selectedFile) return;
    
    try {
      setUploadProgress(t('history.report.uploading'));
      setUploadError(null);
      const newReport = await api.uploadReport(uploadRecordId, selectedFile);
      
      setRecords(prev => prev.map(r => {
        if (r.id === uploadRecordId) {
          return { ...r, report: newReport };
        }
        return r;
      }));
      
      setDeleteFeedback({
        success: true,
        title: "Upload Successful",
        message: "Report uploaded successfully."
      });
      
      setUploadRecordId(null);
      setSelectedFile(null);
      setUploadProgress(null);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload report.");
      setUploadProgress(null);
    }
  };

  const handleDeleteReport = async (recordId: number) => {
    if (!confirm("Are you sure you want to delete this attached report?")) return;
    try {
      await api.deleteReport(recordId);
      setRecords(prev => prev.map(r => {
        if (r.id === recordId) {
          return { ...r, report: null };
        }
        return r;
      }));
      setDeleteFeedback({
        success: true,
        title: "Deletion Successful",
        message: "Report deleted successfully."
      });
    } catch (err: any) {
      setDeleteFeedback({
        success: false,
        title: "Deletion Failed",
        message: err.message || "Failed to delete report."
      });
    }
  };


  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setIsLoading(true);
        const data = await api.getRecords();
        setRecords(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load records');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const handleSort = (field: keyof FitdaysRecord) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending
    }
  };

  const getSortedRecords = () => {
    return [...records]
      .filter(record => {
        const formattedDate = formatDate(record.date).toLowerCase();
        return formattedDate.includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        // Handle date comparison
        if (sortField === 'date') {
          valA = new Date(a.date).getTime();
          valB = new Date(b.date).getTime();
        }

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  };

  const renderSortIcon = (field: keyof FitdaysRecord) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1 text-primary" />
    );
  };

  const formatSegmentValue = (value: number | null | undefined, unit: string = '') => {
    if (value === null || value === undefined) return '-';
    return `${value.toFixed(2)}${unit}`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">{t('history.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="bg-destructive/10 border border-destructive/25 text-destructive p-4 rounded-xl flex items-center gap-3">
          <X className="h-5 w-5 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">{t('history.errorTitle')}</h3>
            <p className="text-xs opacity-90">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedRecords = getSortedRecords();

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground m-0">{t('history.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('history.subtitle')}
        </p>
      </div>

      {/* Delete Feedback Alert */}
      {deleteFeedback && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top duration-300 ${
          deleteFeedback.success 
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300' 
            : 'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-300'
        }`}>
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{deleteFeedback.title || (deleteFeedback.success ? 'Deletion Successful' : 'Deletion Warning / Error')}</p>
            <p className="text-xs opacity-90 mt-0.5 whitespace-pre-line">{deleteFeedback.message}</p>
          </div>
          <button 
            onClick={() => setDeleteFeedback(null)}
            className="p-1 rounded-md hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-muted-foreground flex items-center pointer-events-none" />
            <input
              type="text"
              placeholder={t('history.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground transition-all"
            />
          </div>
          {selectedIds.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIdsToDelete(selectedIds);
                  setIsDeleteConfirmOpen(true);
                }}
                className="flex items-center justify-center bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg transition-all cursor-pointer shadow-sm animate-in fade-in zoom-in-95 duration-250 shrink-0"
                style={{ height: '38px', width: '38px' }}
                title={t('history.deleteSelected', { count: selectedIds.length })}
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg transition-all cursor-pointer shadow-sm animate-in fade-in zoom-in-95 duration-250 shrink-0"
                style={{ height: '38px', width: '38px' }}
                title={t('sharing.shareButton')}
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-medium self-end sm:self-center">
          {t('history.showingRecords', { count: sortedRecords.length, total: records.length }) || `Showing ${sortedRecords.length} of ${records.length} records`}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {sortedRecords.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {t('history.noMatch') || 'No measurements match your criteria.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-foreground">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold text-xs tracking-wider uppercase">
                <tr>
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={
                        sortedRecords.length > 0 &&
                        sortedRecords.every((r) => selectedIds.includes(r.id))
                      }
                      onChange={() => {
                        const pageIds = sortedRecords.map((r) => r.id);
                        const allSelected = pageIds.every((id) => selectedIds.includes(id));
                        if (allSelected) {
                          setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                        } else {
                          setSelectedIds((prev) => {
                            const next = [...prev];
                            pageIds.forEach((id) => {
                              if (!next.includes(id)) next.push(id);
                            });
                            return next;
                          });
                        }
                      }}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-card cursor-pointer"
                    />
                  </th>
                  <th 
                    onClick={() => handleSort('date')}
                    className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  >
                    {t('history.table.date')} {renderSortIcon('date')}
                  </th>
                  <th 
                    onClick={() => handleSort('weight')}
                    className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  >
                    {t('history.table.weight')} (kg) {renderSortIcon('weight')}
                  </th>
                  <th 
                    onClick={() => handleSort('bmi')}
                    className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  >
                    {t('history.table.bmi')} {renderSortIcon('bmi')}
                  </th>
                  <th 
                    onClick={() => handleSort('body_fat_pct')}
                    className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  >
                    {t('history.table.bodyFat')} (%) {renderSortIcon('body_fat_pct')}
                  </th>
                  <th 
                    onClick={() => handleSort('skeletal_muscle_mass')}
                    className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  >
                    {t('history.table.skeletalMuscle')} (kg) {renderSortIcon('skeletal_muscle_mass')}
                  </th>
                  <th 
                    onClick={() => handleSort('body_score')}
                    className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  >
                    {t('history.table.bodyScore') || 'Body Score'} {renderSortIcon('body_score')}
                  </th>
                  <th className="px-6 py-4 text-right">{t('history.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedRecords.map(record => (
                  <tr 
                    key={record.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-4 text-center whitespace-nowrap w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(record.id)}
                        onChange={() => {
                          setSelectedIds((prev) =>
                            prev.includes(record.id)
                              ? prev.filter((id) => id !== record.id)
                              : [...prev, record.id]
                          );
                        }}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-card cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>
                          {formatDateTime(record.date, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuRecordId(activeMenuRecordId === record.id ? null : record.id);
                            }}
                            className={`p-1 rounded-md transition-colors hover:bg-muted cursor-pointer ${
                              record.report 
                                ? 'text-primary' 
                                : 'text-muted-foreground/35 hover:text-muted-foreground'
                            }`}
                            title={record.report ? "Report attached" : "No report attached"}
                            aria-label={record.report ? "report attached" : "no report attached"}
                          >
                            <Paperclip className="h-4 w-4" />
                          </button>
                          
                          {activeMenuRecordId === record.id && (
                            <div 
                              className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-in fade-in slide-in-from-top-1 duration-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="py-1" role="menu" aria-orientation="vertical">
                                {record.report ? (
                                  <>
                                    <a
                                      href={record.report.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer w-full text-left"
                                      role="menuitem"
                                      onClick={() => setActiveMenuRecordId(null)}
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                      <span>{t('history.report.view')}</span>
                                    </a>
                                    <button
                                      onClick={() => {
                                        setActiveMenuRecordId(null);
                                        setUploadRecordId(record.id);
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer w-full text-left"
                                      role="menuitem"
                                    >
                                      <FileUp className="h-3.5 w-3.5" />
                                      <span>{t('history.report.upload')}</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveMenuRecordId(null);
                                        handleDeleteReport(record.id);
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer w-full text-left"
                                      role="menuitem"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span>{t('history.report.delete')}</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setActiveMenuRecordId(null);
                                      setUploadRecordId(record.id);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer w-full text-left"
                                    role="menuitem"
                                  >
                                    <FileUp className="h-3.5 w-3.5" />
                                    <span>{t('history.report.upload')}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.weight.toFixed(1)} kg</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.bmi.toFixed(1)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.body_fat_pct.toFixed(1)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.skeletal_muscle_mass.toFixed(1)} kg</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        record.body_score >= 80 
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      }`}>
                        {record.body_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="inline-flex items-center p-1.5 rounded-lg border border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
                          title={t('history.drawer.reportTitle')}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setIdsToDelete([record.id]);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="inline-flex items-center p-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors cursor-pointer"
                          title="Delete measurement"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Side Sheet/Drawer (Radix-like custom markup) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setSelectedRecord(null)}
          />

          {/* Sheet Body */}
          <div className="relative w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 z-10">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h3 className="text-xl font-bold text-foreground">{t('history.drawer.reportTitle') || 'Body Composition Report'}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('history.drawer.scanDate') || 'Scan date:'}{' '}
                  <span className="font-semibold text-foreground">
                    {formatDateTime(selectedRecord.date, {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted border border-border"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Highlight Metrics Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/40 border border-border p-4 rounded-xl text-center space-y-1">
                  <div className="mx-auto h-7 w-7 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
                    <Scale className="h-4 w-4" />
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">{t('dashboard.weight')}</p>
                  <p className="text-lg font-bold">{selectedRecord.weight.toFixed(1)} kg</p>
                </div>
                
                <div className="bg-muted/40 border border-border p-4 rounded-xl text-center space-y-1">
                  <div className="mx-auto h-7 w-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Activity className="h-4 w-4" />
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">{t('dashboard.bodyFat')}</p>
                  <p className="text-lg font-bold">{selectedRecord.body_fat_pct.toFixed(1)}%</p>
                </div>

                <div className="bg-muted/40 border border-border p-4 rounded-xl text-center space-y-1">
                  <div className="mx-auto h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">{t('history.table.skeletalMuscle')}</p>
                  <p className="text-lg font-bold">{selectedRecord.skeletal_muscle_mass.toFixed(1)} kg</p>
                </div>
              </div>

              {/* Core Health Indicators */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span>{t('history.drawer.coreIndicators')}</span>
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.bmi')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.bmi.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.bodyScore')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.body_score} / 100</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.metabolicAge')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.metabolic_age.toFixed(0)} yrs</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.bmr')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.bmr.toFixed(0)} kcal</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.obesityScore')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.obesity_score}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.fatFreeMass')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.fat_free_mass.toFixed(1)} kg</span>
                  </div>
                </div>
              </div>

              {/* Fat & Fluids breakdown */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-sky-500" />
                  <span>{t('history.drawer.adiposityHydration')}</span>
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.subcutaneousFat')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.subcutaneous_fat_pct.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.visceralFatLevel')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.visceral_fat}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.fatMass')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.fat_mass.toFixed(1)} kg</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.bodyWaterPct')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.body_water_pct.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.moistureContent')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.moisture_content.toFixed(1)} kg</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.proteinPct')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.protein_pct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Cardiovascular & Musculoskeletal */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span>{t('history.drawer.cardiorespiratoryMusculoskeletal')}</span>
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.heartRate')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.heart_rate || '-'} bpm</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.heartIndex')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.heart_index || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.boneMass')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.bone_mass.toFixed(2)} kg</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.skeletalMusclePct')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.skeletal_muscle_mass_pct.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.skeletalMuscleMass')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.skeletal_muscle_mass.toFixed(1)} kg</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.smi')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.smi || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.muscleRatePct')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.muscle_rate_pct.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{t('history.drawer.totalMuscleMass')}</span>
                    <span className="text-sm font-semibold">{selectedRecord.muscle_mass.toFixed(1)} kg</span>
                  </div>
                </div>
              </div>

              {/* Segmental Body Composition (Right Arm, Left Arm, Trunk, Right Leg, Left Leg) */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-foreground px-1">{t('history.drawer.segmentalTitle')}</h4>
                
                <div className="space-y-3">
                  {[
                    { title: t('history.drawer.segments.rightArm'), prefix: 'right_arm' },
                    { title: t('history.drawer.segments.leftArm'), prefix: 'left_arm' },
                    { title: t('history.drawer.segments.trunk'), prefix: 'trunk' },
                    { title: t('history.drawer.segments.rightLeg'), prefix: 'right_leg' },
                    { title: t('history.drawer.segments.leftLeg'), prefix: 'left_leg' }
                  ].map(segment => {
                    const fatMass = selectedRecord[`${segment.prefix}_fat_mass` as keyof FitdaysRecord] as number | null;
                    const fatPct = selectedRecord[`${segment.prefix}_fat_pct` as keyof FitdaysRecord] as number | null;
                    const fatLevel = selectedRecord[`${segment.prefix}_fat_level` as keyof FitdaysRecord] as string | null;
                    
                    const musMass = selectedRecord[`${segment.prefix}_muscle_mass` as keyof FitdaysRecord] as number | null;
                    const musPct = selectedRecord[`${segment.prefix}_muscle_pct` as keyof FitdaysRecord] as number | null;
                    const musLevel = selectedRecord[`${segment.prefix}_muscle_level` as keyof FitdaysRecord] as string | null;

                    const impHigh = selectedRecord[`${segment.prefix}_impedance_high` as keyof FitdaysRecord] as number | null;
                    const impLow = selectedRecord[`${segment.prefix}_impedance_low` as keyof FitdaysRecord] as number | null;

                    // Skip displaying segment if fatMass is completely missing (some hardware doesn't do 8-electrode segmental scan)
                    if (fatMass === null) return null;

                    return (
                      <div key={segment.prefix} className="bg-card border border-border rounded-xl p-4 space-y-3">
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider block">{segment.title}</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          
                          {/* Segment Fat */}
                          <div className="bg-muted/30 border border-border p-2 rounded-lg text-center">
                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold">{t('history.drawer.fatMass')}</span>
                            <span className="text-xs font-bold text-rose-500">{formatSegmentValue(fatMass, ' kg')}</span>
                            <span className="block text-[9px] text-muted-foreground mt-0.5">{formatSegmentValue(fatPct, '%')} ({fatLevel || t('history.drawer.normal')})</span>
                          </div>

                          {/* Segment Muscle */}
                          <div className="bg-muted/30 border border-border p-2 rounded-lg text-center">
                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold">{t('history.drawer.muscleMass')}</span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatSegmentValue(musMass, ' kg')}</span>
                            <span className="block text-[9px] text-muted-foreground mt-0.5">{formatSegmentValue(musPct, '%')} ({musLevel || t('history.drawer.normal')})</span>
                          </div>

                          {/* Impedance High */}
                          <div className="bg-muted/30 border border-border p-2 rounded-lg text-center flex flex-col justify-center">
                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold">{t('history.drawer.impedanceH')}</span>
                            <span className="text-xs font-bold">{formatSegmentValue(impHigh, ' Ω')}</span>
                          </div>

                          {/* Impedance Low */}
                          <div className="bg-muted/30 border border-border p-2 rounded-lg text-center flex flex-col justify-center">
                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold">{t('history.drawer.impedanceL')}</span>
                            <span className="text-xs font-bold">{formatSegmentValue(impLow, ' Ω')}</span>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={() => !isDeleting && setIsDeleteConfirmOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-250 z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{t('history.deletePrompt.title')}</h3>
                <p className="text-xs text-muted-foreground">{t('history.deletePrompt.confirmSubtitle') || "This action cannot be undone"}</p>
              </div>
            </div>

            <p className="text-sm text-foreground">
              {idsToDelete.length === 1 ? (
                t('history.deletePrompt.confirmSingle')
              ) : (
                t('history.deletePrompt.confirmMultiple', { count: idsToDelete.length })
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setIdsToDelete([]);
                }}
                className="px-4 py-2 bg-card border border-border hover:bg-muted text-sm font-semibold rounded-lg text-foreground transition-colors cursor-pointer disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('history.deleting')}</span>
                  </>
                ) : (
                  <span>{t('history.deletePrompt.deleteBtn')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Report Modal */}
      {uploadRecordId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={() => !uploadProgress && setUploadRecordId(null)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-250 z-10">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">{t('history.report.modalTitle')}</h3>
              <button
                disabled={!!uploadProgress}
                onClick={() => {
                  setUploadRecordId(null);
                  setSelectedFile(null);
                  setUploadError(null);
                }}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                isDragActive 
                  ? 'border-primary bg-primary/5 scale-[0.99]' 
                  : 'border-border hover:border-primary/50 bg-muted/20'
              }`}
              onClick={() => document.getElementById('report-file-input')?.click()}
            >
              <input
                id="report-file-input"
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
                onChange={handleFileChange}
                disabled={!!uploadProgress}
              />
              
              <FileUp className={`h-10 w-10 transition-colors ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {t('history.report.dragDrop')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('history.report.browseDevice')}
                </p>
              </div>
              
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {t('history.report.allowedTypes')}
              </p>
            </div>

            {/* File Info */}
            {selectedFile && (
              <div className="p-3 bg-muted/40 border border-border rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Paperclip className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold truncate text-foreground">{selectedFile.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  disabled={!!uploadProgress}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Error Message */}
            {uploadError && (
              <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={!!uploadProgress}
                onClick={() => {
                  setUploadRecordId(null);
                  setSelectedFile(null);
                  setUploadError(null);
                }}
                className="px-4 py-2 bg-card border border-border hover:bg-muted text-sm font-semibold rounded-lg text-foreground transition-colors cursor-pointer disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                disabled={!selectedFile || !!uploadProgress}
                onClick={handleUploadSubmit}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploadProgress ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{uploadProgress}</span>
                  </>
                ) : (
                  <span>{t('history.report.upload')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Share Link Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={handleCloseShareModal}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl flex flex-col p-6 overflow-hidden animate-in zoom-in-95 duration-200 z-10 text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-xl font-bold tracking-tight m-0">{t('sharing.modalTitle')}</h2>
              <button
                disabled={isCreatingShare}
                onClick={handleCloseShareModal}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!createdShareLink ? (
              <div className="space-y-4">
                {/* Warning Alert */}
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2 leading-relaxed">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{t('sharing.warningDataPrivacy')}</span>
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5" htmlFor="share-desc">
                    {t('sharing.descriptionLabel')} <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="share-desc"
                    type="text"
                    required
                    placeholder={t('sharing.descriptionPlaceholder')}
                    value={shareDescription}
                    onChange={e => setShareDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground transition-all"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5" htmlFor="share-pwd">
                    {t('sharing.passwordLabel')}
                  </label>
                  <input
                    id="share-pwd"
                    type="password"
                    placeholder={t('sharing.passwordPlaceholder')}
                    value={sharePassword}
                    onChange={e => setSharePassword(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground transition-all"
                  />
                </div>

                {/* Attachments Toggle */}
                <div className="flex items-center justify-between py-2 border-y border-border">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{t('sharing.includeAttachmentsLabel')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={shareIncludeAttachments}
                    onChange={e => setShareIncludeAttachments(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-card cursor-pointer"
                  />
                </div>

                {/* Expiry Selector */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {t('sharing.expiresLabel')}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {(['never', '1d', '7d', '30d', 'custom'] as const).map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setShareExpiration(option)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                          shareExpiration === option
                            ? 'bg-primary border-primary text-primary-foreground shadow-xs'
                            : 'bg-card border-border hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        {t(`sharing.expires${option.charAt(0).toUpperCase() + option.slice(1)}` as any) || option}
                      </button>
                    ))}
                  </div>

                  {shareExpiration === 'custom' && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <LocalizedDatePicker
                        lang={i18n.language}
                        min={new Date().toISOString().split('T')[0]}
                        value={shareCustomExpiryDate}
                        onChange={setShareCustomExpiryDate}
                      />
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {shareError && (
                  <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{shareError}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    disabled={isCreatingShare}
                    onClick={handleCloseShareModal}
                    className="px-4 py-2 bg-card border border-border hover:bg-muted text-sm font-semibold rounded-lg text-foreground transition-colors cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    disabled={isCreatingShare}
                    onClick={handleCreateShareSubmit}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingShare ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t('common.loading')}</span>
                      </>
                    ) : (
                      <span>{t('sharing.shareButton')}</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-sm font-semibold text-center animate-pulse">
                  {t('sharing.createSuccess')}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {t('sharing.copied')}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdShareLink}
                      className="flex-1 px-3 py-2 bg-muted/40 border border-border rounded-lg text-sm text-foreground focus:outline-none"
                      onClick={e => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={async () => {
                        if (createdShareLink) {
                          await navigator.clipboard.writeText(createdShareLink);
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 2000);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span>{isCopied ? t('common.success') : t('sharing.copiedBtn')}</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleCloseShareModal}
                    className="px-4 py-2 bg-card border border-border hover:bg-muted text-sm font-semibold rounded-lg text-foreground transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
