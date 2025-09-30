import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ExerciseForm from "@/components/ExerciseForm";
import useRemoteStorage from "@/hooks/useRemoteStorage";
import { getToken } from "@/utils/auth";
import { WorkoutTemplate, ActiveWorkout as ActiveWorkoutType, Exercise, Set as ExerciseSet, WorkoutHistory } from "@/types/workout"; // Ensure Set is imported, aliasing if necessary e.g. as ExerciseSet
import { getActiveWorkout, saveActiveWorkout, clearActiveWorkout } from "@/utils/activeWorkoutStorage";
import { ArrowLeft, CheckCircle2, Play, Pause, PlusCircle } from "lucide-react"; // Added Play and Pause icons
import {
  startWorkout,
  updateExercise,
  finishWorkout,
  getLastCompletedSetsForExercise, 
} from "@/services/workoutService";
import { toast } from "sonner";
import BASE_URL from "@/config"; // Assuming BASE_URL is defined in config
import { apiFetch } from "../utils/api";

const ActiveWorkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    data: templates,
    loading: loadingTemplates,
  } = useRemoteStorage<WorkoutTemplate[]>({
    initialValue: [],
    endpoint: `${BASE_URL}templates`, // Use BASE_URL for consistency
    token: getToken() ?? "",
  });

  const {
    data: history, // Local optimistic cache of history
    setData: setLocalHistoryState, // Explicitly for local state
    postData: postHistoryEntryToServer, // Explicitly for POSTing one entry (if ever needed from here, unlikely)
    loading: loadingHistory,
  } = useRemoteStorage<WorkoutHistory[]>({ 
    initialValue: [],
    endpoint: `${BASE_URL}history`, // This endpoint now returns full WorkoutHistory objects
    token: getToken() ?? "",
  });

  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutType | null>(null);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showConfirmNewWorkoutDialog, setShowConfirmNewWorkoutDialog] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<WorkoutTemplate | null>(null);
  const [historicalRefs, setHistoricalRefs] = useState<Map<string, Array<{ weight: number | null; reps: number | null; } | null> | null>>(new Map());
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);



  // Effect for processing historical references
  useEffect(() => {
    if (activeWorkout && activeWorkout.id && !loadingHistory && history && !isHistoryLoaded) {
      const newRefs = new Map<string, Array<{ weight: number | null; reps: number | null; } | null> | null>();
      for (const exercise of activeWorkout.exercises) {
        const refDataArray = getLastCompletedSetsForExercise(exercise.name, history);
        newRefs.set(exercise.id, refDataArray);
      }
      setHistoricalRefs(newRefs);
      setIsHistoryLoaded(true);
    } else if ((!id || !activeWorkout) && historicalRefs.size > 0) {
      setHistoricalRefs(new Map());
    }
  }, [activeWorkout, history, loadingHistory, id, isHistoryLoaded]);

  // Auto-save workout state to localStorage
  useEffect(() => {
    if (activeWorkout) {
      saveActiveWorkout(activeWorkout);
    }
  }, [activeWorkout]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeWorkout && !activeWorkout.isPaused) {
      interval = setInterval(() => {
        // If elapsedTimeBeforePause exists, it means we've paused at least once.
        // The timer should continue from where it left off.
        // startedAt is adjusted on resume to simplify this.
        const startMs = new Date(activeWorkout.startedAt).getTime();
        const nowMs = Date.now();
        setElapsedTime(Math.floor((nowMs - startMs) / 1000));

      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeWorkout, activeWorkout?.isPaused, activeWorkout?.startedAt]);


  const handlePauseWorkout = () => {
    if (activeWorkout) {
      const updatedPausedWorkout: ActiveWorkoutType = {
        ...activeWorkout,
        isPaused: true,
        pausedAt: new Date(),
        elapsedTimeBeforePause: elapsedTime,
        historicalRefs: Array.from(historicalRefs.entries()),
      };
      setActiveWorkout(updatedPausedWorkout);
      saveActiveWorkout(updatedPausedWorkout); // Manually save the paused state immediately
      toast.info("Séance mise en pause.");
      // Optionally navigate away, e.g., navigate("/");
    }
  };

  const handleAddExercise = () => {
    if (activeWorkout) {
      const newSet: ExerciseSet = {
        id: Date.now().toString() + "-set",
        weight: null,
        reps: 0, // Always reps
        // duration field removed from Set type
        completed: false,
      };
      const newExercise: Exercise = {
        id: Date.now().toString(),
        name: "",
        exerciseType: 'reps', // Always 'reps'
        sets: [newSet],
        comment: "",
        order_num: activeWorkout.exercises.length // Assign order_num
      };
      const updatedExercises = [...activeWorkout.exercises, newExercise];
      const updatedWorkout = { ...activeWorkout, exercises: updatedExercises };
      setActiveWorkout(updatedWorkout);
      toast.success("Nouvel exercice ajouté !"); 
    }
  };

  const handleMoveExerciseUp = (exerciseId: string) => {
    if (activeWorkout) {
      const index = activeWorkout.exercises.findIndex(ex => ex.id === exerciseId);
      if (index > 0) {
        const newExercises = [...activeWorkout.exercises];
        const temp = newExercises[index];
        newExercises[index] = newExercises[index - 1];
        newExercises[index - 1] = temp;
        const updatedWorkout = { ...activeWorkout, exercises: newExercises };
        setActiveWorkout(updatedWorkout);
      }
    }
  };

  const handleMoveExerciseDown = (exerciseId: string) => {
    if (activeWorkout) {
      const index = activeWorkout.exercises.findIndex(ex => ex.id === exerciseId);
      if (index < activeWorkout.exercises.length - 1 && index !== -1) {
        const newExercises = [...activeWorkout.exercises];
        const temp = newExercises[index];
        newExercises[index] = newExercises[index + 1];
        newExercises[index + 1] = temp;
        const updatedWorkout = { ...activeWorkout, exercises: newExercises };
        setActiveWorkout(updatedWorkout);
      }
    }
  };

  const resumeWorkout = (workout: ActiveWorkoutType) => {
    // Adjust startedAt to make the timer continue correctly from elapsedTimeBeforePause
    const newStartedAt = new Date(Date.now() - (workout.elapsedTimeBeforePause || 0) * 1000);
    const updatedResumedWorkout: ActiveWorkoutType = {
      ...workout,
      isPaused: false,
      startedAt: newStartedAt,
      pausedAt: undefined,
      // elapsedTimeBeforePause remains as a record of the last pause point
    };
    setActiveWorkout(updatedResumedWorkout);
    toast.success("Séance reprise !");
  };

  useEffect(() => {
    const activeWorkoutData = getActiveWorkout();
    if (activeWorkoutData) {
      if (location.state?.resume) {
        resumeWorkout(activeWorkoutData);
      } else {
        setActiveWorkout(activeWorkoutData);
      }
      if (activeWorkoutData.historicalRefs) {
        setHistoricalRefs(new Map(activeWorkoutData.historicalRefs));
        setIsHistoryLoaded(true);
      }
      if (activeWorkoutData.isPaused && activeWorkoutData.elapsedTimeBeforePause) {
        setElapsedTime(activeWorkoutData.elapsedTimeBeforePause);
      } else if (activeWorkoutData.elapsedTimeBeforePause) {
        // Resumed but tab closed, calculate time since it was "resumed" (unpaused)
        const timeSinceUnpaused = activeWorkoutData.pausedAt ? (new Date().getTime() - new Date(activeWorkoutData.pausedAt).getTime()) / 1000 : 0;
        setElapsedTime(Math.floor(activeWorkoutData.elapsedTimeBeforePause + timeSinceUnpaused));
      } else {
        // No pause info, just calculate from start
        const start = new Date(activeWorkoutData.startedAt).getTime();
        const now = new Date().getTime();
        setElapsedTime(Math.floor((now - start) / 1000));
      }

      // If there's a paused workout, and user is trying to load a new one via URL
      if (id && (!activeWorkoutData.id || parseInt(id) !== activeWorkoutData.id)) {
         // Check if the id from URL matches the paused workout's template id
         // Assuming WorkoutTemplate's id is a number and ActiveWorkout's id (from WorkoutTemplate) is also a number
        const templateIdFromUrl = parseInt(id);
        if (templateIdFromUrl !== activeWorkoutData.id) { // If URL id is different from paused workout's template id
            const template = templates.find((t) => t.id === templateIdFromUrl);
            if (template) {
                setPendingTemplate(template);
                setShowConfirmNewWorkoutDialog(true);
            }
        }
      }
    } else if (!loadingTemplates && templates.length > 0 && id) {
      // No paused workout, try to load from template ID
      const template = templates.find((t) => t.id === parseInt(id));
      if (template) {
        setActiveWorkout(startWorkout(template));
        // Timer for new workout will start in the next useEffect
      } else {
        navigate("/");
        toast.error("Modèle de séance introuvable");
      }
    }
  }, [id, templates, loadingTemplates, navigate, location.state?.resume]); // Removed activeWorkout from deps to avoid loop

  const handleResumeWorkout = () => {
    if (activeWorkout && activeWorkout.isPaused) {
      resumeWorkout(activeWorkout);
    }
  };

  const handleExerciseUpdate = (updatedExercise: Exercise) => {
    if (activeWorkout) {
      const updatedWorkout = updateExercise(activeWorkout, updatedExercise.id, updatedExercise) as ActiveWorkoutType;
      setActiveWorkout(updatedWorkout);
    }
  };

  const handleDeleteExercise = (exerciseId: string) => {
    if (activeWorkout) {
      const updatedExercises = activeWorkout.exercises.filter(ex => ex.id !== exerciseId);
      const updatedWorkout = { ...activeWorkout, exercises: updatedExercises };
      setActiveWorkout(updatedWorkout);
    }
  };

  const handleFinishWorkout = async () => {
    if (activeWorkout) {
      const hasCompletedSet = activeWorkout.exercises.some(exercise =>
        exercise.sets.some(set => set.completed)
      );

      if (!hasCompletedSet) {
        toast.error("Complétez au moins une série avant de terminer la séance");
        return;
      }

      const completedWorkout = finishWorkout(activeWorkout); // This is a WorkoutHistory object

      // Add this log:
      console.log('Submitting to POST /history:', JSON.stringify(completedWorkout, null, 2));
      console.log('Breakdown of completedWorkout for POST /history:');
      console.log('- ID (frontend generated for history entry):', completedWorkout.id);
      console.log('- WorkoutID (original template ID):', completedWorkout.workoutId);
      console.log('- Name:', completedWorkout.name);
      console.log('- StartedAt:', completedWorkout.startedAt, '(isDate:', completedWorkout.startedAt instanceof Date, ')');
      console.log('- FinishedAt:', completedWorkout.finishedAt, '(isDate:', completedWorkout.finishedAt instanceof Date, ')');
      console.log('- Exercises count:', completedWorkout.exercises ? completedWorkout.exercises.length : 'undefined');
      if (completedWorkout.exercises && completedWorkout.exercises.length > 0) {
        completedWorkout.exercises.forEach((ex, index) => {
          console.log(`  - Exercise ${index}: ID=${ex.id}, Name=${ex.name}, Sets count=${ex.sets ? ex.sets.length : 'undefined'}`);
          if (ex.sets && ex.sets.length > 0) {
            ex.sets.forEach((set, sIndex) => {
              console.log(`    - Set ${sIndex}: ID=${set.id}, Weight=${set.weight}, Reps=${set.reps}, Completed=${set.completed}`);
            });
          }
        });
      }

      try {
        // N.B: The token is now handled by the useRemoteStorage hook or directly in fetch calls if not using the hook.
        // For this specific POST request, since we are not using the saveData function from useRemoteStorage,
        // we would need to ensure getToken() is called here if direct fetch is maintained.
        // However, the instruction is to modify useRemoteStorage usage. This part of the code
        // is not using useRemoteStorage for the POST, so it's outside the current scope of changes
        // for useRemoteStorage. But if it were to be refactored to use saveData, token would be handled.
      // apiFetch will handle Authorization header and token.
      // It will also throw an error for 401, which will be caught below.
      const response = await apiFetch(`${BASE_URL}history`, {
          method: "POST",
        // apiFetch will set Content-Type: application/json if body is an object.
        // Here, body is already a JSON string, which is also fine.
        // If apiFetch requires an object for auto Content-Type, ensure completedWorkout is passed directly.
        // For now, assume sending JSON string is okay and apiFetch's default headers are suitable or it adapts.
        // The current apiFetch sets Content-Type: application/json by default.
        body: JSON.stringify(completedWorkout),
        });

      // apiFetch throws for 401, so if we reach here, it's not a 401.
      // We still need to check for other non-ok statuses (e.g., 500, 400).
        if (!response.ok) {
          let errorMsg = response.statusText;
          try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
              errorMsg = errorData.error;
            }
          } catch (e) { /* Ignore if response is not JSON */ }
          toast.error(`Erreur serveur: ${errorMsg}`);
          return; 
        }
        
        // Optimistically update local history state.
        setLocalHistoryState([completedWorkout, ...history]);
        clearActiveWorkout(); // Clear any paused workout from localStorage
        toast.success("Séance terminée et enregistrée !");
        navigate("/");

      } catch (error) {
        console.error("Failed to save workout history:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        toast.error(`Échec de l'enregistrement de l'historique: ${message}. Vérifiez votre connexion.`);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loadingTemplates || loadingHistory) return <p>Chargement...</p>;
  if (!activeWorkout) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="container px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button
              variant="ghost"
              className="mb-2"
                onClick={() => {
                  // If workout is active and not paused, pause it before showing quit dialog
                  // Or, let the dialog handle options: Pause & Quit, Finish, Continue
                  // For now, just open dialog. The dialog could be enhanced.
                  setFinishDialogOpen(true);
                }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quitter
            </Button>
            <h1 className="text-2xl font-bold">{activeWorkout.name}</h1>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-sm">Durée</div>
              <div className="text-lg font-bold">
                {activeWorkout.isPaused ? formatTime(activeWorkout.elapsedTimeBeforePause || 0) : formatTime(elapsedTime)}
              </div>
          </div>
        </div>

          {/* Pause/Resume Buttons */}
          <div className="mb-4 flex justify-center space-x-4">
            {activeWorkout.isPaused ? (
              <Button onClick={handleResumeWorkout} size="lg" className="bg-blue-500 hover:bg-blue-600">
                <Play className="w-5 h-5 mr-2" />
                Reprendre
              </Button>
          ) : ""
          }
          </div>

        <div className="space-y-4 mb-6">
          {activeWorkout.exercises.map((exercise, index) => (
            <ExerciseForm
              key={exercise.id}
              exercise={exercise}
              onUpdate={handleExerciseUpdate}
              onDelete={handleDeleteExercise}
              onMoveUp={handleMoveExerciseUp}
              onMoveDown={handleMoveExerciseDown}
              exerciseIndex={index}
              totalExercises={activeWorkout.exercises.length}
              isActive={!activeWorkout.isPaused}
              historicalRefs={historicalRefs}
            />
          ))}
        </div>

        {/* Add New Exercise Button */}
        <div className="my-6 flex justify-center">
          <Button
            onClick={handleAddExercise}
            variant="outline"
            disabled={activeWorkout.isPaused}
            className="w-full max-w-md"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Ajouter un exercice
          </Button>
        </div>

        {/* Finish Workout Button Container */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => setFinishDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
              disabled={activeWorkout.isPaused} // Disable finish if paused
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Terminer la séance
          </Button>
        </div>
      </div>

      <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Terminer la séance ?</DialogTitle>
            <DialogDescription>
              Voulez-vous terminer et enregistrer cette séance d'entraînement ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setFinishDialogOpen(false)}
              className="sm:flex-1"
            >
              {activeWorkout?.isPaused ? "Retour à la séance (en pause)" : "Continuer la séance"}
            </Button>
            {/* New "Pause and Quit" button in dialog */}
            {!activeWorkout?.isPaused && (
                 <Button
                    variant="outline"
                    onClick={() => {
                        handlePauseWorkout();
                        setFinishDialogOpen(false);
                        navigate("/"); // Navigate to home after pausing
                    }}
                    className="border-orange-500 text-orange-500 hover:bg-orange-50"
                    >
                    Pause
                </Button>
            )}
            <Button
              onClick={handleFinishWorkout}
              className="bg-green-600 hover:bg-green-700"
              disabled={activeWorkout?.isPaused} // Also disable here if paused
            >
              Terminer et enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for confirming new workout when one is paused */}
      <Dialog open={showConfirmNewWorkoutDialog} onOpenChange={setShowConfirmNewWorkoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Séance en pause existante</DialogTitle>
            <DialogDescription>
              Vous avez une séance en pause. Commencer une nouvelle séance abandonnera la séance en pause. Continuer ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmNewWorkoutDialog(false);
                setPendingTemplate(null);
                // If user cancels, navigate to the active paused workout (if ID is not in URL)
                // or stay if URL already points to it (or no ID in URL means it's the paused one)
                if (activeWorkout && id && parseInt(id) !== activeWorkout.id) {
                     navigate(`/active-workout`); // Navigate to generic active page for paused one
                } else if (!id && activeWorkout) {
                    // Already on generic /active-workout, do nothing to URL
                } else {
                    navigate('/'); // Fallback
                }
              }}
              // className="sm:flex-1" // Removed for consistency, though this dialog might have different needs
            >
              Annuler (garder la séance en pause)
            </Button>
            <Button
              onClick={() => {
                if (pendingTemplate) {
                  clearActiveWorkout(); // Clear old paused workout
                  const newWorkout = startWorkout(pendingTemplate);
                  setActiveWorkout(newWorkout);
                  setElapsedTime(0); // Reset timer for new workout
                  // Navigate to the new workout's specific URL if not already there
                  if (id !== String(pendingTemplate.id)) {
                    navigate(`/active-workout/${pendingTemplate.id}`, { replace: true });
                  }
                }
                setShowConfirmNewWorkoutDialog(false);
                setPendingTemplate(null);
              }}
              // className="sm:flex-1" // Removed for consistency
            >
              Commencer une nouvelle séance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveWorkout;
