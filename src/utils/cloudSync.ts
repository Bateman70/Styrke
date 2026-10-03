import { WorkoutLog, UserScheduleConfig, UserProfile } from '../types/workout';

// 100% Reliable CORS-enabled Cloud REST API
const REST_API_URL = 'https://api.jsonbin.io/v3/b';
const DEFAULT_SYNC_KEY = 'styrke55';
const GLOBAL_REGISTRY_ID = '68fff7591e35ca5679c6d5cf';

export interface CloudSyncPayload {
  syncCode: string;
  updatedAt: string;
  logs: WorkoutLog[];
  scheduleConfig?: UserScheduleConfig;
  userProfile?: UserProfile;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface SyncResult {
  success: boolean;
  message: string;
  payload?: CloudSyncPayload;
}

let currentSyncStatus: SyncStatus = 'idle';
let lastSyncTime: string | null = localStorage.getItem('styrke_last_cloud_sync_time');
const statusListeners: Array<(status: SyncStatus, time: string | null) => void> = [];

export function getSyncStatus(): { status: SyncStatus; lastSyncTime: string | null } {
  return { status: currentSyncStatus, lastSyncTime };
}

export function subscribeSyncStatus(listener: (status: SyncStatus, time: string | null) => void): () => void {
  statusListeners.push(listener);
  listener(currentSyncStatus, lastSyncTime);
  return () => {
    const idx = statusListeners.indexOf(listener);
    if (idx >= 0) statusListeners.splice(idx, 1);
  };
}

function notifyStatus(status: SyncStatus) {
  currentSyncStatus = status;
  if (status === 'synced') {
    lastSyncTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    localStorage.setItem('styrke_last_cloud_sync_time', lastSyncTime);
  }
  statusListeners.forEach((fn) => fn(currentSyncStatus, lastSyncTime));
}

function isValidSkyId(id: string): boolean {
  return typeof id === 'string' && /^[a-f0-9]{24,32}$/i.test(id.trim());
}

function cleanSupabaseUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.trim().replace(/\/$/, '');
  // Strip trailing /rest/v1 if the user copied the full PostgREST endpoint from Supabase dashboard
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  return cleaned;
}

export function checkAndApplyUrlSupabaseConfig(): boolean {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
    
    const sbUrl = searchParams.get('sb_url') || hashParams.get('sb_url') || searchParams.get('supabaseUrl');
    const sbKey = searchParams.get('sb_key') || hashParams.get('sb_key') || searchParams.get('supabaseKey');

    if (sbUrl && sbKey) {
      setSupabaseConfig(decodeURIComponent(sbUrl), decodeURIComponent(sbKey));
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
  } catch (e) {
    console.error('Error parsing URL params:', e);
  }
  return false;
}

// Global registry lookup & update helpers
async function registerGlobalSkyId(syncCode: string, skyId: string): Promise<boolean> {
  try {
    const cleanKey = syncCode.trim().toLowerCase();
    const res = await fetch(`${REST_API_URL}/${GLOBAL_REGISTRY_ID}/latest`);
    let registry: Record<string, string> = {};
    if (res.ok) {
      const json = await res.json();
      if (json && json.record) {
        try {
          const rawReg = typeof json.record === 'string' ? json.record : json.record.registry;
          registry = typeof rawReg === 'string' ? JSON.parse(rawReg) : rawReg || {};
        } catch (e) {
          registry = {};
        }
      }
    }
    registry[cleanKey] = skyId;
    const putRes = await fetch(`${REST_API_URL}/${GLOBAL_REGISTRY_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registry: JSON.stringify(registry),
      }),
    });
    return putRes.ok;
  } catch (err) {
    console.error('Error updating global registry:', err);
    return false;
  }
}

async function lookupGlobalSkyId(syncCode: string): Promise<string | null> {
  try {
    const cleanKey = syncCode.trim().toLowerCase();
    const res = await fetch(`${REST_API_URL}/${GLOBAL_REGISTRY_ID}/latest`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.record) {
        const rawReg = typeof json.record === 'string' ? json.record : json.record.registry;
        const registry: Record<string, string> = typeof rawReg === 'string' ? JSON.parse(rawReg) : rawReg || {};
        return registry[cleanKey] || null;
      }
    }
    return null;
  } catch (err) {
    console.error('Error looking up global registry:', err);
    return null;
  }
}

// Get or set active device sync key
export function getActiveSyncKey(): string {
  const stored = localStorage.getItem('styrke_app_auto_sync_key');
  if (stored && stored.trim()) {
    return stored.trim().toLowerCase();
  }
  return DEFAULT_SYNC_KEY;
}

export function setActiveSyncKey(key: string): void {
  localStorage.setItem('styrke_app_auto_sync_key', key.trim().toLowerCase());
}

// Get or set active Sky-ID (Cloud Object ID)
export function getActiveSkyId(): string {
  const id = localStorage.getItem('styrke_app_active_sky_id') || '';
  return isValidSkyId(id) ? id.trim() : '';
}

export function setActiveSkyId(id: string): void {
  if (isValidSkyId(id)) {
    localStorage.setItem('styrke_app_active_sky_id', id.trim());
  } else {
    localStorage.removeItem('styrke_app_active_sky_id');
  }
}

// Get or set Supabase credentials
export function getSupabaseConfig(): SupabaseConfig | null {
  const url = localStorage.getItem('styrke_supabase_url');
  const anonKey = localStorage.getItem('styrke_supabase_key');
  if (url && anonKey && url.trim() && anonKey.trim()) {
    return { url: cleanSupabaseUrl(url), anonKey: anonKey.trim() };
  }
  return null;
}

export function setSupabaseConfig(url: string, anonKey: string): void {
  if (!url.trim() || !anonKey.trim()) {
    localStorage.removeItem('styrke_supabase_url');
    localStorage.removeItem('styrke_supabase_key');
  } else {
    localStorage.setItem('styrke_supabase_url', cleanSupabaseUrl(url));
    localStorage.setItem('styrke_supabase_key', anonKey.trim());
  }
}

// Compact minifier to keep sync payloads tiny and ultra-fast
function minifiedLogs(logs: WorkoutLog[]): WorkoutLog[] {
  if (!Array.isArray(logs)) return [];
  return logs.map((log) => ({
    id: log.id,
    date: log.date,
    type: log.type,
    status: log.status,
    completedAt: log.completedAt,
    notes: log.notes,
    runDetails: log.runDetails,
    exercises: log.exercises?.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      sets: ex.sets?.map((s) => ({
        setNumber: s.setNumber,
        weightKg: s.weightKg,
        repsCompleted: s.repsCompleted,
        completed: s.completed,
      })),
    })),
  }));
}

// 1. Upload to Cloud with Detailed Diagnostic Result
export async function uploadToCloudDetails(
  syncCode: string,
  logs: WorkoutLog[],
  scheduleConfig?: UserScheduleConfig,
  userProfile?: UserProfile
): Promise<SyncResult> {
  const cleanCode = syncCode.trim().toLowerCase() || DEFAULT_SYNC_KEY;
  setActiveSyncKey(cleanCode);
  notifyStatus('syncing');

  const payload: CloudSyncPayload = {
    syncCode: cleanCode,
    updatedAt: new Date().toISOString(),
    logs: minifiedLogs(logs),
    scheduleConfig,
    userProfile,
  };

  const stringifiedContent = JSON.stringify(payload);

  // Check if Supabase is configured
  const supabase = getSupabaseConfig();
  if (supabase) {
    try {
      const endpoint = `${supabase.url}/rest/v1/workout_sync`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.anonKey,
          'Authorization': `Bearer ${supabase.anonKey}`,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: cleanCode,
          payload: stringifiedContent,
          updated_at: payload.updatedAt,
        }),
      });

      if (res.ok) {
        notifyStatus('synced');
        return { success: true, message: `Suksess! Lagret ${logs.length} økter i din Supabase database!` };
      } else {
        const errText = await res.text();
        notifyStatus('error');
        if (res.status === 404 || errText.includes('PGRST125') || errText.includes('relation "public.workout_sync" does not exist')) {
          return {
            success: false,
            message: `Supabase Feil (404): Tabellen "workout_sync" finnes ikke i Supabase ennå. Husk å kjøre SQL-skriptet i SQL Editor i Supabase!`,
          };
        }
        return { success: false, message: `Supabase DB feil (${res.status}): ${errText.slice(0, 100)}` };
      }
    } catch (err: any) {
      console.error('Supabase upload error:', err);
      notifyStatus('error');
      return { success: false, message: `Supabase tilkoblingsfeil: ${err.message || err}` };
    }
  }

  // Fallback REST API upload
  let skyId = getActiveSkyId();

  try {
    if (isValidSkyId(skyId)) {
      const putRes = await fetch(`${REST_API_URL}/${skyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncCode: cleanCode,
          content: stringifiedContent,
        }),
      });

      if (putRes.ok) {
        await registerGlobalSkyId(cleanCode, skyId);
        notifyStatus('synced');
        return {
          success: true,
          message: `Lastet opp ${logs.length} økter til skyen! (Sky-ID: ${skyId.slice(0, 8)}...)`,
        };
      }
      setActiveSkyId('');
    }

    // Create new cloud object via POST
    const postRes = await fetch(REST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bin-Private': 'false',
      },
      body: JSON.stringify({
        syncCode: cleanCode,
        content: stringifiedContent,
      }),
    });

    if (postRes.ok) {
      const created = await postRes.json();
      const newId = created?.metadata?.id || created?.id;
      if (newId) {
        setActiveSkyId(newId);
        await registerGlobalSkyId(cleanCode, newId);
        notifyStatus('synced');
        return {
          success: true,
          message: `Lastet opp ${logs.length} økter til skyen! Koden "${cleanCode}" er samkjørt!`,
        };
      }
    }

    notifyStatus('error');
    return {
      success: false,
      message: `Skytjener feilet med status ${postRes.status}. Vennligst prøv igjen om et øyeblikk.`,
    };
  } catch (err: any) {
    console.error('Cloud upload error:', err);
    notifyStatus('error');
    return {
      success: false,
      message: `Tilkoblingsfeil (${err.name || 'NetworkError'}): Sjekk at du har dekning.`,
    };
  }
}

// 2. Download from Cloud with Detailed Diagnostic Result
export async function downloadFromCloudDetails(syncCode: string): Promise<SyncResult> {
  const cleanCode = syncCode.trim().toLowerCase() || DEFAULT_SYNC_KEY;
  notifyStatus('syncing');

  // Check if Supabase is configured
  const supabase = getSupabaseConfig();
  if (supabase) {
    try {
      const endpoint = `${supabase.url}/rest/v1/workout_sync?id=eq.${cleanCode}&select=*`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'apikey': supabase.anonKey,
          'Authorization': `Bearer ${supabase.anonKey}`,
        },
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0 && rows[0].payload) {
          const parsed: CloudSyncPayload = typeof rows[0].payload === 'string' ? JSON.parse(rows[0].payload) : rows[0].payload;
          notifyStatus('synced');
          return {
            success: true,
            message: `Suksess! Hentet ${parsed.logs?.length || 0} økter fra din Supabase DB!`,
            payload: parsed,
          };
        }
        notifyStatus('error');
        return { success: false, message: `Fant ingen oppføring i Supabase for koden "${cleanCode}". Trykk "1. Last opp" først!` };
      } else {
        const errText = await res.text();
        notifyStatus('error');
        if (res.status === 404 || errText.includes('PGRST125') || errText.includes('relation "public.workout_sync" does not exist')) {
          return {
            success: false,
            message: `Supabase Feil (404): Tabellen "workout_sync" finnes ikke i Supabase ennå. Husk å kjøre SQL-skriptet i SQL Editor i Supabase!`,
          };
        }
        return { success: false, message: `Supabase feil (${res.status}): ${errText.slice(0, 100)}` };
      }
    } catch (err: any) {
      console.error('Supabase download error:', err);
    }
  }

  // Fallback REST API download using Sky-ID or Global Registry lookup
  let skyId = getActiveSkyId();

  if (!isValidSkyId(skyId)) {
    const foundId = await lookupGlobalSkyId(cleanCode);
    if (foundId && isValidSkyId(foundId)) {
      skyId = foundId;
      setActiveSkyId(foundId);
    }
  }

  const parseRecordPayload = (json: any): CloudSyncPayload | null => {
    if (!json) return null;
    const raw = json.record?.content || json.record?.data?.content || json.data?.content || json.record;
    if (!raw) return null;
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      return null;
    }
  };

  try {
    if (isValidSkyId(skyId)) {
      const res = await fetch(`${REST_API_URL}/${skyId}/latest`);
      if (res.ok) {
        const json = await res.json();
        const parsed = parseRecordPayload(json);
        if (parsed && Array.isArray(parsed.logs)) {
          notifyStatus('synced');
          return {
            success: true,
            message: `Hentet ${parsed.logs.length} økter fra skyen!`,
            payload: parsed,
          };
        }
      }
    }

    // Try lookup once more
    const foundId = await lookupGlobalSkyId(cleanCode);
    if (foundId && isValidSkyId(foundId)) {
      setActiveSkyId(foundId);
      const retryRes = await fetch(`${REST_API_URL}/${foundId}/latest`);
      if (retryRes.ok) {
        const json = await retryRes.json();
        const parsed = parseRecordPayload(json);
        if (parsed && Array.isArray(parsed.logs)) {
          notifyStatus('synced');
          return {
            success: true,
            message: `Hentet ${parsed.logs.length} økter fra sky-registeret!`,
            payload: parsed,
          };
        }
      }
    }

    notifyStatus('error');
    return {
      success: false,
      message: `Fant ingen lagret data i skyen for koden "${cleanCode}". Trykk "1. Last opp til skyen" først!`,
    };
  } catch (err: any) {
    console.error('Cloud download error:', err);
    notifyStatus('error');
    return {
      success: false,
      message: `Tilkoblingsfeil (${err.name || 'NetworkError'}): Sjekk internettforbindelsen på mobilen.`,
    };
  }
}

// Simple wrappers
export async function uploadToCloud(
  syncCode: string,
  logs: WorkoutLog[],
  scheduleConfig?: UserScheduleConfig,
  userProfile?: UserProfile
): Promise<boolean> {
  const res = await uploadToCloudDetails(syncCode, logs, scheduleConfig, userProfile);
  return res.success;
}

export async function downloadFromCloud(syncCode: string): Promise<CloudSyncPayload | null> {
  const res = await downloadFromCloudDetails(syncCode);
  return res.payload || null;
}

export async function autoSaveToCloud(
  logs: WorkoutLog[],
  scheduleConfig?: UserScheduleConfig,
  userProfile?: UserProfile
): Promise<boolean> {
  const syncKey = getActiveSyncKey();
  return uploadToCloud(syncKey, logs, scheduleConfig, userProfile);
}

export async function autoFetchFromCloud(): Promise<CloudSyncPayload | null> {
  const syncKey = getActiveSyncKey();
  return downloadFromCloud(syncKey);
}
