import { WorkoutLog, UserScheduleConfig } from '../types/workout';

const DEFAULT_SYNC_KEY = 'styrke55';

export interface CloudSyncPayload {
  syncCode: string;
  updatedAt: string;
  logs: WorkoutLog[];
  scheduleConfig?: UserScheduleConfig;
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

// 1. Upload to Cloud (/api/sync endpoint on same domain)
export async function uploadToCloud(
  syncCode: string,
  logs: WorkoutLog[],
  scheduleConfig?: UserScheduleConfig
): Promise<boolean> {
  const cleanCode = syncCode.trim().toLowerCase() || DEFAULT_SYNC_KEY;
  setActiveSyncKey(cleanCode);

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncCode: cleanCode,
        logs,
        scheduleConfig,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.success === true;
    }
    return false;
  } catch (err) {
    console.error('Cloud upload error:', err);
    return false;
  }
}

// 2. Download from Cloud (/api/sync/:code endpoint on same domain)
export async function downloadFromCloud(syncCode: string): Promise<CloudSyncPayload | null> {
  const cleanCode = syncCode.trim().toLowerCase() || DEFAULT_SYNC_KEY;

  try {
    const res = await fetch(`/api/sync/${encodeURIComponent(cleanCode)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.logs) {
        return {
          syncCode: cleanCode,
          updatedAt: data.updatedAt,
          logs: data.logs,
          scheduleConfig: data.scheduleConfig,
        };
      }
    }
    return null;
  } catch (err) {
    console.error('Cloud download error:', err);
    return null;
  }
}

// Automatic silent background wrappers
export async function autoSaveToCloud(logs: WorkoutLog[], scheduleConfig?: UserScheduleConfig): Promise<boolean> {
  const syncKey = getActiveSyncKey();
  return uploadToCloud(syncKey, logs, scheduleConfig);
}

export async function autoFetchFromCloud(): Promise<CloudSyncPayload | null> {
  const syncKey = getActiveSyncKey();
  return downloadFromCloud(syncKey);
}
