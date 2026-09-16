import { WorkoutLog, UserScheduleConfig } from '../types/workout';

// Automatic Cloud Database Sync (No manual clicks needed!)
const BUCKET_ID = 'styrke_app_sync_auto_v2_99481';
const BASE_URL = `https://kvdb.io/${BUCKET_ID}`;

// Default shared project key for automatic cross-device sync
const DEFAULT_SYNC_KEY = 'styrke_hovedbruker_55';

export interface CloudSyncPayload {
  syncCode: string;
  updatedAt: string;
  logs: WorkoutLog[];
  scheduleConfig?: UserScheduleConfig;
}

// Get or set device sync key
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

// Silent automatic upload to cloud database
export async function autoSaveToCloud(logs: WorkoutLog[], scheduleConfig?: UserScheduleConfig): Promise<boolean> {
  const syncKey = getActiveSyncKey();
  return uploadToCloud(syncKey, logs, scheduleConfig);
}

// Silent automatic download from cloud database
export async function autoFetchFromCloud(): Promise<CloudSyncPayload | null> {
  const syncKey = getActiveSyncKey();
  return downloadFromCloud(syncKey);
}

// Upload data to Cloud using Sync Code
export async function uploadToCloud(syncCode: string, logs: WorkoutLog[], scheduleConfig?: UserScheduleConfig): Promise<boolean> {
  const cleanCode = syncCode.trim().toLowerCase();
  if (!cleanCode) return false;

  const payload: CloudSyncPayload = {
    syncCode: cleanCode,
    updatedAt: new Date().toISOString(),
    logs,
    scheduleConfig,
  };

  try {
    const res = await fetch(`${BASE_URL}/${cleanCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error('Cloud upload error:', err);
    return false;
  }
}

// Download data from Cloud using Sync Code
export async function downloadFromCloud(syncCode: string): Promise<CloudSyncPayload | null> {
  const cleanCode = syncCode.trim().toLowerCase();
  if (!cleanCode) return null;

  try {
    const res = await fetch(`${BASE_URL}/${cleanCode}`);
    if (!res.ok) return null;
    const data: CloudSyncPayload = await res.json();
    return data;
  } catch (err) {
    console.error('Cloud download error:', err);
    return null;
  }
}
