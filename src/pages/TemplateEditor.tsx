import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import NavBar from "@/components/NavBar";
import ExerciseForm from "@/components/ExerciseForm";
import useRemoteStorage from "@/hooks/useRemoteStorage";
// import { getToken } from "@/utils/auth"; // Supprimer cet import
import { useAuth } from "@/context/AuthContext"; // Importer useAuth
import { WorkoutTemplate, Exercise } from "@/types/workout";
import { Plus, ArrowLeft } from "lucide-react";
import {
  createWorkoutTemplate,
  addExercise,
  updateExercise as updateExerciseInService,
  removeExercise,
} from "@/services/workoutService";
import { toast } from "sonner";

const TemplateEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token: authTokenFromContext, isAuthenticated } = useAuth(); // Obtenir le token et l'état d'auth du contexte

  const {
    data: templates,
    setData: setTemplates, // setData is used by useRemoteStorage, even if not directly called here for POST/PUT success
    loading,
    error,
  } = useRemoteStorage<WorkoutTemplate[]>({
    initialValue: [],
    endpoint: "http://localhost:3001/templates",
  });

  const [workout, setWorkout] = useState<WorkoutTemplate>(
    createWorkoutTemplate("Nouvelle séance")
  );
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode && !loading) {
      const existingTemplate = templates.find((t) => t.id === id);
      if (existingTemplate) {
        setWorkout(existingTemplate);
      } else {
        if (!loading && templates.length > 0) {
            toast.error("Modèle non trouvé.");
            navigate("/"); 
        } else if (!loading && templates.length === 0 && id) { // Should be covered by previous, but as a safeguard
             toast.error("Aucun modèle chargé, impossible d'éditer.");
             navigate("/");
        }
      }
    } else if (!isEditMode) {
      setWorkout(createWorkoutTemplate("Nouvelle séance"));
    }
  }, [id, isEditMode, templates, loading, navigate]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkout({ ...workout, name: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWorkout({ ...workout, description: e.target.value });
  };

  const handleAddExercise = () => {
    setWorkout(addExercise(workout));
  };

  const handleExerciseUpdate = (updatedExercise: Exercise) => {
    setWorkout(updateExerciseInService(workout, updatedExercise.id, updatedExercise));
  };

  const handleExerciseDelete = (exerciseId: string) => {
    if (workout.exercises.length <= 1) {
      toast.error("Une séance doit contenir au moins un exercice");
      return;
    }
    setWorkout(removeExercise(workout, exerciseId));
  };

  const handleSave = async () => {
    if (!workout.name.trim()) {
      toast.error("Veuillez donner un nom à votre séance");
      return;
    }

    if (workout.exercises.some((ex) => !ex.name.trim())) {
      toast.error("Tous les exercices doivent avoir un nom");
      return;
    }
    
    for (const exercise of workout.exercises) {
        if (!Array.isArray(exercise.sets) || exercise.sets.length === 0) {
          toast.error(`L'exercice '${exercise.name}' doit avoir au moins une série.`);
          return;
        }
        for (const set of exercise.sets) {
            if (typeof set.weight !== 'number' || typeof set.reps !== 'number') {
                 toast.error(`Les séries pour '${exercise.name}' doivent avoir des poids et répétitions valides.`);
                 return;
            }
        }
    }

    setIsSaving(true);

    try {
      // const authToken = getToken(); // Supprimer cette ligne
      if (!isAuthenticated || !authTokenFromContext) { // Utiliser les valeurs du contexte
        toast.error("Utilisateur non authentifié. Impossible de sauvegarder.");
        setIsSaving(false);
        return;
      }

      if (isEditMode && workout.id) { // Ensure workout.id is present for PUT
        const response = await fetch(`http://localhost:3001/templates/${workout.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokenFromContext}`, // Utiliser le token du contexte
          },
          body: JSON.stringify(workout),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Erreur inconnue du serveur" }));
          throw new Error(errorData.error || `Erreur serveur: ${response.statusText}`);
        }
        
        // const updatedTemplateFromServer = await response.json(); // Backend sends { success: true, id: templateId }

        // Rely on navigation and re-fetch on the target page
        toast.success("Modèle mis à jour avec succès !");
        navigate("/");

      } else if (!isEditMode) {
        // Create new template
        const response = await fetch("http://localhost:3001/templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokenFromContext}`, // Utiliser le token du contexte
          },
          body: JSON.stringify(workout),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Erreur inconnue du serveur" }));
          throw new Error(errorData.error || `Erreur serveur: ${response.statusText}`);
        }
        
        // const newTemplateFromServer = await response.json(); // { success: true, id: ... }
        toast.success("Modèle créé avec succès !");
        navigate("/");
      } else {
        // This case should ideally not be reached if logic is correct (isEditMode true means id should be loaded)
        toast.error("ID de modèle manquant pour la mise à jour. Impossible de sauvegarder.");
        throw new Error("ID de modèle manquant pour la mise à jour.");
      }
    } catch (err) {
      console.error("Failed to save template:", err);
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Échec de l'enregistrement: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
        <NavBar />
        <div className="container px-4 py-6 text-center">
          <p>Chargement des modèles...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
        <NavBar />
        <div className="container px-4 py-6 text-center">
          <p className="text-red-500">Erreur lors du chargement des modèles: {error}</p>
          <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <NavBar />
      <div className="container px-4 py-6">
        <div className="mb-6">
          <Button variant="ghost" className="mb-2" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Modifier le modèle de séance" : "Nouveau modèle de séance"}
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-zinc-900">
              <label
                htmlFor="workout-name"
                className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nom de la séance
              </label>
              <Input
                id="workout-name"
                placeholder="Ex: Pectoraux et Triceps"
                value={workout.name}
                onChange={handleNameChange}
                className="text-base"
              />
               <label
                htmlFor="workout-description"
                className="block mt-4 mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Description (optionnel)
              </label>
              <Textarea
                id="workout-description"
                placeholder="Ajoutez une courte description ou des notes pour cette séance..."
                value={workout.description || ""}
                onChange={handleDescriptionChange}
                rows={3}
              />
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold">Exercices</h2>
              <div className="space-y-4">
                {workout.exercises.map((exercise, index) => (
                  <ExerciseForm
                    key={exercise.id || `exercise-${index}`}
                    exercise={exercise}
                    onUpdate={handleExerciseUpdate}
                    onDelete={handleExerciseDelete}
                  />
                ))}
              </div>
            </div>
             <div className="flex flex-col gap-3 mt-6 sm:flex-row">
                <Button variant="outline" onClick={handleAddExercise} disabled={isSaving}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un exercice
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={isSaving || (isEditMode && !workout.id)} // Disable if in edit mode but no workout.id
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    {isSaving ? (isEditMode ? "Enregistrement..." : "Création...") : (isEditMode ? "Enregistrer les modifications" : "Créer le modèle")}
                </Button>
            </div>
          </div>
          {/* Future placeholder for a side panel or additional info
          <div className="md:col-span-1">
            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-zinc-900">
              <h3 className="text-lg font-medium">Résumé</h3>
              { ... summary details ... }
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;