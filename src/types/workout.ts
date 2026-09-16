export type WorkoutType = 'okt-a' | 'okt-b' | 'lop';
export type WorkoutStatus = 'scheduled' | 'completed' | 'skipped';

export interface Exercise {
  id: string;
  name: string;
  category: 'Warm-up' | 'Main' | 'Superset 1' | 'Superset 2';
  groupLabel?: string; // e.g., "A1", "A2", "B1", "B2"
  defaultSets: number;
  defaultReps: string; // e.g. "8–10" or "30–45 sek"
  restSeconds: number; // e.g. 90, 45, 30
  focus: string; // Instructions / focus points from PDF
  videoUrl: string; // YouTube embed / watch URL
  videoTitle: string;
  videoThumb?: string;
  isPerSide?: boolean;
}

export interface WorkoutProgram {
  id: WorkoutType;
  title: string;
  subtitle: string;
  estimatedTime: string;
  focusAreas: string[];
  exercises: Exercise[];
}

export interface LoggedSet {
  setNumber: number;
  weightKg: number | string;
  repsCompleted: number | string;
  completed: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  exerciseName: string;
  sets: LoggedSet[];
  notes?: string;
}

export interface RunDetails {
  distanceKm: number;
  durationMinutes: number;
  runType: 'Rolig langtur' | 'Intervall' | 'Tempo' | 'Restitusjon' | 'Annet';
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  date: string; // YYYY-MM-DD
  type: WorkoutType;
  status: WorkoutStatus;
  completedAt?: string;
  exercises?: LoggedExercise[];
  runDetails?: RunDetails;
  notes?: string;
}

export interface UserScheduleConfig {
  frequency: 2 | 3; // 2 or 3 days/week
  startDate: string; // YYYY-MM-DD
  targetDaysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
}
