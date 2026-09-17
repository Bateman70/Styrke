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

// 1. Upload to Cloud (Guaranteed stringified JSON data format)
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
  const storedObjectId = localStorage.getItem(getObjectIdKey(cleanCode));

  try {
    // If we have an existing object ID, update via PUT
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
        return true;
      }
    }

    // Otherwise create new cloud object via POST
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
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('Cloud upload error:', err);
    return false;
  }
}

// 2. Download from Cloud
export async function downloadFromCloud(syncCode: string): Promise<CloudSyncPayload | null> {
  const cleanCode = syncCode.trim().toLowerCase() || DEFAULT_SYNC_KEY;
  const objectId = localStorage.getItem(getObjectIdKey(cleanCode)) || localStorage.getItem(`styrke_shared_id_${cleanCode}`);

  try {
    if (objectId) {
      const res = await fetch(`${REST_API_URL}/${objectId}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data && json.data.content) {
          const parsed: CloudSyncPayload = JSON.parse(json.data.content);
          return parsed;
        }
      }
    }

    // Search cloud database if objectId wasn't stored locally
    const searchRes = await fetch(REST_API_URL);
    if (searchRes.ok) {
      const items = await searchRes.json();
      if (Array.isArray(items)) {
        const matched = items.find((item: any) => item.name === `styrke_app_${cleanCode}`);
        if (matched && matched.data && matched.data.content) {
          localStorage.setItem(getObjectIdKey(cleanCode), matched.id);
          const parsed: CloudSyncPayload = JSON.parse(matched.data.content);
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
