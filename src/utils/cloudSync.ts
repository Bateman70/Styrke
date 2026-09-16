import { WorkoutLog, UserScheduleConfig } from '../types/workout';

// Free, fast cloud key-value API endpoint for instant cross-device sync (Mobile <-> PC)
// Uses kvdb.io public buckets (no registration required)
const BUCKET_ID = 'styrke_app_sync_v1_89231';
const BASE_URL = `https://kvdb.io/${BUCKET_ID}`;

export interface CloudSyncPayload {
  syncCode: string;
  updatedAt: string;
  logs: WorkoutLog[];
  scheduleConfig?: UserScheduleConfig;
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
