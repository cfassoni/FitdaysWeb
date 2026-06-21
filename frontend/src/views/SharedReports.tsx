import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import LocalizedDatePicker from '../components/LocalizedDatePicker';
import type { SharedLink } from '../lib/api';
import { formatDate } from '../lib/i18n';
import {
  Loader2,
  Trash2,
  Edit,
  Copy,
  Check,
  Lock,
  Unlock,
  AlertTriangle,
  Link as LinkIcon,
  X
} from 'lucide-react';

interface SharedReportsProps {
  onLinksUpdated?: (count: number) => void;
}

export default function SharedReports({ onLinksUpdated }: SharedReportsProps) {
  const { t, i18n } = useTranslation();
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Copy states
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Edit Modal States
  const [editingLink, setEditingLink] = useState<SharedLink | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editExpiration, setEditExpiration] = useState<'never' | '1d' | '7d' | '30d' | 'custom'>('never');
  const [editCustomExpiryDate, setEditCustomExpiryDate] = useState('');
  const [editPasswordAction, setEditPasswordAction] = useState<'keep' | 'clear' | 'change'>('keep');
  const [editPassword, setEditPassword] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Revoke States
  const [linkToRevoke, setLinkToRevoke] = useState<SharedLink | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const activeCount = links.filter(l => !l.expires_at || new Date(l.expires_at) > new Date()).length;

  const fetchLinks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getSharedLinks();
      setLinks(data);
      if (onLinksUpdated) {
        // Only active links count (expires_at is null or in the future)
        const activeCount = data.filter(l => !l.expires_at || new Date(l.expires_at) > new Date()).length;
        onLinksUpdated(activeCount);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load shared links");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => { await fetchLinks(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyLink = async (link: SharedLink) => {
    const linkUrl = `${window.location.origin}/shared/${link.token}`;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopiedLinkId(link.id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleOpenEditModal = (link: SharedLink) => {
    setEditingLink(link);
    setEditDescription(link.description);
    
    // Determine expiration preset
    if (!link.expires_at) {
      setEditExpiration('never');
      setEditCustomExpiryDate('');
    } else {
      const expiryDate = new Date(link.expires_at);
      const diffMs = expiryDate.getTime() - Date.now();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        setEditExpiration('1d');
        setEditCustomExpiryDate('');
      } else if (diffDays === 7) {
        setEditExpiration('7d');
        setEditCustomExpiryDate('');
      } else if (diffDays === 30) {
        setEditExpiration('30d');
        setEditCustomExpiryDate('');
      } else {
        setEditExpiration('custom');
        setEditCustomExpiryDate(expiryDate.toISOString().split('T')[0]);
      }
    }
    
    setEditPasswordAction('keep');
    setEditPassword('');
    setEditError(null);
  };

  const handleCloseEditModal = () => {
    setEditingLink(null);
    setEditError(null);
  };

  const handleSaveEditSubmit = async () => {
    if (!editingLink) return;
    if (!editDescription.trim()) {
      setEditError(t('common.required'));
      return;
    }
    
    try {
      setIsSavingEdit(true);
      setEditError(null);
      
      let expires_at: string | null = editingLink.expires_at;
      if (editExpiration === 'never') {
        expires_at = null;
      } else if (editExpiration === '1d') {
        expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      } else if (editExpiration === '7d') {
        expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (editExpiration === '30d') {
        expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (editExpiration === 'custom' && editCustomExpiryDate) {
        expires_at = new Date(editCustomExpiryDate + 'T23:59:59').toISOString();
      }
      
      const payload: any = {
        description: editDescription,
        expires_at
      };
      
      if (editPasswordAction === 'clear') {
        payload.password = null;
      } else if (editPasswordAction === 'change') {
        payload.password = editPassword || null;
      }
      
      const updated = await api.updateSharedLink(editingLink.id, payload);
      const nextLinks = links.map(l => (l.id === updated.id ? updated : l));
      setLinks(nextLinks);
      setEditingLink(null);
      
      if (onLinksUpdated) {
        const activeCount = nextLinks.filter(l => !l.expires_at || new Date(l.expires_at) > new Date()).length;
        onLinksUpdated(activeCount);
      }
      
    } catch (err: any) {
      setEditError(err.message || "Failed to update shared link");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!linkToRevoke) return;
    
    try {
      setIsRevoking(true);
      setError(null);
      await api.deleteSharedLink(linkToRevoke.id);
      
      const nextLinks = links.filter(l => l.id !== linkToRevoke.id);
      setLinks(nextLinks);
      setLinkToRevoke(null);
      
      if (onLinksUpdated) {
        const activeCount = nextLinks.filter(l => !l.expires_at || new Date(l.expires_at) > new Date()).length;
        onLinksUpdated(activeCount);
      }
    } catch (err: any) {
      setError(err.message || "Failed to revoke shared link");
    } finally {
      setIsRevoking(false);
    }
  };

  // Helper to determine if a link is currently active
  const isLinkActive = (link: SharedLink) => {
    if (!link.expires_at) return true;
    return new Date(link.expires_at) > new Date();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground m-0">{t('sharing.title')}</h1>
          <p className="text-sm text-muted-foreground">
            Manage shared guest access links for doctors, nutritionists, or coaches
          </p>
        </div>
        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 self-start sm:self-center">
          {t('sharing.limitCounter', { count: activeCount })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-destructive/25 bg-destructive/10 text-destructive text-sm flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main List */}
      {links.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-xs">
          <LinkIcon className="h-12 w-12 text-muted-foreground/35 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-1">No reports shared yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {t('sharing.emptyState')} Go to the Detailed History view, select one or more scans, and click Share.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-foreground">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold text-xs tracking-wider uppercase">
                <tr>
                  <th className="px-6 py-4">{t('sharing.colDescription')}</th>
                  <th className="px-6 py-4">{t('sharing.colSecurity')}</th>
                  <th className="px-6 py-4">{t('sharing.colSharedItems')}</th>
                  <th className="px-6 py-4">{t('sharing.colCreatedAt')}</th>
                  <th className="px-6 py-4">{t('sharing.colExpiry')}</th>
                  <th className="px-6 py-4">{t('sharing.colActivity')}</th>
                  <th className="px-6 py-4 text-right">{t('sharing.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {links.map(link => {
                  const active = isLinkActive(link);
                  return (
                    <tr key={link.id} className={`hover:bg-muted/15 transition-colors ${!active ? 'opacity-55' : ''}`}>
                      <td className="px-6 py-4 font-medium whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground font-semibold">{link.description}</span>
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-xs">{link.token}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold">
                          {link.has_password ? (
                            <>
                              <Lock className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-amber-500">{t('sharing.securityPassword')}</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="h-3.5 w-3.5 text-muted-foreground/50" />
                              <span className="text-muted-foreground">{t('sharing.securityOpen')}</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {link.entry_count} records {link.include_attachments && ' + files'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {formatDate(link.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {link.expires_at ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-muted-foreground">{formatDate(link.expires_at)}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-primary' : 'text-destructive'}`}>
                              {active ? t('sharing.expiryStatus.active') : t('sharing.expiryStatus.expired')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">{t('sharing.expiryStatus.never')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground font-semibold text-xs">
                            {t('sharing.accessCount', { count: link.access_count })}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {link.last_accessed_at
                              ? t('sharing.lastAccessLabel', { date: formatDate(link.last_accessed_at) })
                              : t('sharing.neverAccessed')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyLink(link)}
                            className="inline-flex items-center p-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title={t('sharing.copiedBtn')}
                          >
                            {copiedLinkId === link.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(link)}
                            className="inline-flex items-center p-1.5 rounded-lg border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Edit share link details"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setLinkToRevoke(link)}
                            className="inline-flex items-center p-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors cursor-pointer"
                            title="Revoke shared link immediately"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Shared Link Modal */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={handleCloseEditModal} />
          <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl flex flex-col p-6 overflow-hidden z-10 text-foreground">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-xl font-bold tracking-tight m-0">Edit Shared Report</h2>
              <button onClick={handleCloseEditModal} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t('sharing.descriptionLabel')} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Password Management */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Password Security
                </label>
                <div className="flex flex-col sm:flex-row gap-3 bg-muted/20 p-3 rounded-lg border border-border mb-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="pwd-action"
                      checked={editPasswordAction === 'keep'}
                      onChange={() => setEditPasswordAction('keep')}
                      className="text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <span>Keep Current Password (if any)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="pwd-action"
                      checked={editPasswordAction === 'clear'}
                      onChange={() => setEditPasswordAction('clear')}
                      className="text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <span>Remove Password</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="pwd-action"
                      checked={editPasswordAction === 'change'}
                      onChange={() => setEditPasswordAction('change')}
                      className="text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <span>Change/Set Password</span>
                  </label>
                </div>

                {editPasswordAction === 'change' && (
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all animate-in fade-in slide-in-from-top-1"
                  />
                )}
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('sharing.expiresLabel')}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(['never', '1d', '7d', '30d', 'custom'] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setEditExpiration(option)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                        editExpiration === option
                          ? 'bg-primary border-primary text-primary-foreground shadow-xs'
                          : 'bg-card border-border hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {t(`sharing.expires${option.charAt(0).toUpperCase() + option.slice(1)}` as any) || option}
                    </button>
                  ))}
                </div>

                {editExpiration === 'custom' && (
                  <div className="mt-3">
                    <LocalizedDatePicker
                      lang={i18n.language}
                      min={new Date().toISOString().split('T')[0]}
                      value={editCustomExpiryDate}
                      onChange={setEditCustomExpiryDate}
                    />
                  </div>
                )}
              </div>

              {editError && (
                <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  disabled={isSavingEdit}
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 bg-card border border-border hover:bg-muted text-sm font-semibold rounded-lg text-foreground transition-colors cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  disabled={isSavingEdit}
                  onClick={handleSaveEditSubmit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t('common.loading')}</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirm Dialog Modal */}
      {linkToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setLinkToRevoke(null)} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 z-10 text-foreground">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground m-0">Revoke Shared Link</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('sharing.revokeConfirm')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={isRevoking}
                onClick={() => setLinkToRevoke(null)}
                className="px-4 py-2 bg-card border border-border hover:bg-muted text-sm font-semibold rounded-lg text-foreground transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                disabled={isRevoking}
                onClick={handleRevokeConfirm}
                className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isRevoking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('common.loading')}</span>
                  </>
                ) : (
                  <span>{t('sharing.revokeBtn')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
