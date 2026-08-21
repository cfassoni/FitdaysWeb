"use client";

import { importFitdaysData } from "@/app/actions/import";
import { X, UploadCloud, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

export function ImportModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{success?: string, error?: string} | null>(null);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await importFitdaysData(formData);
    setResult(res);
    setIsUploading(false);

    if (res.success) {
      router.refresh();
      setTimeout(() => {
        onClose();
        setFile(null);
        setResult(null);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            {t("nav.importData")}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {result?.success ? (
            <div className="flex flex-col items-center justify-center py-8 text-emerald-600">
              <CheckCircle2 className="w-12 h-12 mb-3" />
              <p className="font-semibold">{result.success}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <UploadCloud className="w-8 h-8 text-indigo-500 mb-3" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {file ? file.name : "Clique para selecionar ou arraste o arquivo"}
                </p>
                <p className="text-xs text-slate-500 mt-1">.xls, .xlsx, ou .csv suportados</p>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              {result?.error && (
                <div className="p-3 bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 text-sm rounded-xl">
                  {result.error}
                </div>
              )}

              <button
                disabled={!file || isUploading}
                onClick={handleUpload}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
              >
                {isUploading ? "Processando..." : "Importar Dados"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
