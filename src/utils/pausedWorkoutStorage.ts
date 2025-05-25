import { ActiveWorkout, Exercise, Set } from '../types/workout';

const PAUSED_WORKOUT_KEY = 'pausedWorkout';

// Helper function to convert dates to ISO strings for serialization
const serializeWorkoutDates = (workout: ActiveWorkout): any => {
  const serializableWorkout = JSON.parse(JSON.stringify(workout)); // Deep copy

  serializableWorkout.startedAt = new Date(workout.startedAt).toISOString();
  if (workout.pausedAt) {
    serializableWorkout.pausedAt = new Date(workout.pausedAt).toISOString();
  }
  serializableWorkout.createdAt = new Date(workout.createdAt).toISOString();
  serializableWorkout.updatedAt = new Date(workout.updatedAt).toISOString();

  // Assuming exercises within WorkoutTemplate do not currently have date fields that need conversion.
  // If Exercise or Set types were to include Date objects in the future,
  // they would need to be handled here as well.
  // For example, if Exercise had a 'scheduledFor' date:
  // serializableWorkout.exercises = workout.exercises.map(ex => ({
  //   ...ex,
  //   scheduledFor: ex.scheduledFor ? new Date(ex.scheduledFor).toISOString() : undefined,
  //   sets: ex.sets.map(set => ({ ...set })) // ensure sets are also deep copied if they have complex objects
  // }));

  return serializableWorkout;
};

// Helper function to convert ISO strings back to Date objects after parsing
const deserializeWorkoutDates = (parsedWorkout: any): ActiveWorkout => {
  const workoutWithDates = { ...parsedWorkout } as ActiveWorkout;

  workoutWithDates.startedAt = new Date(parsedWorkout.startedAt);
  if (parsedWorkout.pausedAt) {
    workoutWithDates.pausedAt = new Date(parsedWorkout.pausedAt);
  }
  workoutWithDates.createdAt = new Date(parsedWorkout.createdAt);
  workoutWithDates.updatedAt = new Date(parsedWorkout.updatedAt);

  // Again, assuming exercises do not currently have date fields.
  // If they did, they would be converted back here.
  // For example:
  // workoutWithDates.exercises = parsedWorkout.exercises.map((ex: any) => ({
  //   ...ex,
  //   scheduledFor: ex.scheduledFor ? new Date(ex.scheduledFor) : undefined,
  //   sets: ex.sets.map((set: any) => ({ ...set }))
  // }));
  
  // Ensure exercises and sets are correctly typed after parsing
  workoutWithDates.exercises = parsedWorkout.exercises.map((ex: any) => ({
    ...ex,
    sets: ex.sets.map((set: any) => ({ ...set } as Set))
  } as Exercise));

  return workoutWithDates;
};

export const savePausedWorkout = (workout: ActiveWorkout): void => {
  try {
    const serializableWorkout = serializeWorkoutDates(workout);
    localStorage.setItem(PAUSED_WORKOUT_KEY, JSON.stringify(serializableWorkout));
  } catch (error) {
    console.error('Error saving paused workout to localStorage:', error);
    // Optionally, notify the user or handle the error in a more user-friendly way
  }
};

export const getPausedWorkout = (): ActiveWorkout | null => {
  try {
    const storedWorkoutJson = localStorage.getItem(PAUSED_WORKOUT_KEY);
    if (!storedWorkoutJson) {
      return null;
    }
    const parsedWorkout = JSON.parse(storedWorkoutJson);
    return deserializeWorkoutDates(parsedWorkout);
  } catch (error) {
    console.error('Error retrieving paused workout from localStorage:', error);
    // It might be good to clear the corrupted item if parsing fails
    // clearPausedWorkout(); 
    return null;
  }
};

export const clearPausedWorkout = (): void => {
  try {
    localStorage.removeItem(PAUSED_WORKOUT_KEY);
  } catch (error) {
    console.error('Error clearing paused workout from localStorage:', error);
  }
};
