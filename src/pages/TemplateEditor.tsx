
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NavBar from "@/components/NavBar";
import ExerciseForm from "@/components/ExerciseForm";
import useLocalStorage from "@/hooks/useLocalStorage";
import { WorkoutTemplate, Exercise } from "@/types/workout";
import { Plus, ArrowLeft } from "lucide-react";
import {
  createWorkoutTemplate,
  addExercise,
  updateExercise,
  removeExercise,
} from "@/services/workoutService";
import { toast } from "sonner";

const TemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [templates, setTemplates] = useLocalStorage<WorkoutTemplate[]>(
    "workout-templates",
    []
  );
  const [workout, setWorkout] = useState<WorkoutTemplate>(
    createWorkoutTemplate("Nouvelle séance")
  );
  const isEditMode = !!id;

  // Load existing template if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const existingTemplate = templates.find((t) => t.id === id);
      if (existingTemplate) {
        setWorkout(existingTemplate);
      } else {
        // Template not found, redirect to creation
        navigate("/templates/new");
      }
    }
  }, [id, templates, navigate, isEditMode]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkout({ ...workout, name: e.target.value });
  };

  const handleAddExercise = () => {
    setWorkout(addExercise(workout));
  };

  const handleExerciseUpdate = (updatedExercise: Exercise) => {
    setWorkout(updateExercise(workout, updatedExercise.id, updatedExercise));
  };

  const handleExerciseDelete = (exerciseId: string) => {
    if (workout.exercises.length <= 1) {
      toast.error("Une séance doit contenir au moins un exercice");
      return;
    }
    setWorkout(removeExercise(workout, exerciseId));
  };

  const handleSave = () => {
    // Validate workout
    if (!workout.name.trim()) {
      toast.error("Veuillez donner un nom à votre séance");
      return;
    }

    if (workout.exercises.some((ex) => !ex.name.trim())) {
      toast.error("Tous les exercices doivent avoir un nom");
      return;
    }

    // Save template
    if (isEditMode) {
      setTemplates(
        templates.map((t) => (t.id === workout.id ? workout : t))
      );
      toast.success("Modèle mis à jour avec succès");
    } else {
      setTemplates([...templates, workout]);
      toast.success("Modèle créé avec succès");
    }

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <NavBar />
      
      <div className="container px-4 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-2"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Modifier le modèle" : "Nouveau modèle"}
          </h1>
        </div>

        <div className="px-4 py-6 mb-6 bg-white rounded-lg shadow-sm dark:bg-zinc-900">
          <div className="mb-4">
            <label htmlFor="workout-name" className="block mb-1 text-sm font-medium">
              Nom de la séance
            </label>
            <Input
              id="workout-name"
              placeholder="Nom de la séance"
              value={workout.name}
              onChange={handleNameChange}
              className="text-lg font-medium"
            />
          </div>
        </div>

        <h2 className="mb-4 text-xl font-bold">Exercices</h2>
        
        <div className="space-y-4">
          {workout.exercises.map((exercise) => (
            <ExerciseForm
              key={exercise.id}
              exercise={exercise}
              onUpdate={handleExerciseUpdate}
              onDelete={handleExerciseDelete}
            />
          ))}
        </div>
        
        <div className="flex flex-col gap-4 mt-6 md:flex-row">
          <Button
            variant="outline"
            onClick={handleAddExercise}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un exercice
          </Button>
          
          <Button 
            onClick={handleSave}
            className="bg-workout-primary hover:bg-workout-dark"
          >
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
