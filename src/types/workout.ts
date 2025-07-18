
export interface Set {
  id:string;
  weight: number | null;
  reps: number | null;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  exerciseType: 'reps'; // Type for all sets within this exercise
  sets: Set[];
  comment?: string;
  order_num: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: Exercise[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ActiveWorkout extends WorkoutTemplate {
  startedAt: Date;
  finishedAt?: Date;
  isActive: boolean;
  isPaused?: boolean;
  pausedAt?: Date;
  elapsedTimeBeforePause?: number;
  historicalRefs?: [string, Array<{ weight: number | null; reps: number | null; } | null> | null][];
  // Potentially other fields like description if they are part of what's saved
}

export interface WorkoutHistory {
  history_db_id: string; // Corresponds to the 'id' column in the 'history' table
  user_id?: string; // Optional, if needed for display or other logic
  action_summary: string; // Summary of the action, e.g., "Séance 'X' terminée le Y"
  logged_at: string; // Timestamp of when the history entry was created (ISO string)
  workout_details: ActiveWorkout; // The full details of the workout session that was completed
}
