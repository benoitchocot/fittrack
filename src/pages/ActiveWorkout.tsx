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
import { getToken } from "@/utils/auth"; // Import getToken
import { WorkoutTemplate, ActiveWorkout as ActiveWorkoutType, Exercise, WorkoutHistory } from "@/types/workout";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  startWorkout,
  updateExercise,
  finishWorkout,
} from "@/services/workoutService";
import { toast } from "sonner";
import BASE_URL from "../config" // Ensure this is defined in your constants
// Ensure you have the correct import for BASE_URL
const ActiveWorkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: templates,
    loading: loadingTemplates,
  } = useRemoteStorage<WorkoutTemplate[]>({
    initialValue: [],
    endpoint: BASE_URL,
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

  useEffect(() => {
    if (!loadingTemplates && templates.length > 0 && id) {
      const template = templates.find((t) => t.id === parseInt(id));
      if (template) {
        setActiveWorkout(startWorkout(template));
      } else {
        navigate("/");
        toast.error("Modèle de séance introuvable");
      }
    }
  }, [id, templates, loadingTemplates, navigate]);

  useEffect(() => {
    if (activeWorkout) {
      const interval = setInterval(() => {
        const start = new Date(activeWorkout.startedAt).getTime();
        const now = new Date().getTime();
        setElapsedTime(Math.floor((now - start) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeWorkout]);

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
        const authToken = getToken(); // Use getToken from auth utils
        if (!authToken) {
          toast.error("Utilisateur non authentifié. Impossible de sauvegarder l'historique.");
          return; // Prevent fetch if no token
        }
        const response = await fetch(BASE_URL, {
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
        // The `useRemoteStorage` hook for history on the Index page will fetch the authoritative list.
        setLocalHistoryState([completedWorkout, ...history]); 
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
              onClick={() => setFinishDialogOpen(true)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quitter
            </Button>
            <h1 className="text-2xl font-bold">{activeWorkout.name}</h1>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-sm">Durée</div>
            <div className="text-lg font-bold">{formatTime(elapsedTime)}</div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {activeWorkout.exercises.map((exercise) => (
            <ExerciseForm
              key={exercise.id}
              exercise={exercise}
              onUpdate={handleExerciseUpdate}
              onDelete={() => { /* onDelete is not implemented */ }}
              isActive={true}
            />
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => setFinishDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Terminer la séance
          </Button>
        </div>
      </div>

      <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminer la séance ?</DialogTitle>
            <DialogDescription>
              Voulez-vous terminer et enregistrer cette séance d'entraînement ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setFinishDialogOpen(false)}
              className="sm:flex-1"
            >
              Continuer la séance
            </Button>
            <Button
              onClick={handleFinishWorkout}
              className="sm:flex-1 bg-green-600 hover:bg-green-700"
            >
              Terminer et enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveWorkout;
