
import { Exercise, Set, WorkoutTemplate, ActiveWorkout, WorkoutHistory } from '@/types/workout';

// Utility functions to generate IDs
const generateId = () => Date.now().toString();
const generateExercise = (name = ""): Exercise => ({
  id: generateId(),
  name: name,
  sets: [{ id: generateId(), weight: 0, reps: 0, completed: false }],
});

// Service functions
export const createWorkoutTemplate = (name: string): WorkoutTemplate => {
  return {
    id: generateId(),
    name,
    exercises: [generateExercise()],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const startWorkout = (template: WorkoutTemplate): ActiveWorkout => {
  return {
    ...template,
    startedAt: new Date(),
    isActive: true,
  };
};

export const finishWorkout = (workout: ActiveWorkout): WorkoutHistory => {
  return {
    id: generateId(),
    workoutId: workout.id,
    name: workout.name,
    exercises: workout.exercises,
    startedAt: workout.startedAt,
    finishedAt: new Date(),
  };
};

export const updateExercise = (
  workout: WorkoutTemplate | ActiveWorkout,
  exerciseId: string,
  updatedExercise: Exercise
): WorkoutTemplate | ActiveWorkout => {
  const updatedExercises = workout.exercises.map((exercise) =>
    exercise.id === exerciseId ? updatedExercise : exercise
  );

  return {
    ...workout,
    exercises: updatedExercises,
    updatedAt: new Date(),
  };
};

export const addExercise = (
  workout: WorkoutTemplate | ActiveWorkout,
  exerciseName = ""
): WorkoutTemplate | ActiveWorkout => {
  return {
    ...workout,
    exercises: [...workout.exercises, generateExercise(exerciseName)],
    updatedAt: new Date(),
  };
};

export const removeExercise = (
  workout: WorkoutTemplate | ActiveWorkout,
  exerciseId: string
): WorkoutTemplate | ActiveWorkout => {
  return {
    ...workout,
    exercises: workout.exercises.filter((exercise) => exercise.id !== exerciseId),
    updatedAt: new Date(),
  };
};
