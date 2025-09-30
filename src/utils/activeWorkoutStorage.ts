import { ActiveWorkout, Exercise, Set } from '../types/workout';

const ACTIVE_WORKOUT_KEY = 'activeWorkout';

// Helper function to safely convert a date input to an ISO string
const safeDateToISOString = (dateInput: any): string | undefined => {
  if (dateInput instanceof Date) {
    if (!isNaN(dateInput.getTime())) {
      return dateInput.toISOString();
    }
    return undefined; // Invalid Date object
  }
  if (typeof dateInput === 'string') {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
    return undefined; // String that doesn't parse to a valid date
  }
  if (typeof dateInput === 'number') { // Handle timestamps
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
    return undefined; // Number that doesn't parse to a valid date
  }
  return undefined; // Null, undefined, or other types
};

// Helper function to convert dates to ISO strings for serialization
const serializeWorkoutDates = (workout: ActiveWorkout): any => {
  // Create a shallow copy for modification, deep copy exercises separately if needed.
  // JSON.parse(JSON.stringify(workout)) is safe but can be slow for large objects.
  // We only modify top-level date properties here.
  const serializableWorkout = { ...workout };

  serializableWorkout.startedAt = safeDateToISOString(workout.startedAt) as any; // Cast to any for assignment
  serializableWorkout.pausedAt = workout.pausedAt ? safeDateToISOString(workout.pausedAt) : undefined;
  serializableWorkout.createdAt = safeDateToISOString(workout.createdAt) as any;
  serializableWorkout.updatedAt = safeDateToISOString(workout.updatedAt) as any;
  
  // Ensure exercises and sets are part of the copied object.
  // If exercises/sets themselves contained dates, they'd need similar treatment.
  serializableWorkout.exercises = workout.exercises.map(ex => ({
    ...ex,
    sets: ex.sets.map(set => ({ ...set }))
  }));

  return serializableWorkout;
};

// Helper function to safely convert an ISO string back to a Date object
const safeISOStringToDate = (isoString: any): Date | undefined => {
  if (typeof isoString === 'string') {
    const d = new Date(isoString);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }
  return undefined; // Not a string or doesn't parse to a valid date
};

// Helper function to convert ISO strings back to Date objects after parsing
const deserializeWorkoutDates = (parsedWorkout: any): ActiveWorkout => {
  const workoutWithDates = { ...parsedWorkout } as ActiveWorkout;

  workoutWithDates.startedAt = safeISOStringToDate(parsedWorkout.startedAt) as Date; // Expect startedAt to be valid
  workoutWithDates.pausedAt = safeISOStringToDate(parsedWorkout.pausedAt);
  workoutWithDates.createdAt = safeISOStringToDate(parsedWorkout.createdAt) as Date; // Expect createdAt to be valid
  workoutWithDates.updatedAt = safeISOStringToDate(parsedWorkout.updatedAt) as Date; // Expect updatedAt to be valid

  // Ensure exercises and sets are correctly typed after parsing
  // And ensure they are actually present on parsedWorkout
  workoutWithDates.exercises = (parsedWorkout.exercises || []).map((ex: any) => ({
    ...ex,
    sets: (ex.sets || []).map((set: any) => ({ ...set } as Set))
  } as Exercise));

  return workoutWithDates;
};

export const saveActiveWorkout = (workout: ActiveWorkout): void => {
  try {
    const serializableWorkout = serializeWorkoutDates(workout);
    // Only attempt to stringify if serializableWorkout is not null/undefined
    if (serializableWorkout) {
        localStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(serializableWorkout));
    } else {
        console.error('Failed to serialize workout, not saving to localStorage.');
    }
  } catch (error) {
    console.error('Error saving active workout to localStorage:', error);
    // Optionally, notify the user or handle the error in a more user-friendly way
  }
};

export const getActiveWorkout = (): ActiveWorkout | null => {
  try {
    const storedWorkoutJson = localStorage.getItem(ACTIVE_WORKOUT_KEY);
    if (!storedWorkoutJson) {
      return null;
    }
    const parsedWorkout = JSON.parse(storedWorkoutJson);
    return deserializeWorkoutDates(parsedWorkout);
  } catch (error) {
    console.error('Error retrieving active workout from localStorage:', error);
    // It might be good to clear the corrupted item if parsing fails
    // clearActiveWorkout(); 
    return null;
  }
};

export const clearActiveWorkout = (): void => {
  try {
    localStorage.removeItem(ACTIVE_WORKOUT_KEY);
  } catch (error) {
    console.error('Error clearing active workout from localStorage:', error);
  }
};
