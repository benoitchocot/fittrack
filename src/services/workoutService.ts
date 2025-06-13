
import { Exercise, Set, WorkoutTemplate, ActiveWorkout, WorkoutHistory } from '@/types/workout';

// Utility functions to generate IDs
const generateId = () => Date.now().toString();
const generateExercise = (name = "", order_num = 0): Exercise => ({
  id: generateId(),
  name: name,
  sets: [{ id: generateId(), weight: null, reps: null, completed: false }],
  order_num: order_num, // Assign order_num
});

// Service functions
export const createWorkoutTemplate = (name: string): WorkoutTemplate => {
  return {
    id: generateId(),
    name,
    exercises: [generateExercise("", 0)], // Pass initial order_num
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const startWorkout = (template: any): ActiveWorkout => { // Use 'any' for template if it has backend fields
  const transformedExercises = (template.exercises || []).map((ex: any) => ({
    // It's crucial to ensure all properties expected by the Exercise type are here.
    // If the backend provides 'id' for exercises and sets, they must be preserved.
    // The generateId() utility in this file is for NEW entities, not for existing ones from a template.
    id: ex.id || generateId(), // Preserve backend ID if available, otherwise (less likely for template) generate
    name: ex.exercise_name || ex.name || '', // Map exercise_name to name, fallback to name, then empty
    comment: ex.notes || ex.comment,        // Map notes to comment, fallback to comment
    sets: (ex.sets || []).map((s: any) => ({
      id: s.id || generateId(), // Preserve backend ID for sets
      weight: s.kg ?? s.weight ?? null, // Map kg to weight, fallback to weight, then null
      reps: s.reps ?? null, // Default reps to null if undefined
      completed: s.completed === undefined ? false : !!s.completed, // Default completed if undefined
    })),
  }));

  // Construct the base of the active workout, excluding the original exercises
  const { exercises, ...restOfTemplate } = template;

  return {
    ...restOfTemplate, // Spread other template properties like id, name (template name), description
    exercises: transformedExercises, // Use the transformed exercises
    startedAt: new Date(),
    isActive: true,
    // Ensure WorkoutTemplate fields like createdAt, updatedAt are handled if they are part of 'template'
    // and expected in ActiveWorkout. The types suggest ActiveWorkout extends WorkoutTemplate.
    // If createdAt/updatedAt are strings, convert them:
    createdAt: new Date(template.createdAt),
    updatedAt: new Date(template.updatedAt),
  };
};

export const finishWorkout = (workout: ActiveWorkout): ActiveWorkout => {
  return {
    ...workout,
    finishedAt: new Date(),
    isActive: false,
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

export const getLastCompletedSetsForExercise = (
  exerciseName: string,
  history: WorkoutHistory[]
): Array<{ weight: number | null; reps: number | null } | null> | null => {
  if (!history || history.length === 0) {
    return null;
  }

  for (const historyEntry of history) {
    if (historyEntry.workout_details && historyEntry.workout_details.exercises) {
      const matchingExercise = historyEntry.workout_details.exercises.find(
        (ex) => ex.name.toLowerCase() === exerciseName.toLowerCase()
      );

      if (matchingExercise) {
        // Found the last performance of this exercise.
        // Process its sets.
        if (!matchingExercise.sets || matchingExercise.sets.length === 0) {
          return []; // Exercise found but had no sets, return empty array.
        }

        const completedSetsData: Array<{ weight: number | null; reps: number | null } | null> = [];
        for (const historicalSet of matchingExercise.sets) {
          if (historicalSet.completed) {
            completedSetsData.push({
              weight: historicalSet.weight,
              reps: historicalSet.reps,
            });
          } else {
            completedSetsData.push(null); // Set was not completed
          }
        }
        return completedSetsData;
      }
    }
  }

  return null; // No performance of this exercise name found in history
};

export const addExercise = (
  workout: WorkoutTemplate | ActiveWorkout
  // No need for exerciseName here if we follow the manual creation in TemplateEditor or always add a blank one
): WorkoutTemplate | ActiveWorkout => {
  const newOrderNum = workout.exercises.length;
  return {
    ...workout,
    exercises: [...workout.exercises, generateExercise("", newOrderNum)], // generateExercise now handles order_num
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
