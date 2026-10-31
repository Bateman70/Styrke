import { WorkoutLog, UserScheduleConfig, WorkoutType, UserProfile } from '../types/workout';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

const STORAGE_KEYS = {
  LOGS: 'styrke_app_workout_logs_v1',
  SCHEDULE_CONFIG: 'styrke_app_schedule_config_v1',
  USER_PROFILE: 'styrke_app_user_profile_v1',
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  age: 0,
  gender: 'mann',
  weightKg: 0,
  goal: 'lopere',
  location: 'senter',
  experience: 'middels',
  daysPerWeek: 2,
  hasCompletedSetup: false,
};

export const getUserProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) return DEFAULT_USER_PROFILE;
    return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_USER_PROFILE;
  }
};

export const saveUserProfile = (profile: UserProfile): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save user profile', err);
  }
};

// Clean and deduplicate workout logs:
// 1. All completed logs are 100% preserved.
// 2. Past uncompleted scheduled workouts (< today) are pruned.
// 3. Duplicate scheduled workouts on the same date are deduplicated (max 1 scheduled workout per date).
export const cleanAndDeduplicateLogs = (logs: WorkoutLog[]): WorkoutLog[] => {
  if (!Array.isArray(logs)) return [];
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const completedMap = new Map<string, WorkoutLog>();
  const completedStrengthDates = new Set<string>();
  const scheduledMap = new Map<string, WorkoutLog>();

  // Pass 1: Collect all completed workouts
  logs.forEach((log) => {
    if (!log || !log.date || !log.type) return;
    if (log.status !== 'completed') return;

    const key = `${log.date}_${log.type}`;
    if (log.type !== 'lop') {
      completedStrengthDates.add(log.date);
    }

    const existing = completedMap.get(key);
    if (!existing) {
      completedMap.set(key, log);
    } else {
      // Keep the one with richer logged content
      const existingScore = (existing.exercises?.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0) || 0) +
        (existing.notes ? 2 : 0) +
        (existing.runDetails ? 5 : 0);
      const logScore = (log.exercises?.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0) || 0) +
        (log.notes ? 2 : 0) +
        (log.runDetails ? 5 : 0);

      if (logScore >= existingScore) {
        completedMap.set(key, log);
      }
    }
  });

  // Pass 2: Collect scheduled workouts (only >= today, not conflicting with completed, max 1 per date)
  logs.forEach((log) => {
    if (!log || !log.date || !log.type) return;
    if (log.status !== 'scheduled') return;

    // Remove obsolete scheduled workouts from the past (< today)
    if (log.date < todayStr) return;

    const key = `${log.date}_${log.type}`;
    // If already completed on this date, do not keep a scheduled workout
    if (completedMap.has(key)) return;
    if (log.type !== 'lop' && completedStrengthDates.has(log.date)) return;

    // Deduplicate scheduled workouts by date (latest scheduled entry for that date wins)
    scheduledMap.set(log.date, log);
  });

  const result = [...Array.from(completedMap.values()), ...Array.from(scheduledMap.values())];
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
};

// Load logs from LocalStorage with automatic cleanup
export const getStoredLogs = (): WorkoutLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) return getInitialSeedLogs();
    const parsed: WorkoutLog[] = JSON.parse(raw);
    return cleanAndDeduplicateLogs(parsed);
  } catch (err) {
    console.error('Failed to load logs from localStorage', err);
    return getInitialSeedLogs();
  }
};

// Save logs to LocalStorage
export const saveStoredLogs = (logs: WorkoutLog[], customUpdatedAt?: string): void => {
  try {
    const cleaned = cleanAndDeduplicateLogs(logs);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(cleaned));
    localStorage.setItem('styrke_app_local_updated_at', customUpdatedAt || new Date().toISOString());
  } catch (err) {
    console.error('Failed to save logs to localStorage', err);
  }
};

// Smart log merger:
// 1. ALL completed logs from both local and cloud are 100% preserved.
// 2. Uncompleted/scheduled logs are NEVER mixed between two plans:
//    When replaceScheduleWithIncoming is true (default), all local uncompleted logs are deleted
//    and replaced exclusively by the incoming cloud schedule.
export const mergeWorkoutLogs = (
  localLogs: WorkoutLog[],
  incomingLogs: WorkoutLog[],
  replaceScheduleWithIncoming: boolean = true
): WorkoutLog[] => {
  const rawLocal = cleanAndDeduplicateLogs(localLogs || []);
  const rawIncoming = cleanAndDeduplicateLogs(incomingLogs || []);

  // If any real (non-demo) logs exist in either local or incoming, strip out initial demo seed logs
  const hasRealLogs =
    rawLocal.some((l) => !l.id.startsWith('seed-')) ||
    rawIncoming.some((l) => !l.id.startsWith('seed-'));

  const safeLocal = hasRealLogs ? rawLocal.filter((l) => !l.id.startsWith('seed-')) : rawLocal;
  const safeIncoming = hasRealLogs ? rawIncoming.filter((l) => !l.id.startsWith('seed-')) : rawIncoming;

  if (safeIncoming.length === 0 && !replaceScheduleWithIncoming) return safeLocal;
  if (safeLocal.length === 0) return safeIncoming;

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // 1. Preserve ALL completed logs from both devices/sessions
  const completedMap = new Map<string, WorkoutLog>();
  const completedStrengthDates = new Set<string>();

  safeLocal.filter((l) => l.status === 'completed').forEach((l) => {
    const key = `${l.date}_${l.type}`;
    completedMap.set(key, l);
    if (l.type !== 'lop') completedStrengthDates.add(l.date);
  });

  safeIncoming.filter((l) => l.status === 'completed').forEach((l) => {
    const key = `${l.date}_${l.type}`;
    if (l.type !== 'lop') completedStrengthDates.add(l.date);
    const existing = completedMap.get(key);
    if (!existing) {
      completedMap.set(key, l);
    } else {
      const existingScore = (existing.exercises?.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0) || 0) +
        (existing.notes ? 2 : 0) +
        (existing.runDetails ? 5 : 0);
      const logScore = (l.exercises?.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0) || 0) +
        (l.notes ? 2 : 0) +
        (l.runDetails ? 5 : 0);

      if (logScore >= existingScore) {
        completedMap.set(key, l);
      }
    }
  });

  // 2. Manage scheduled (uncompleted) workouts:
  // Never mix local and incoming schedules! Replace local uncompleted workouts with the active source.
  const scheduledMap = new Map<string, WorkoutLog>();
  const scheduleSource = replaceScheduleWithIncoming ? safeIncoming : safeLocal;

  scheduleSource
    .filter((l) => l.status === 'scheduled' && l.date >= todayStr)
    .forEach((l) => {
      const key = `${l.date}_${l.type}`;
      if (completedMap.has(key)) return;
      if (l.type !== 'lop' && completedStrengthDates.has(l.date)) return;
      scheduledMap.set(l.date, l);
    });

  const result = [...Array.from(completedMap.values()), ...Array.from(scheduledMap.values())];
  result.sort((a, b) => a.date.localeCompare(b.date));
  return cleanAndDeduplicateLogs(result);
};

// Load schedule config
export const getScheduleConfig = (): UserScheduleConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULE_CONFIG);
    if (!raw) {
      return {
        frequency: 2,
        startDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        targetDaysOfWeek: [1, 4], // Mandag (1), Torsdag (4)
      };
    }
    return JSON.parse(raw);
  } catch (err) {
    return {
      frequency: 2,
      startDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      targetDaysOfWeek: [1, 4],
    };
  }
};

// Save schedule config
export const saveScheduleConfig = (config: UserScheduleConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save config', err);
  }
};

// Helper: Seed initial demo logs for the current week so a new user immediately sees a working setup
function getInitialSeedLogs(): WorkoutLog[] {
  const today = new Date();
  const Monday = startOfWeek(today, { weekStartsOn: 1 });

  const dateA = format(addDays(Monday, 0), 'yyyy-MM-dd'); // Mandag
  const dateB = format(addDays(Monday, 3), 'yyyy-MM-dd'); // Torsdag
  const dateRun = format(addDays(Monday, 1), 'yyyy-MM-dd'); // Tirsdag
  const todayStr = format(today, 'yyyy-MM-dd');

  const logs: WorkoutLog[] = [
    {
      id: `seed-lop-${dateRun}`,
      date: dateRun,
      type: 'lop',
      status: 'completed',
      runDetails: {
        distanceKm: 8.5,
        durationMinutes: 48,
        runType: 'Rolig langtur',
        notes: 'DEMO-ØKT: Eksempel på logget løpetur. Fjernes automatisk når du lager din egen treningsplan.',
      },
    },
  ];

  if (dateA >= todayStr) {
    logs.push({
      id: `seed-okt-a-${dateA}`,
      date: dateA,
      type: 'okt-a',
      status: 'scheduled',
      notes: 'DEMO-ØKT: Fjernes automatisk når du lager din egen treningsplan.',
    });
  }

  if (dateB >= todayStr) {
    logs.push({
      id: `seed-okt-b-${dateB}`,
      date: dateB,
      type: 'okt-b',
      status: 'scheduled',
      notes: 'DEMO-ØKT: Fjernes automatisk når du lager din egen treningsplan.',
    });
  }

  return logs;
}

// Generate auto schedule logs for N weeks based on user-selected days of week
export const generateAutoSchedule = (
  selectedDays: number[],
  startDateStr: string,
  existingLogs: WorkoutLog[]
): WorkoutLog[] => {
  const startDate = new Date(startDateStr);
  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
  
  // 100% preserve all real completed logs, and remove all demo ("seed-") logs
  const completedLogs = existingLogs.filter((l) => l.status === 'completed' && !l.id.startsWith('seed-'));
  const newLogs: WorkoutLog[] = [...completedLogs];

  let currentType: WorkoutType = 'okt-a';

  const normalizedDays = selectedDays.map((d) => (d === 0 ? 7 : d)).sort((a, b) => a - b);

  for (let week = 0; week < 6; week++) {
    for (const dayNum of normalizedDays) {
      const dayOffset = dayNum - 1;
      const workoutDate = addDays(weekStart, week * 7 + dayOffset);
      const dateStr = format(workoutDate, 'yyyy-MM-dd');

      const alreadyCompleted = completedLogs.find((l) => isSameDay(new Date(l.date), workoutDate));
      if (!alreadyCompleted) {
        newLogs.push({
          id: `scheduled-${currentType}-${dateStr}`,
          date: dateStr,
          type: currentType,
          status: 'scheduled',
        });
      }

      currentType = currentType === 'okt-a' ? 'okt-b' : 'okt-a';
    }
  }

  const cleaned = cleanAndDeduplicateLogs(newLogs);
  saveStoredLogs(cleaned);
  return cleaned;
};
