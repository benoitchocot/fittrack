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
import BASE_URL from "../config";
const TemplateEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token: authTokenFromContext, isAuthenticated, loading: isAuthLoading } = useAuth(); // Obtenir le token, l'état d'auth et l'état de chargement du contexte

  const {
    data: templates,
    setData: setTemplates, // setData is used by useRemoteStorage, even if not directly called here for POST/PUT success
    loading,
    error,
  } = useRemoteStorage<WorkoutTemplate[]>({
    initialValue: [],
    endpoint: `${BASE_URL}templates`,
  });

  const [workout, setWorkout] = useState<WorkoutTemplate>(
    createWorkoutTemplate("")
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const isEditMode = !!id;

  useEffect(() => {
    // This effect handles fetching the template when in edit mode
    if (isEditMode && id) {
      // Wait for auth context to finish loading its state
      if (isAuthLoading) {
        setIsLoadingTemplate(true); // Show a loading indicator for the template data
        return; // Do nothing further until auth state is resolved
      }

      // Auth state is resolved, now check if authenticated
      if (!isAuthenticated || !authTokenFromContext) {
        toast.error("Authentification requise pour charger le modèle.");
        setIsLoadingTemplate(false);
        navigate("/");
        return;
      }

      // If authenticated, proceed to fetch the template data
      setIsLoadingTemplate(true);
      fetch(`${BASE_URL}templates/${id}`, {
        headers: {
          Authorization: `Bearer ${authTokenFromContext}`,
        },
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Erreur serveur inconnue" }));
            throw new Error(errorData.error || `Erreur ${response.status} lors de la récupération du modèle`);
          }
          return response.json();
        })
        .then((rawTemplate: any) => { // rawTemplate is from the backend
          // Apply transformations (as implemented in previous steps)
          const transformedExercises = (rawTemplate.exercises || []).map((ex: any) => ({
            ...ex,
            name: ex.exercise_name,
            comment: ex.notes,
            sets: (ex.sets || []).map((s: any) => ({
              ...s,
              weight: s.kg,
            })),
          }));
          const transformedTemplate: WorkoutTemplate = {
            ...rawTemplate,
            exercises: transformedExercises,
            // Ensure createdAt and updatedAt are Date objects
            createdAt: new Date(rawTemplate.createdAt),
            updatedAt: new Date(rawTemplate.updatedAt),
          };
          setWorkout(transformedTemplate);
        })
        .catch((error) => {
          console.error("Failed to load template:", error);
          toast.error(error.message || "Échec du chargement du modèle.");
          navigate("/");
        })
        .finally(() => {
          setIsLoadingTemplate(false);
        });
    } else if (!isEditMode) {
      // Logic for creating a new template (already in place)
      setWorkout(createWorkoutTemplate(""));
      setIsLoadingTemplate(false); // Ensure this is also set for new template mode
    }
  }, [id, isEditMode, isAuthenticated, authTokenFromContext, isAuthLoading, navigate]); // Key dependencies

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

    // Transformation logic
    const payloadWorkout = {
      ...workout, // Includes main id, name, description, client-side createdAt/updatedAt
      exercises: workout.exercises.map(ex => ({
        ...ex, // Includes client-side exercise id
        exercise_name: ex.name,
        notes: ex.comment || null, // Backend 'notes' column might not exist or map to comment. PUT route uses 'notes'.
        // Original 'name' and 'comment' are implicitly replaced if backend uses these new keys.
        // If backend expects ONLY these new keys and no 'name'/'comment', then further cleanup is needed.
        // For now, assume backend is tolerant or picks the explicitly named keys.
        sets: ex.sets.map(set => ({
          ...set, // Includes client-side set id
          kg: set.weight,
          // Original 'weight' is implicitly replaced if backend uses 'kg'.
          // set_order: set.order // if applicable, ensure set.order exists
        })),
      })),
    };
    // Remove original frontend-specific fields if they cause issues with backend validation
    // (e.g. if backend expects 'exercise_name' and errors if 'name' is also present)
    // For now, this simplified transformation is used.
    payloadWorkout.exercises.forEach(ex => {
      // delete (ex as any).name; // Example: if 'name' must be removed
      // delete (ex as any).comment; // Example: if 'comment' must be removed
      ex.sets.forEach(set => {
        // delete (set as any).weight; // Example: if 'weight' must be removed
      });
    });


    try {
      // const authToken = getToken(); // Supprimer cette ligne
      if (!isAuthenticated || !authTokenFromContext) { // Utiliser les valeurs du contexte
        toast.error("Utilisateur non authentifié. Impossible de sauvegarder.");
        setIsSaving(false);
        return;
      }

      if (isEditMode && payloadWorkout.id) { // Ensure payloadWorkout.id is present for PUT
        const response = await fetch(`${BASE_URL}${payloadWorkout.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokenFromContext}`, // Utiliser le token du contexte
          },
          body: JSON.stringify(payloadWorkout),
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
        console.log('Creating new template with payload:', JSON.stringify(payloadWorkout, null, 2));
        const response = await fetch(`${BASE_URL}templates`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokenFromContext}`, // Utiliser le token du contexte
          },
          body: JSON.stringify(payloadWorkout),
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

  // Adjusted loading condition
  if ((loading && !isEditMode) || (isLoadingTemplate && isEditMode)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
        <NavBar />
        <div className="container px-4 py-6 text-center">
          <p>Chargement {isEditMode ? "du modèle" : "des modèles"}...</p>
        </div>
      </div>
    );
  }
  
  // Error from useRemoteStorage (e.g. if templates list fails to load, but we might still edit if direct fetch works)
  // Consider how to handle this. For now, if there's a general error and we're not in edit mode, show it.
  // If in edit mode, the direct fetch error handling inside useEffect is more specific.
  if (error && !isEditMode) { // Only show general error if not in edit mode or if specific template load hasn't started/failed
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