import { WorkoutLog, UserScheduleConfig } from '../types/workout';

// 100% Reliable, CORS-enabled REST API Cloud Storage
const REST_API_URL = 'https://api.restful-api.dev/objects';
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

// Helper: Local storage key for storing cloud object ID
function getObjectIdKey(code: string): string {
  return `styrke_cloud_obj_id_${code.trim().toLowerCase()}`;
}

// 1. Upload to Cloud (Works both automatically and manually)
export async function uploadToCloud(
  syncCode: string,
  logs: WorkoutLog[],
  scheduleConfig?: UserScheduleConfig
): Promise<boolean> {
  const cleanCode = syncCode.trim().toLowerCase() || DEFAULT_SYNC_KEY;
  setActiveSyncKey(cleanCode);

  const payload: CloudSyncPayload = {
    syncCode: cleanCode,
    updatedAt: new Date().toISOString(),
    logs,
    scheduleConfig,
  };

  const storedObjectId = localStorage.getItem(getObjectIdKey(cleanCode));

  try {
    // If we have an existing object ID, update via PUT
    if (storedObjectId) {
      const putRes = await fetch(`${REST_API_URL}/${storedObjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `styrke_app_${cleanCode}`,
          data: payload,
        }),
      });

      if (putRes.ok) {
        return true;
      }
    }

    // Otherwise create a new cloud object via POST
    const postRes = await fetch(REST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `styrke_app_${cleanCode}`,
        data: payload,
      }),
    });

    if (postRes.ok) {
      const created = await postRes.json();
      if (created && created.id) {
        localStorage.setItem(getObjectIdKey(cleanCode), created.id);
        // Also save shared code-to-id mapping in localStorage
        localStorage.setItem(`styrke_shared_id_${cleanCode}`, created.id);
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('Cloud upload error:', err);
    return false;
  }
}

// 2. Download from Cloud (Works both automatically and manually)
export async function downloadFromCloud(syncCode: string): Promise<CloudSyncPayload | null> {
  const cleanCode = syncCode.trim().toLowerCase() || DEFAULT_SYNC_KEY;
  
  let objectId = localStorage.getItem(getObjectIdKey(cleanCode)) || localStorage.getItem(`styrke_shared_id_${cleanCode}`);

  try {
    if (objectId) {
      const res = await fetch(`${REST_API_URL}/${objectId}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data && json.data.logs) {
          return json.data as CloudSyncPayload;
        }
      }
    }

    // Search API if objectId wasn't found in local storage
    const searchRes = await fetch(REST_API_URL);
    if (searchRes.ok) {
      const items = await searchRes.json();
      if (Array.isArray(items)) {
        const matched = items.find(
          (item: any) => item.name === `styrke_app_${cleanCode}` || item.data?.syncCode === cleanCode
        );
        if (matched && matched.data && matched.data.logs) {
          localStorage.setItem(getObjectIdKey(cleanCode), matched.id);
          return matched.data as CloudSyncPayload;
        }
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
