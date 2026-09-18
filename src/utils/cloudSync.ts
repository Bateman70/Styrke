import { WorkoutLog, UserScheduleConfig } from '../types/workout';

// 100% Reliable CORS-enabled Cloud REST API
const REST_API_URL = 'https://api.restful-api.dev/objects';
const DEFAULT_SYNC_KEY = 'styrke55';
const GLOBAL_REGISTRY_ID = 'ff808181a09d98f701a0b65d03ee399f';

export interface CloudSyncPayload {
  syncCode: string;
  updatedAt: string;
  logs: WorkoutLog[];
  scheduleConfig?: UserScheduleConfig;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

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

// Global registry lookup & update helpers
async function registerGlobalSkyId(syncCode: string, skyId: string): Promise<void> {
  try {
    const res = await fetch(`${REST_API_URL}/${GLOBAL_REGISTRY_ID}`);
    let registry: Record<string, string> = {};
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && json.data.registry) {
        registry = JSON.parse(json.data.registry);
      }
    }
    registry[syncCode.trim().toLowerCase()] = skyId;
    await fetch(`${REST_API_URL}/${GLOBAL_REGISTRY_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'styrke_global_registry_index_v1',
        data: { registry: JSON.stringify(registry) },
      }),
    });
  } catch (err) {
    console.error('Error updating global registry:', err);
  }
}

async function lookupGlobalSkyId(syncCode: string): Promise<string | null> {
  try {
    const res = await fetch(`${REST_API_URL}/${GLOBAL_REGISTRY_ID}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && json.data.registry) {
        const registry: Record<string, string> = JSON.parse(json.data.registry);
        return registry[syncCode.trim().toLowerCase()] || null;
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
  return localStorage.getItem('styrke_app_active_sky_id') || '';
}

export function setActiveSkyId(id: string): void {
  localStorage.setItem('styrke_app_active_sky_id', id.trim());
}

// Get or set Supabase credentials
export function getSupabaseConfig(): SupabaseConfig | null {
  const url = localStorage.getItem('styrke_supabase_url');
  const anonKey = localStorage.getItem('styrke_supabase_key');
  if (url && anonKey && url.trim() && anonKey.trim()) {
    return { url: url.trim(), anonKey: anonKey.trim() };
  }
  return null;
}

export function setSupabaseConfig(url: string, anonKey: string): void {
  if (!url.trim() || !anonKey.trim()) {
    localStorage.removeItem('styrke_supabase_url');
    localStorage.removeItem('styrke_supabase_key');
  } else {
    localStorage.setItem('styrke_supabase_url', url.trim());
    localStorage.setItem('styrke_supabase_key', anonKey.trim());
  }
}

// Compact minifier to keep sync payloads tiny and ultra-fast
function minifiedLogs(logs: WorkoutLog[]): WorkoutLog[] {
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

// 1. Upload to Cloud (Supabase or REST API direct Sky-ID + Global Registry)
export async function uploadToCloud(
  syncCode: string,
  logs: WorkoutLog[],
  scheduleConfig?: UserScheduleConfig
): Promise<boolean> {
  const cleanCode = syncCode.trim().toLowerCase() || DEFAULT_SYNC_KEY;
  setActiveSyncKey(cleanCode);
  notifyStatus('syncing');

  const payload: CloudSyncPayload = {
    syncCode: cleanCode,
    updatedAt: new Date().toISOString(),
    logs: minifiedLogs(logs),
    scheduleConfig,
  };

  const stringifiedContent = JSON.stringify(payload);

  // Check if Supabase is configured
  const supabase = getSupabaseConfig();
  if (supabase) {
    try {
      const endpoint = `${supabase.url.replace(/\/$/, '')}/rest/v1/workout_sync`;
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
        return true;
      }
    } catch (err) {
      console.error('Supabase upload error:', err);
    }
  }

  // Fallback REST API upload
  const name = `styrke_app_${cleanCode}`;
  let skyId = getActiveSkyId();

  try {
    // If we already have a Sky-ID, try updating via PUT
    if (skyId) {
      const putRes = await fetch(`${REST_API_URL}/${skyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          data: { content: stringifiedContent },
        }),
      });

      if (putRes.ok) {
        await registerGlobalSkyId(cleanCode, skyId);
        notifyStatus('synced');
        return true;
      }
      // If PUT returned 404/error, clear stale Sky-ID and create new
      setActiveSkyId('');
    }

    // Create new cloud object via POST
    const postRes = await fetch(REST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        data: { content: stringifiedContent },
      }),
    });

    if (postRes.ok) {
      const created = await postRes.json();
      if (created && created.id) {
        setActiveSkyId(created.id);
        await registerGlobalSkyId(cleanCode, created.id);
        notifyStatus('synced');
        return true;
      }
    }

    notifyStatus('error');
    return false;
  } catch (err) {
    console.error('Cloud upload error:', err);
    notifyStatus('error');
    return false;
  }
}

// 2. Download from Cloud (Supabase or REST API with automatic Registry Lookup)
export async function downloadFromCloud(syncCode: string): Promise<CloudSyncPayload | null> {
  const cleanCode = syncCode.trim().toLowerCase() || DEFAULT_SYNC_KEY;
  notifyStatus('syncing');

  // Check if Supabase is configured
  const supabase = getSupabaseConfig();
  if (supabase) {
    try {
      const endpoint = `${supabase.url.replace(/\/$/, '')}/rest/v1/workout_sync?id=eq.${cleanCode}&select=*`;
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
          return parsed;
        }
      }
    } catch (err) {
      console.error('Supabase download error:', err);
    }
  }

  // Fallback REST API download using Sky-ID or Global Registry lookup
  let skyId = getActiveSkyId();

  if (!skyId) {
    const foundId = await lookupGlobalSkyId(cleanCode);
    if (foundId) {
      skyId = foundId;
      setActiveSkyId(foundId);
    }
  }

  try {
    if (skyId) {
      const res = await fetch(`${REST_API_URL}/${skyId}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data && json.data.content) {
          const parsed: CloudSyncPayload = JSON.parse(json.data.content);
          notifyStatus('synced');
          return parsed;
        }
      }
      // If skyId fetch returned 404, try global registry lookup once more
      const foundId = await lookupGlobalSkyId(cleanCode);
      if (foundId && foundId !== skyId) {
        setActiveSkyId(foundId);
        const retryRes = await fetch(`${REST_API_URL}/${foundId}`);
        if (retryRes.ok) {
          const json = await retryRes.json();
          if (json && json.data && json.data.content) {
            const parsed: CloudSyncPayload = JSON.parse(json.data.content);
            notifyStatus('synced');
            return parsed;
          }
        }
      }
      setActiveSkyId('');
    }

    notifyStatus('error');
    return null;
  } catch (err) {
    console.error('Cloud download error:', err);
    notifyStatus('error');
    return null;
  }
}

// Automatic silent background sync wrappers
export async function autoSaveToCloud(logs: WorkoutLog[], scheduleConfig?: UserScheduleConfig): Promise<boolean> {
  const syncKey = getActiveSyncKey();
  return uploadToCloud(syncKey, logs, scheduleConfig);
}

export async function autoFetchFromCloud(): Promise<CloudSyncPayload | null> {
  const syncKey = getActiveSyncKey();
  return downloadFromCloud(syncKey);
}
