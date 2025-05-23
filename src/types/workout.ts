
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
}

export interface WorkoutHistory {
  id: string;
  workoutId: string;
  name: string;
  startedAt: Date;
  finishedAt: Date;
  exercises: Exercise[];
}
