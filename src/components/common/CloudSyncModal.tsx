import React, { useState } from 'react';
import { X, Cloud, CloudUpload, CloudDownload, Copy, Check, AlertCircle, Key, FileJson, Database, Link, Sparkles, Share2 } from 'lucide-react';
import {
  uploadToCloudDetails,
  downloadFromCloudDetails,
  CloudSyncPayload,
  getActiveSkyId,
  setActiveSkyId,
  getSupabaseConfig,
  setSupabaseConfig,
  getActiveSyncKey,
  setActiveSyncKey,
} from '../../utils/cloudSync';
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
  const [syncCode, setSyncCode] = useState<string>(() => getActiveSyncKey());
  const [skyIdInput, setSkyIdInput] = useState<string>(() => getActiveSkyId());
  const [showSupabase, setShowSupabase] = useState(false);
  
  const [supabaseUrl, setSupabaseUrl] = useState(() => getSupabaseConfig()?.url || '');
  const [supabaseKey, setSupabaseKey] = useState(() => getSupabaseConfig()?.anonKey || '');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSkyId, setCopiedSkyId] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedMagicLink, setCopiedMagicLink] = useState(false);

  const activeSkyId = getActiveSkyId();
  const currentSupabase = getSupabaseConfig();

  const handleCopySkyId = () => {
    if (activeSkyId) {
      navigator.clipboard.writeText(activeSkyId);
      setCopiedSkyId(true);
      setTimeout(() => setCopiedSkyId(false), 2500);
    }
  };

  const handleCopyMagicLink = () => {
    const targetUrl = supabaseUrl.trim() || currentSupabase?.url || '';
    const targetKey = supabaseKey.trim() || currentSupabase?.anonKey || '';
    if (targetUrl && targetKey) {
      const magicUrl = `https://styrke.onrender.com/?sb_url=${encodeURIComponent(targetUrl)}&sb_key=${encodeURIComponent(targetKey)}`;
      navigator.clipboard.writeText(magicUrl);
      setCopiedMagicLink(true);
      setTimeout(() => setCopiedMagicLink(false), 2500);
    } else {
      setStatusMsg({ type: 'error', text: 'Legg inn Supabase URL og Anon Key først for å opprette lenken.' });
    }
  };

  const handleConnectSkyId = () => {
    if (!skyIdInput.trim()) {
      setStatusMsg({ type: 'error', text: 'Vennligst lim inn en gyldig Sky-ID.' });
      return;
    }
    setActiveSkyId(skyIdInput.trim());
    setStatusMsg({
      type: 'success',
      text: 'Sky-ID er koblet til! Trykk "2. Hent fra skyen" for å hente alle dataene dine.',
    });
  };

  const handleSaveSupabase = () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setSupabaseConfig('', '');
      setStatusMsg({ type: 'success', text: 'Supabase-innstillinger er tilbakestilt.' });
    } else {
      setSupabaseConfig(supabaseUrl, supabaseKey);
      setStatusMsg({ type: 'success', text: 'Supabase-innstillinger lagret! Appen vil nå bruke din egen Supabase DB.' });
    }
  };

  const handleUpload = async () => {
    if (!syncCode.trim()) {
      setStatusMsg({ type: 'error', text: 'Vennligst skriv inn en synkroniseringskode.' });
      return;
    }
    setLoading(true);
    setStatusMsg(null);

    setActiveSyncKey(syncCode);
    const result = await uploadToCloudDetails(syncCode, logs, scheduleConfig);
    setLoading(false);

    if (result.success) {
      const newSkyId = getActiveSkyId();
      setSkyIdInput(newSkyId);
      setStatusMsg({
        type: 'success',
        text: result.message,
      });
    } else {
      setStatusMsg({
        type: 'error',
        text: result.message,
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

    setActiveSyncKey(syncCode);
    const result = await downloadFromCloudDetails(syncCode);
    setLoading(false);

    if (result.success && result.payload && Array.isArray(result.payload.logs)) {
      onApplyCloudData(result.payload);
      setStatusMsg({
        type: 'success',
        text: result.message,
      });
    } else {
      setStatusMsg({
        type: 'error',
        text: result.message,
      });
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `styrke_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const sqlSnippet = `create table public.workout_sync (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);
alter table public.workout_sync enable row level security;
create policy "Allow public access" on public.workout_sync for all using (true) with check (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
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
              <p className="text-xs text-slate-400">Mobil (iPhone/Pixel) & PC Toveissynk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          
          {/* Supabase Active Notification */}
          {currentSupabase && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                  <Database className="w-4 h-4" />
                  <span>Din Supabase-database er aktiv! 🟢</span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyMagicLink}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedMagicLink ? 'Lenke kopiert!' : 'Kopier hurtiglenke til Pixel'}</span>
                </button>
              </div>
              <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                For å koble til Pixel-mobilen: Lim inn Supabase URL/Anon Key på Pixel, eller del hurtiglenken til Pixel-en!
              </p>
            </div>
          )}

          {/* Sync Code Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Synkroniseringsnavn / Kode
            </label>
            <div className="relative">
              <input
                type="text"
                value={syncCode}
                onChange={(e) => setSyncCode(e.target.value)}
                placeholder="f.eks. styrke55"
                className="w-full px-4 py-2.5 pl-10 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-blue-500 transition-colors uppercase tracking-wider"
              />
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Bruk samme kode (f.eks. <strong>styrke55</strong>) på både iPhone, Pixel og PC.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 flex flex-col items-center justify-center space-y-2 disabled:opacity-50"
            >
              <CloudUpload className="w-6 h-6" />
              <span>1. Last opp til skyen</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={loading}
              className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 transition-all flex flex-col items-center justify-center space-y-2 disabled:opacity-50"
            >
              <CloudDownload className="w-6 h-6 text-cyan-400" />
              <span>2. Hent fra skyen (på Pixel/PC)</span>
            </button>
          </div>

          {/* Status Message Alert with Exact Error Info */}
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

          {/* Optional Supabase DB Config Toggle */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowSupabase(!showSupabase)}
              className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Avansert: Bruk egen Supabase Database {currentSupabase ? '🟢 (Aktiv)' : '(Valgfritt)'}</span>
            </button>

            {showSupabase && (
              <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn">
                <p className="text-[11px] text-slate-400">
                  Dersom du har et Supabase-prosjekt, kan du opprette tabellen <code>workout_sync</code> og legge inn URL og Anon Key her:
                </p>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Supabase URL</label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyz.supabase.co"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Supabase Anon Key</label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOi..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="inline-flex items-center space-x-1 text-[11px] text-cyan-400 hover:underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{copiedSql ? 'SQL Kopiert!' : 'Kopier SQL'}</span>
                    </button>

                    {(supabaseUrl.trim() || currentSupabase) && (
                      <button
                        type="button"
                        onClick={handleCopyMagicLink}
                        className="inline-flex items-center space-x-1 text-[11px] text-emerald-400 hover:underline font-bold"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{copiedMagicLink ? 'Lenke kopiert!' : 'Kopier hurtiglenke til Pixel'}</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveSupabase}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shrink-0"
                  >
                    Lagre Supabase
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Backup file export */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Lokal Fil-sikkerhetskopi (Offline):</span>
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
