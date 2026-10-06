import { WorkoutLog, UserScheduleConfig, WorkoutType, UserProfile } from '../types/workout';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

const STORAGE_KEYS = {
  LOGS: 'styrke_app_workout_logs_v1',
  SCHEDULE_CONFIG: 'styrke_app_schedule_config_v1',
  USER_PROFILE: 'styrke_app_user_profile_v1',
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  age: 55,
  gender: 'mann',
  weightKg: 95,
  goal: 'lopere',
  location: 'senter',
  experience: 'middels',
  daysPerWeek: 2,
  hasCompletedSetup: true,
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
// 3. Duplicate scheduled workouts on the same date are deduplicated.
export const cleanAndDeduplicateLogs = (logs: WorkoutLog[]): WorkoutLog[] => {
  if (!Array.isArray(logs)) return [];
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const completedMap = new Map<string, WorkoutLog>();
  const scheduledMap = new Map<string, WorkoutLog>();

  logs.forEach((log) => {
    if (!log || !log.date || !log.type) return;

    const key = `${log.date}_${log.type}`;

    if (log.status === 'completed') {
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
    } else if (log.status === 'scheduled') {
      // Remove obsolete scheduled workouts from the past (< today)
      if (log.date < todayStr) return;

      // If already completed on this date & type, do not add scheduled
      if (completedMap.has(key)) return;

      if (!scheduledMap.has(key)) {
        scheduledMap.set(key, log);
      }
    }
  });

  // Ensure no scheduled workouts conflict with completed ones
  completedMap.forEach((_, key) => {
    scheduledMap.delete(key);
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
export const saveStoredLogs = (logs: WorkoutLog[]): void => {
  try {
    const cleaned = cleanAndDeduplicateLogs(logs);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(cleaned));
    localStorage.setItem('styrke_app_local_updated_at', new Date().toISOString());
  } catch (err) {
    console.error('Failed to save logs to localStorage', err);
  }
};

// Smart log merger to ensure user-created schedules and cloud logs never overwrite each other
export const mergeWorkoutLogs = (localLogs: WorkoutLog[], incomingLogs: WorkoutLog[]): WorkoutLog[] => {
  const safeLocal = cleanAndDeduplicateLogs(localLogs || []);
  const safeIncoming = cleanAndDeduplicateLogs(incomingLogs || []);

  if (safeIncoming.length === 0) return safeLocal;
  if (safeLocal.length === 0) return safeIncoming;

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // 1. Preserve ALL completed logs from both devices/sessions
  const completedMap = new Map<string, WorkoutLog>();

  safeLocal.filter((l) => l.status === 'completed').forEach((l) => {
    const key = `${l.date}_${l.type}`;
    completedMap.set(key, l);
  });

  safeIncoming.filter((l) => l.status === 'completed').forEach((l) => {
    const key = `${l.date}_${l.type}`;
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

  // 2. Manage scheduled workouts:
  // Incoming cloud scheduled logs take priority for active training plan.
  const scheduledMap = new Map<string, WorkoutLog>();

  // Include non-colliding future local scheduled logs (that aren't default seed logs)
  const incomingHasScheduled = safeIncoming.some((l) => l.status === 'scheduled' && l.date >= todayStr);

  if (!incomingHasScheduled) {
    // If incoming doesn't have scheduled logs, retain local scheduled logs
    safeLocal.filter((l) => l.status === 'scheduled' && l.date >= todayStr).forEach((l) => {
      const key = `${l.date}_${l.type}`;
      if (!completedMap.has(key)) {
        scheduledMap.set(key, l);
      }
    });
  } else {
    // Incoming has an active schedule -> apply incoming scheduled logs
    safeIncoming.filter((l) => l.status === 'scheduled' && l.date >= todayStr).forEach((l) => {
      const key = `${l.date}_${l.type}`;
      if (!completedMap.has(key)) {
        scheduledMap.set(key, l);
      }
    });

    // If local had custom scheduled workouts on dates where incoming didn't schedule anything, keep non-seed ones
    safeLocal.filter((l) => l.status === 'scheduled' && l.date >= todayStr && !l.id.startsWith('seed-')).forEach((l) => {
      const key = `${l.date}_${l.type}`;
      if (!completedMap.has(key) && !scheduledMap.has(key)) {
        scheduledMap.set(key, l);
      }
    });
  }

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

// Helper: Seed initial logs for the current week so user immediately sees a working setup
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
        notes: 'God følelse i beina.',
      },
    },
  ];

  if (dateA >= todayStr) {
    logs.push({
      id: `seed-okt-a-${dateA}`,
      date: dateA,
      type: 'okt-a',
      status: 'scheduled',
    });
  }

  if (dateB >= todayStr) {
    logs.push({
      id: `seed-okt-b-${dateB}`,
      date: dateB,
      type: 'okt-b',
      status: 'scheduled',
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
  
  // 100% preserve all completed logs
  const completedLogs = existingLogs.filter((l) => l.status === 'completed');
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
