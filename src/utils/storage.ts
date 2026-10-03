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

// Load logs from LocalStorage
export const getStoredLogs = (): WorkoutLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) return getInitialSeedLogs();
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load logs from localStorage', err);
    return getInitialSeedLogs();
  }
};

// Save logs to LocalStorage
export const saveStoredLogs = (logs: WorkoutLog[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    localStorage.setItem('styrke_app_local_updated_at', new Date().toISOString());
  } catch (err) {
    console.error('Failed to save logs to localStorage', err);
  }
};

// Smart log merger to ensure user-created schedules and cloud logs never overwrite each other
export const mergeWorkoutLogs = (localLogs: WorkoutLog[], incomingLogs: WorkoutLog[]): WorkoutLog[] => {
  if (!Array.isArray(incomingLogs) || incomingLogs.length === 0) return localLogs || [];
  if (!Array.isArray(localLogs) || localLogs.length === 0) return incomingLogs;

  const map = new Map<string, WorkoutLog>();

  // 1. Add all local logs
  localLogs.forEach((l) => {
    if (l && l.id) map.set(l.id, l);
  });

  // 2. Safely merge incoming logs
  incomingLogs.forEach((inc) => {
    if (!inc || !inc.id) return;

    const existing = map.get(inc.id);
    if (!existing) {
      map.set(inc.id, inc);
    } else {
      // Keep completed log over scheduled log
      if (inc.status === 'completed' && existing.status !== 'completed') {
        map.set(inc.id, inc);
      } else if (existing.status === 'completed' && inc.status !== 'completed') {
        // Keep existing completed log
      } else {
        const existingDetailCount = (existing.exercises?.length || 0) + (existing.notes ? 1 : 0);
        const incomingDetailCount = (inc.exercises?.length || 0) + (inc.notes ? 1 : 0);

        if (incomingDetailCount >= existingDetailCount) {
          map.set(inc.id, inc);
        }
      }
    }
  });

  const merged = Array.from(map.values());
  merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return merged;
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

  const logs: WorkoutLog[] = [
    {
      id: `seed-okt-a-${dateA}`,
      date: dateA,
      type: 'okt-a',
      status: 'scheduled',
    },
    {
      id: `seed-okt-b-${dateB}`,
      date: dateB,
      type: 'okt-b',
      status: 'scheduled',
    },
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
          id: `auto-${currentType}-${dateStr}-${Math.random().toString(36).substr(2, 5)}`,
          date: dateStr,
          type: currentType,
          status: 'scheduled',
        });
      }

      currentType = currentType === 'okt-a' ? 'okt-b' : 'okt-a';
    }
  }

  saveStoredLogs(newLogs);
  return newLogs;
};
