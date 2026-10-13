"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import type { UserIntegration, IntegrationProfile } from "@/lib/api";
import { formatDate } from "@/lib/i18n";
import {
  Link2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Scale,
  Smartphone,
  Trash2,
  X,
  User as UserIcon,
  Layers,
} from "lucide-react";

interface IntegrationsTabProps {
  onDataChanged?: () => void;
}

export default function IntegrationsTab({ onDataChanged }: IntegrationsTabProps) {
  const { t } = useTranslation();

  const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Connection form state
  const [fitdaysEmail, setFitdaysEmail] = useState("");
  const [fitdaysPassword, setFitdaysPassword] = useState("");
  const [fitdaysRegion, setFitdaysRegion] = useState("us");
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Profile binding state (after successful auth)
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [discoveredProfiles, setDiscoveredProfiles] = useState<IntegrationProfile[]>([]);
  const [selectedSuid, setSelectedSuid] = useState<number | null>(null);
  const [isBinding, setIsBinding] = useState(false);

  // Syncing state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFullSyncing, setIsFullSyncing] = useState(false);

  // Disconnect confirmation modal state
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Configuration toggle state
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

  const fetchIntegrations = useCallback(async () => {
    try {
      const data = await api.getIntegrations();
      setIntegrations(data);
    } catch (err: unknown) {
      console.error("Failed to load integrations:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // Modal Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDisconnectModal) setShowDisconnectModal(false);
        if (showProfileSelector) setShowProfileSelector(false);
      }
    };
    if (showDisconnectModal || showProfileSelector) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDisconnectModal, showProfileSelector]);

  const fitdaysIntegration = integrations.find((i) => i.provider === "fitdays");
  const isConnected = fitdaysIntegration && fitdaysIntegration.status === "connected";

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fitdaysEmail || !fitdaysPassword) return;

    setIsConnecting(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const res = await api.connectFitdays({
        email: fitdaysEmail,
        password: fitdaysPassword,
        region: fitdaysRegion,
      });

      // Clear password from form state immediately
      setFitdaysPassword("");

      if (res.profiles && res.profiles.length > 0) {
        setDiscoveredProfiles(res.profiles);
        setSelectedSuid(res.activeSuid || res.profiles[0].suid);
        setShowProfileSelector(true);
      } else {
        await fetchIntegrations();
        setFeedbackSuccess(t("profile.integrations.fitdays.syncSuccess", { inserted: 0, updated: 0 }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      setFeedbackError(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConfirmProfileBinding = async () => {
    if (selectedSuid === null) return;
    setIsBinding(true);
    setFeedbackError(null);

    try {
      const res = await api.selectFitdaysProfile(selectedSuid, true);
      setShowProfileSelector(false);
      await fetchIntegrations();

      setFeedbackSuccess(
        t("profile.integrations.fitdays.syncSuccess", {
          inserted: res.result.inserted,
          updated: res.result.updated,
        })
      );
      setTimeout(() => setFeedbackSuccess(null), 6000);

      if (onDataChanged) {
        onDataChanged();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      setFeedbackError(msg);
    } finally {
      setIsBinding(false);
    }
  };

  const handleSync = async (forceFull = false) => {
    if (isSyncing || isFullSyncing) return;
    if (forceFull) {
      setIsFullSyncing(true);
    } else {
      setIsSyncing(true);
    }
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const res = await api.syncFitdays(forceFull);
      await fetchIntegrations();

      setFeedbackSuccess(
        t("profile.integrations.fitdays.syncSuccess", {
          inserted: res.result.inserted,
          updated: res.result.updated,
        })
      );
      setTimeout(() => setFeedbackSuccess(null), 6000);

      if (onDataChanged) {
        onDataChanged();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      setFeedbackError(msg);
    } finally {
      setIsSyncing(false);
      setIsFullSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setFeedbackError(null);

    try {
      await api.disconnectFitdays();
      setShowDisconnectModal(false);
      await fetchIntegrations();
      setFeedbackSuccess(t("profile.integrations.fitdays.disconnectSuccess"));
      setTimeout(() => setFeedbackSuccess(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      setFeedbackError(msg);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleToggleSkipWeightOnly = async () => {
    if (!fitdaysIntegration || isUpdatingConfig) return;
    const currentVal = fitdaysIntegration.config.skipWeightOnly ?? true;
    setIsUpdatingConfig(true);

    try {
      await api.updateFitdaysConfig({ skipWeightOnly: !currentVal });
      await fetchIntegrations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      setFeedbackError(msg);
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  return (
    <div
      id="panel-integrations"
      role="tabpanel"
      aria-labelledby="tab-integrations"
      className="bg-card border border-border rounded-xl p-6 shadow-xs animate-in fade-in-50 duration-200"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Link2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {t("profile.integrations.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("profile.integrations.subtitle")}
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {feedbackSuccess && (
        <div className="mb-6 flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* Error Notification */}
      {feedbackError && (
        <div className="mb-6 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-lg text-xs animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{feedbackError}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs">{t("common.loading")}</span>
        </div>
      ) : isConnected && fitdaysIntegration ? (
        /* CONNECTED FITDAYS STATE */
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-border bg-muted/20 space-y-5">
            {/* Top row: Brand + Status badge */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-lg">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">
                    {t("profile.integrations.fitdays.title")}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {t("profile.integrations.fitdays.description")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold shrink-0">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t("profile.integrations.fitdays.statusConnected")}</span>
              </div>
            </div>

            {/* Account & Profile metadata grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-card border border-border rounded-lg">
                <span className="block text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  {t("profile.integrations.fitdays.connectedAccount")}
                </span>
                <span className="text-sm font-semibold text-foreground truncate block">
                  {fitdaysIntegration.accountIdentifier}
                </span>
              </div>

              <div className="p-3 bg-card border border-border rounded-lg">
                <span className="block text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  {t("profile.integrations.fitdays.boundProfile")}
                </span>
                <div className="flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground truncate">
                    {fitdaysIntegration.config.selectedProfileName ||
                      `Profile #${fitdaysIntegration.config.selectedSuid}`}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-card border border-border rounded-lg">
                <span className="block text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  {t("profile.integrations.fitdays.boundDevice")}
                </span>
                <div className="flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground truncate">
                    {fitdaysIntegration.config.devices?.[0]?.name ||
                      t("profile.integrations.fitdays.noDevice")}
                  </span>
                </div>
              </div>
            </div>

            {/* Last Synced info & error if present */}
            <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border gap-2">
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>
                  {t("profile.integrations.fitdays.lastSynced")}:{" "}
                  <strong className="text-foreground">
                    {fitdaysIntegration.lastSyncedAt
                      ? formatDate(fitdaysIntegration.lastSyncedAt)
                      : t("profile.integrations.fitdays.lastSyncedNever")}
                  </strong>
                </span>
              </div>

              {fitdaysIntegration.lastSyncError && (
                <span className="text-destructive font-medium">
                  {fitdaysIntegration.lastSyncError}
                </span>
              )}
            </div>

            {/* Sync Controls */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSync(false)}
                disabled={isSyncing || isFullSyncing}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{t("profile.integrations.fitdays.syncing")}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>{t("profile.integrations.fitdays.syncNow")}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSync(true)}
                disabled={isSyncing || isFullSyncing}
                className="px-3 py-2 rounded-lg border border-input bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isFullSyncing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{t("profile.integrations.fitdays.syncing")}</span>
                  </>
                ) : (
                  <>
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{t("profile.integrations.fitdays.forceFullSync")}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Configuration Card: Ignore Weight-Only Scans Toggle */}
          <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-4">
            <div className="space-y-0.5 max-w-xl">
              <h5 className="text-sm font-semibold text-foreground">
                {t("profile.integrations.fitdays.skipWeightOnlyLabel")}
              </h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("profile.integrations.fitdays.skipWeightOnlyDesc")}
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleSkipWeightOnly}
              disabled={isUpdatingConfig}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-primary ${
                fitdaysIntegration.config.skipWeightOnly ?? true
                  ? "bg-primary"
                  : "bg-muted"
              }`}
              role="switch"
              aria-checked={fitdaysIntegration.config.skipWeightOnly ?? true}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                  fitdaysIntegration.config.skipWeightOnly ?? true
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Revoke / Disconnect Button */}
          <div className="pt-2 border-t border-border flex justify-end">
            <button
              type="button"
              onClick={() => setShowDisconnectModal(true)}
              className="px-3.5 py-2 rounded-lg border border-destructive/30 hover:bg-destructive/10 text-destructive text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t("profile.integrations.fitdays.disconnectBtn")}</span>
            </button>
          </div>
        </div>
      ) : (
        /* DISCONNECTED / LOGIN FORM STATE */
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-border bg-muted/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground">
                  {t("profile.integrations.fitdays.title")}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {t("profile.integrations.fitdays.description")}
                </p>
              </div>
            </div>

            <form onSubmit={handleConnect} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fitdays Email or Phone */}
                <div>
                  <label
                    className="block text-xs font-medium text-foreground mb-1.5"
                    htmlFor="fitdays-email"
                  >
                    {t("profile.integrations.fitdays.emailLabel")}
                  </label>
                  <input
                    id="fitdays-email"
                    type="text"
                    value={fitdaysEmail}
                    onChange={(e) => setFitdaysEmail(e.target.value)}
                    placeholder={t("profile.integrations.fitdays.emailPlaceholder")}
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Password with Visibility Toggle */}
                <div>
                  <label
                    className="block text-xs font-medium text-foreground mb-1.5"
                    htmlFor="fitdays-password"
                  >
                    {t("profile.integrations.fitdays.passwordLabel")}
                  </label>
                  <div className="relative">
                    <input
                      id="fitdays-password"
                      type={showPassword ? "text" : "password"}
                      value={fitdaysPassword}
                      onChange={(e) => setFitdaysPassword(e.target.value)}
                      placeholder={t("profile.integrations.fitdays.passwordPlaceholder")}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground pr-10 focus:outline-hidden focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      title={
                        showPassword
                          ? t("profile.integrations.fitdays.hidePassword")
                          : t("profile.integrations.fitdays.showPassword")
                      }
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Region Selector */}
              <div className="max-w-xs">
                <label
                  className="block text-xs font-medium text-foreground mb-1.5"
                  htmlFor="fitdays-region"
                >
                  {t("profile.integrations.fitdays.regionLabel")}
                </label>
                <select
                  id="fitdays-region"
                  value={fitdaysRegion}
                  onChange={(e) => setFitdaysRegion(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="us">{t("profile.integrations.fitdays.regionUS")}</option>
                  <option value="eu">{t("profile.integrations.fitdays.regionEU")}</option>
                  <option value="cn">{t("profile.integrations.fitdays.regionCN")}</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isConnecting || !fitdaysEmail || !fitdaysPassword}
                  className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-xs"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{t("profile.integrations.fitdays.connecting")}</span>
                    </>
                  ) : (
                    <span>{t("profile.integrations.fitdays.connectBtn")}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEMBER PROFILE SELECTOR MODAL */}
      {showProfileSelector && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setShowProfileSelector(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setShowProfileSelector(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-5">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <UserIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                {t("profile.integrations.fitdays.selectMemberProfile")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("profile.integrations.fitdays.selectMemberProfileDesc")}
              </p>
            </div>

            {/* List of profiles */}
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {discoveredProfiles.map((p) => {
                const isSelected = selectedSuid === p.suid;
                return (
                  <div
                    key={p.suid}
                    onClick={() => setSelectedSuid(p.suid)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {p.nickname.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-foreground block">
                          {p.nickname}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {p.birthday ? formatDate(p.birthday.split(" ")[0]) : "—"}
                          {p.height ? ` • ${p.height} cm` : ""}
                          {p.sex === 0
                            ? ` • ${t("common.male")}`
                            : p.sex === 1
                            ? ` • ${t("common.female")}`
                            : ""}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-background" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowProfileSelector(false)}
                className="flex-1 py-2.5 rounded-lg border border-input bg-background hover:bg-muted text-foreground text-xs font-semibold cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmProfileBinding}
                disabled={isBinding || selectedSuid === null}
                className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
              >
                {isBinding ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{t("profile.integrations.fitdays.binding")}</span>
                  </>
                ) : (
                  <span>{t("profile.integrations.fitdays.bindProfileBtn")}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCONNECT CONFIRMATION MODAL */}
      {showDisconnectModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setShowDisconnectModal(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setShowDisconnectModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-5">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-3">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                {t("profile.integrations.fitdays.disconnectConfirmTitle")}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("profile.integrations.fitdays.disconnectConfirmText")}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                disabled={isDisconnecting}
                className="flex-1 py-2 rounded-lg border border-input bg-background hover:bg-muted text-foreground text-xs font-medium cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="flex-1 py-2 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDisconnecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>{t("profile.integrations.fitdays.disconnectBtn")}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
