import { WorkoutLog, UserScheduleConfig } from '../types/workout';

// 100% Reliable CORS-enabled Cloud REST API
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

// 1. Upload to Cloud (Seamless PUT update + automatic POST fallback if ID expired)
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
    logs: minifiedLogs(logs),
    scheduleConfig,
  };

  const name = `styrke_app_${cleanCode}`;
  const stringifiedContent = JSON.stringify(payload);
  let storedObjectId = localStorage.getItem(getObjectIdKey(cleanCode));

  try {
    // If we have an existing object ID, try updating via PUT
    if (storedObjectId) {
      const putRes = await fetch(`${REST_API_URL}/${storedObjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          data: { content: stringifiedContent },
        }),
      });

      if (putRes.ok) {
        localStorage.setItem('styrke_last_cloud_sync_time', new Date().toISOString());
        return true;
      }

      // If PUT failed (e.g. ID expired or deleted on server), clear stale ID and create new via POST
      localStorage.removeItem(getObjectIdKey(cleanCode));
      localStorage.removeItem(`styrke_shared_id_${cleanCode}`);
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
        localStorage.setItem(getObjectIdKey(cleanCode), created.id);
        localStorage.setItem(`styrke_shared_id_${cleanCode}`, created.id);
        localStorage.setItem('styrke_last_cloud_sync_time', new Date().toISOString());
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('Cloud upload error:', err);
    return false;
  }
}

// 2. Download from Cloud (Tries stored ID, then searches by name)
export async function downloadFromCloud(syncCode: string): Promise<CloudSyncPayload | null> {
  const cleanCode = syncCode.trim().toLowerCase() || DEFAULT_SYNC_KEY;
  let objectId = localStorage.getItem(getObjectIdKey(cleanCode)) || localStorage.getItem(`styrke_shared_id_${cleanCode}`);

  try {
    if (objectId) {
      const res = await fetch(`${REST_API_URL}/${objectId}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data && json.data.content) {
          const parsed: CloudSyncPayload = JSON.parse(json.data.content);
          localStorage.setItem('styrke_last_cloud_sync_time', new Date().toISOString());
          return parsed;
        }
      }
      // Stale ID, clear it
      localStorage.removeItem(getObjectIdKey(cleanCode));
      localStorage.removeItem(`styrke_shared_id_${cleanCode}`);
    }

    // Search cloud database by app name if objectId wasn't stored locally or was stale
    const searchRes = await fetch(REST_API_URL);
    if (searchRes.ok) {
      const items = await searchRes.json();
      if (Array.isArray(items)) {
        // Find latest object matching this sync code
        const matched = items.reverse().find((item: any) => item.name === `styrke_app_${cleanCode}`);
        if (matched && matched.data && matched.data.content) {
          localStorage.setItem(getObjectIdKey(cleanCode), matched.id);
          const parsed: CloudSyncPayload = JSON.parse(matched.data.content);
          localStorage.setItem('styrke_last_cloud_sync_time', new Date().toISOString());
          return parsed;
        }
      }
    }

    return null;
  } catch (err) {
    console.error('Cloud download error:', err);
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
