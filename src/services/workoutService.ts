
import { Exercise, Set, WorkoutTemplate, ActiveWorkout, WorkoutHistory } from '@/types/workout';

// Utility functions to generate IDs
const generateId = () => Date.now().toString();
const generateExercise = (name = "", order_num = 0): Exercise => ({
  id: generateId(),
  name: name,
  exerciseType: 'reps', // Only 'reps' type is now available
  sets: [{ 
    id: generateId(), 
    weight: null, 
    reps: null,
    completed: false 
  }],
  order_num: order_num,
});

// Service functions
export const createWorkoutTemplate = (name: string): WorkoutTemplate => {
  return {
    id: generateId(),
    name,
    exercises: [generateExercise("", 0)], 
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const startWorkout = (template: any): ActiveWorkout => { 
  const transformedExercises = (template.exercises || []).map((ex: any) => {
    // const currentExerciseType = ex.exerciseType || 'reps'; // No longer needed, always 'reps'
    return {
      id: ex.id || generateId(), 
      name: ex.exercise_name || ex.name || '', 
      comment: ex.notes || ex.comment,        
      exerciseType: 'reps', // Always 'reps'
      order_num: ex.order_num !== undefined ? ex.order_num : 0,
      sets: (ex.sets || []).map((s: any) => ({
        id: s.id || generateId(), 
        weight: s.kg ?? s.weight ?? null, 
        reps: s.reps ?? 0, // Directly assign reps
        // duration: currentExerciseType === 'timer' ? (s.duration ?? 0) : null, // Duration removed
        completed: s.completed === undefined ? false : !!s.completed, 
      })),
    };
  });

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
): Array<{ weight: number | null; reps: number | null; } | null> | null => { // Removed duration from return type
  if (!history || history.length === 0) {
    return null;
  }

  for (const historyEntry of history) {
    if (historyEntry.workout_details && historyEntry.workout_details.exercises) {
      const matchingExerciseInHistory = historyEntry.workout_details.exercises.find(
        (ex) => ex.name.toLowerCase() === exerciseName.toLowerCase()
      );

      if (matchingExerciseInHistory) {
        if (!matchingExerciseInHistory.sets || matchingExerciseInHistory.sets.length === 0) {
          return []; 
        }
        
        // const historicalExerciseType = matchingExerciseInHistory.exerciseType || 'reps'; // Not strictly needed now but good for clarity if old data exists

        const completedSetsData: Array<{ weight: number | null; reps: number | null; } | null> = []; // Removed duration
        for (const historicalSet of matchingExerciseInHistory.sets) {
          if (historicalSet.completed) {
            completedSetsData.push({
              weight: historicalSet.weight,
              reps: historicalSet.reps, 
              // duration: historicalSet.duration, // Duration removed
            });
          } else {
            completedSetsData.push(null); 
          }
        }
        return completedSetsData;
      }
    }
  }
  return null; 
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
