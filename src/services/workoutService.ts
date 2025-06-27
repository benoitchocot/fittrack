
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
    id: ex.id || generateId(), 
    name: ex.exercise_name || ex.name || '', 
    comment: ex.notes || ex.comment,
    order_num: ex.order_num !== undefined ? ex.order_num : 0, // Ensure order_num is preserved or defaulted
    sets: (ex.sets || []).map((s: any) => ({
      id: s.id || generateId(), 
      weight: s.kg ?? s.weight ?? null, 
      reps: s.setType === 'timer' ? null : (s.reps ?? null),
      duration: s.setType === 'reps' ? null : (s.duration ?? null),
      setType: s.setType || 'reps', // Default to 'reps' if not specified from template
      completed: s.completed === undefined ? false : !!s.completed, 
    })),
  }));

  // Construct the base of the active workout, excluding the original exercises
  const { exercises, ...restOfTemplate } = template;

  return {
    ...restOfTemplate, 
    exercises: transformedExercises, 
    startedAt: new Date(),
    isActive: true,
    createdAt: new Date(template.createdAt), // Ensure these are Date objects
    updatedAt: new Date(template.updatedAt), // Ensure these are Date objects
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
): Array<{ weight: number | null; reps: number | null; duration: number | null; setType: 'reps' | 'timer' } | null> | null => {
  if (!history || history.length === 0) {
    return null;
  }

  for (const historyEntry of history) {
    if (historyEntry.workout_details && historyEntry.workout_details.exercises) {
      const matchingExercise = historyEntry.workout_details.exercises.find(
        (ex) => ex.name.toLowerCase() === exerciseName.toLowerCase()
      );

      if (matchingExercise) {
        if (!matchingExercise.sets || matchingExercise.sets.length === 0) {
          return []; 
        }
        // Ensure historical sets have setType, default to 'reps' if missing from old data
        const setsWithDefaults = matchingExercise.sets.map(s => ({
          ...s,
          setType: s.setType || 'reps',
          duration: s.duration || null,
          reps: s.reps || null,
        }));

        const completedSetsData: Array<{ weight: number | null; reps: number | null; duration: number | null; setType: 'reps' | 'timer' } | null> = [];
        for (const historicalSet of setsWithDefaults) {
          if (historicalSet.completed) {
            completedSetsData.push({
              weight: historicalSet.weight,
              reps: historicalSet.setType === 'timer' ? null : historicalSet.reps,
              duration: historicalSet.setType === 'reps' ? null : historicalSet.duration,
              setType: historicalSet.setType,
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
