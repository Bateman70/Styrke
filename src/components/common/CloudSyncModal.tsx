import React, { useState } from 'react';
import { X, Cloud, CloudUpload, CloudDownload, RefreshCw, Check, AlertCircle, Key, FileJson } from 'lucide-react';
import { uploadToCloud, downloadFromCloud, CloudSyncPayload } from '../../utils/cloudSync';
import { WorkoutLog, UserScheduleConfig } from '../../types/workout';

interface CloudSyncModalProps {
  logs: WorkoutLog[];
  scheduleConfig?: UserScheduleConfig;
  onApplyCloudData: (payload: CloudSyncPayload) => void;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  logs,
  scheduleConfig,
  onApplyCloudData,
  onClose,
}) => {
  const [syncCode, setSyncCode] = useState<string>(() => {
    return localStorage.getItem('styrke_app_active_sync_code') || 'styrke55';
  });
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleGenerateCode = () => {
    const randomCode = 'styrke' + Math.floor(1000 + Math.random() * 9000);
    setSyncCode(randomCode);
  };

  const handleUpload = async () => {
    if (!syncCode.trim()) {
      setStatusMsg({ type: 'error', text: 'Vennligst skriv inn en synkroniseringskode.' });
      return;
    }
    setLoading(true);
    setStatusMsg(null);

    const success = await uploadToCloud(syncCode, logs, scheduleConfig);
    setLoading(false);

    if (success) {
      localStorage.setItem('styrke_app_active_sync_code', syncCode.trim().toLowerCase());
      setStatusMsg({
        type: 'success',
        text: `Koden "${syncCode.trim()}" er lagret i skyen! Skriv inn denne koden på PC-en din for å hente planen.`,
      });
    } else {
      setStatusMsg({
        type: 'error',
        text: 'Kunne ikke laste opp til skyen. Sjekk internettforbindelsen og prøv igjen.',
      });
    }
  };

  const handleDownload = async () => {
    if (!syncCode.trim()) {
      setStatusMsg({ type: 'error', text: 'Vennligst skriv inn synkroniseringskoden.' });
      return;
    }
    setLoading(true);
    setStatusMsg(null);

    const payload = await downloadFromCloud(syncCode);
    setLoading(false);

    if (payload && payload.logs && payload.logs.length >= 0) {
      localStorage.setItem('styrke_app_active_sync_code', syncCode.trim().toLowerCase());
      onApplyCloudData(payload);
      setStatusMsg({
        type: 'success',
        text: `Hentet ${payload.logs.length} økter fra skyen! Enhetene dine er nå synkronisert.`,
      });
    } else {
      setStatusMsg({
        type: 'error',
        text: `Fant ingen data i skyen for koden "${syncCode.trim()}". Husk å laste opp fra mobilen først!`,
      });
    }
  };

  // Export local JSON file backup
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `styrke_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Sky-Synkronisering</h3>
              <p className="text-xs text-slate-400">Synkroniser mellom Mobil og PC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Sync Code Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Din personlige Synk-kode
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={syncCode}
                  onChange={(e) => setSyncCode(e.target.value)}
                  placeholder="f.eks. minstyrke55"
                  className="w-full px-4 py-2.5 pl-10 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-blue-500 transition-colors uppercase tracking-wider"
                />
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
              <button
                type="button"
                onClick={handleGenerateCode}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                title="Generer tilfeldig kode"
              >
                Ny kode
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Bruk samme kode på både mobil og PC for å dele ukesplanen og loggene dine.
            </p>
          </div>

          {/* Upload / Download Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 flex flex-col items-center justify-center space-y-2 disabled:opacity-50"
            >
              <CloudUpload className="w-6 h-6" />
              <span>1. Last opp til skyen (fra Mobil/PC)</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={loading}
              className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 transition-all flex flex-col items-center justify-center space-y-2 disabled:opacity-50"
            >
              <CloudDownload className="w-6 h-6 text-blue-400" />
              <span>2. Hent fra skyen (på den andre enheten)</span>
            </button>
          </div>

          {/* Status Message Alert */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start space-x-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Backup file export */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Fil-sikkerhetskopi (Offline):</span>
            <button
              onClick={handleExportJSON}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium transition-colors"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span>Eksporter fil</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};
