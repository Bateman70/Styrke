export type WorkoutType = 'okt-a' | 'okt-b' | 'lop' | 'fri-okt';
export type WorkoutStatus = 'scheduled' | 'completed' | 'skipped';

export interface Exercise {
  id: string;
  name: string;
  category: 'Warm-up' | 'Main' | 'Superset 1' | 'Superset 2' | 'Custom';
  groupLabel?: string; // e.g., "A1", "A2", "B1", "B2", "Friøvelse"
  defaultSets: number;
  defaultReps: string; // e.g. "8–10" or "30–45 sek"
  restSeconds: number; // e.g. 90, 45, 30
  focus: string; // Instructions / focus points
  videoUrl?: string; // YouTube embed / watch URL
  videoTitle?: string;
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

export type Gender = 'mann' | 'kvinne' | 'annet';

export type TrainingLocation = 'hjemme' | 'senter' | 'kombinasjon';

export type FitnessGoal = 
  | 'lopere'          // Styrke for løpere (skadeforebygging & beinstyrke)
  | 'helse_styrke'    // Generell helse, rygg/kjerne & funksjonell hverdagsstyrke
  | 'muskelvekst'     // Styrkeøkning & muskelbygging
  | 'vektnedgang';    // Høyere tempo, supersett & forbrenning

export type ExperienceLevel = 'nybegynner' | 'middels' | 'viderekommen';

export interface UserProfile {
  age: number;             // Eks: 55, 30, 42
  gender: Gender;          // Mann / Kvinne / Annet
  weightKg: number;        // Eks: 95, 70, 80
  goal: FitnessGoal;       // Primært treningsmål
  location?: TrainingLocation; // Hjemme, Treningssenter eller Kombinasjon
  experience: ExperienceLevel;
  daysPerWeek: number;     // 2, 3 eller 4 dager/uke
  hasCompletedSetup?: boolean;
}

export interface UserScheduleConfig {
  frequency: 2 | 3; // 2 or 3 days/week
  startDate: string; // YYYY-MM-DD
  targetDaysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
}
