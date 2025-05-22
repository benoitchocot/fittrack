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
import { WorkoutTemplate, ActiveWorkout as ActiveWorkoutType, Exercise } from "@/types/workout";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  startWorkout,
  updateExercise,
  finishWorkout,
} from "@/services/workoutService";
import { toast } from "sonner";

const ActiveWorkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Token à récupérer dynamiquement selon ton système d'auth
  const token = localStorage.getItem("token") || "";

  const {
    data: templates,
    setData: setTemplates,
    loading: loadingTemplates,
    error: errorTemplates,
  } = useRemoteStorage<WorkoutTemplate[]>({
    initialValue: [],
    token,
    endpoint: "http://localhost:3001/templates",
  });

  const {
    data: history,
    setData: setHistory,
    loading: loadingHistory,
    error: errorHistory,
  } = useRemoteStorage<any[]>({
    initialValue: [],
    token,
    endpoint: "http://localhost:3001/history",
  });

  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutType | null>(null);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!loadingTemplates && templates.length > 0 && id) {
      const template = templates.find((t) => t.id === id);
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

      const completedWorkout = finishWorkout(activeWorkout);
      await setHistory([completedWorkout, ...history]);
      toast.success("Séance terminée et enregistrée !");
      navigate("/");
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
              onDelete={() => {}}
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
