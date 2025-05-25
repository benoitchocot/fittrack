import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NavBar from "@/components/NavBar";
import ExerciseForm from "@/components/ExerciseForm";
import useRemoteStorage from "@/hooks/useRemoteStorage";
import { getToken } from "@/utils/auth";
import { WorkoutTemplate, ActiveWorkout as ActiveWorkoutType, Exercise, WorkoutHistory } from "@/types/workout";
import { getPausedWorkout, savePausedWorkout, clearPausedWorkout } from "@/utils/pausedWorkoutStorage"; // Corrected path
import { ArrowLeft, CheckCircle2, Play, Pause } from "lucide-react"; // Added Play and Pause icons
import {
  startWorkout,
  updateExercise,
  finishWorkout,
} from "@/services/workoutService";
import { toast } from "sonner";
import BASE_URL from "@/config"; // Assuming BASE_URL is defined in config

const ActiveWorkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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


  useEffect(() => {
    const pausedWorkout = getPausedWorkout();
    if (pausedWorkout) {
      setActiveWorkout(pausedWorkout);
      if (pausedWorkout.isPaused && pausedWorkout.elapsedTimeBeforePause) {
        setElapsedTime(pausedWorkout.elapsedTimeBeforePause);
      } else if (pausedWorkout.elapsedTimeBeforePause) {
        // Resumed but tab closed, calculate time since it was "resumed" (unpaused)
        const timeSinceUnpaused = pausedWorkout.pausedAt ? (new Date().getTime() - new Date(pausedWorkout.pausedAt).getTime()) / 1000 : 0;
        setElapsedTime(Math.floor(pausedWorkout.elapsedTimeBeforePause + timeSinceUnpaused));
      } else {
        // No pause info, just calculate from start
        const start = new Date(pausedWorkout.startedAt).getTime();
        const now = new Date().getTime();
        setElapsedTime(Math.floor((now - start) / 1000));
      }

      // If there's a paused workout, and user is trying to load a new one via URL
      if (id && (!pausedWorkout.id || parseInt(id) !== pausedWorkout.id)) {
         // Check if the id from URL matches the paused workout's template id
         // Assuming WorkoutTemplate's id is a number and ActiveWorkout's id (from WorkoutTemplate) is also a number
        const templateIdFromUrl = parseInt(id);
        if (templateIdFromUrl !== pausedWorkout.id) { // If URL id is different from paused workout's template id
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
  }, [id, templates, loadingTemplates, navigate]); // Removed activeWorkout from deps to avoid loop

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
      };
      setActiveWorkout(updatedPausedWorkout);
      savePausedWorkout(updatedPausedWorkout);
      toast.info("Séance mise en pause.");
      // Optionally navigate away, e.g., navigate("/");
    }
  };

  const handleResumeWorkout = () => {
    if (activeWorkout && activeWorkout.isPaused) {
      // Adjust startedAt to make the timer continue correctly from elapsedTimeBeforePause
      const newStartedAt = new Date(Date.now() - (activeWorkout.elapsedTimeBeforePause || 0) * 1000);
      const updatedResumedWorkout: ActiveWorkoutType = {
        ...activeWorkout,
        isPaused: false,
        startedAt: newStartedAt, 
        pausedAt: undefined, 
        // elapsedTimeBeforePause remains as a record of the last pause point
      };
      setActiveWorkout(updatedResumedWorkout);
      savePausedWorkout(updatedResumedWorkout); // Save resumed state
      toast.success("Séance reprise !");
    }
  };

  const handleExerciseUpdate = (updatedExercise: Exercise) => {
    if (activeWorkout) {
      setActiveWorkout(updateExercise(activeWorkout, updatedExercise.id, updatedExercise) as ActiveWorkoutType);
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
        // For now, let's assume this direct fetch needs to be updated separately or is handled
        // by another mechanism if `token` variable was removed.
        // For the purpose of this subtask, I will remove the direct usage of `token` here as well,
        // assuming it will be handled by a global fetch interceptor or similar, or needs to be
        // refactored to use `getToken()` from `src/utils/auth.ts`.
        // To be safe and ensure this POST continues to work, I will add getToken() here.
        const authToken = getToken(); 
        if (!authToken) {
          toast.error("Utilisateur non authentifié. Impossible de sauvegarder l'historique.");
          return; 
        }
        const response = await fetch(`${BASE_URL}history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          // Send the entire completedWorkout object
          body: JSON.stringify(completedWorkout), 
        });

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
        clearPausedWorkout(); // Clear any paused workout from localStorage
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
      <NavBar />
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
            ) : (
              <Button onClick={handlePauseWorkout} size="lg" variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-50 hover:text-yellow-600">
                <Pause className="w-5 h-5 mr-2" />
                Mettre en pause
              </Button>
            )}
          </div>

        <div className="space-y-4 mb-6">
          {activeWorkout.exercises.map((exercise) => (
            <ExerciseForm
              key={exercise.id}
              exercise={exercise}
              onUpdate={handleExerciseUpdate}
              onDelete={() => { /* onDelete is not implemented */ }}
                isActive={!activeWorkout.isPaused} // Disable form if paused
            />
          ))}
        </div>

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
                    Mettre en Pause et Quitter
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
                  clearPausedWorkout(); // Clear old paused workout
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
