
export interface Set {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: Set[];
  comment?: string;
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
  // Potentially other fields like description if they are part of what's saved
}

export interface WorkoutHistory {
  history_db_id: string; // Corresponds to the 'id' column in the 'history' table
  user_id?: string; // Optional, if needed for display or other logic
  action_summary: string; // Summary of the action, e.g., "Séance 'X' terminée le Y"
  logged_at: string; // Timestamp of when the history entry was created (ISO string)
  workout_details: ActiveWorkout; // The full details of the workout session that was completed
}
