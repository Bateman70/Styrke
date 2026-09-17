import { WorkoutLog, UserScheduleConfig, WorkoutType } from '../types/workout';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

const STORAGE_KEYS = {
  LOGS: 'styrke_app_workout_logs_v1',
  SCHEDULE_CONFIG: 'styrke_app_schedule_config_v1',
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
  } catch (err) {
    console.error('Failed to save logs to localStorage', err);
  }
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
