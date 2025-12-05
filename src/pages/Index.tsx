import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Added useNavigate and useLocation
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Added Input component
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"; // Added Card components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WorkoutCard from "@/components/WorkoutCard";
import WorkoutHistoryCard from "@/components/WorkoutHistoryCard";
import WorkoutCalendar from "@/components/WorkoutCalendar";
import { Plus } from "lucide-react";
import useRemoteStorage from "@/hooks/useRemoteStorage";
import {
  WorkoutTemplate,
  WorkoutHistory,
  ActiveWorkout as ActiveWorkoutType,
} from "@/types/workout"; // Added ActiveWorkoutType
import {
  getActiveWorkout,
  clearActiveWorkout,
} from "@/utils/activeWorkoutStorage"; // Added paused workout utils
import { toast } from "sonner";
import { getToken } from "@/utils/auth";
import { useAuth } from "@/context/AuthContext";
import BASE_URL from "@/config";
import { apiFetch } from "../utils/api";

const Index = () => {
  const { token, loading: authLoading } = useAuth();
  const navigate = useNavigate(); // Added useNavigate
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("templates");
  const [pausedWorkout, setPausedWorkout] = useState<ActiveWorkoutType | null>(
    null
  );
  const [historySearchTerm, setHistorySearchTerm] = useState(""); // Added historySearchTerm state

  // Toujours appeler useRemoteStorage, en passant token vide si non dispo
  const {
    data: templates,
    setData: setTemplatesLocally, // Renamed to reflect it's for local state
    // postData: postNewTemplate, // Not used in Index.tsx for template creation
    loading: loadingTemplates,
  } = useRemoteStorage<WorkoutTemplate[]>({
    initialValue: [],
    endpoint: `${BASE_URL}templates`, // Use BASE_URL for consistency
    token: token || "",
  });

  const {
    data: history,
    setData: setLocalHistoryStateForIndex, // Explicit name
    loading: loadingHistory,
    refetch: refetchHistory,
  } = useRemoteStorage<WorkoutHistory[]>({
    initialValue: [],
    endpoint: `${BASE_URL}history`, // Use BASE_URL for consistency
    token: token || "",
  });

  useEffect(() => {
    const activeWorkout = getActiveWorkout();
    setPausedWorkout(activeWorkout); // This will set the workout if it exists, or null if it doesn't.
    refetchHistory();
  }, [location]);

  useEffect(() => {
  }, [history]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleResumePausedWorkout = () => {
    if (pausedWorkout) {
      // Navigate to the generic active workout page. ActiveWorkout.tsx will load the paused workout.
      // Or, if the paused workout has an ID (template ID), navigate to that specific one.
      // The ActiveWorkout component should handle loading paused workout irrespective of the ID in URL if one is found.
      // Navigating to `/active-workout` is safer as it doesn't assume the ID.
      // However, the prompt asks to navigate to `/workout/:id` which is actually `/active-workout/:id`
      navigate(`/workout/${pausedWorkout.id}`, { state: { resume: true } });
    }
  };

  const handleDiscardPausedWorkout = () => {
    clearActiveWorkout();
    setPausedWorkout(null);
    toast.info("Séance en pause abandonnée.");
  };

  // Afficher un loader global si auth en cours ou données en chargement
  if (authLoading || loadingTemplates || loadingHistory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
        <div className="container px-4 py-6 text-center">
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      // apiFetch will handle Authorization header and token.
      // It will also throw an error for 401, which will be caught below.
      const response = await apiFetch(`${BASE_URL}templates/${id}`, {
        method: "DELETE",
      });

      // apiFetch throws for 401, so if we reach here, it's not a 401.
      // We still need to check for other non-ok statuses (e.g., 500, 400).
      if (!response.ok) {
        let errorData = { error: `Erreur HTTP ${response.status}` };
        try {
          // Attempt to parse JSON error response from server
          errorData = await response.json(); 
        } catch {
          // Fallback if response is not JSON or errorData.error is not set
          errorData.error = response.statusText || errorData.error;
        }
        toast.error(`Erreur serveur: ${errorData.error}`);
        return;
      }

      // If DELETE is successful, backend usually returns 204 No Content or 200 OK with a success message.
      // No need to parse response.json() unless the server sends back useful data for DELETE.
      // For example, if it sent back the ID of the deleted item: const deletedData = await response.json();

      const updatedTemplates = templates.filter(
        (template) => template.id !== id
      );
      setTemplatesLocally(updatedTemplates); 
      toast.success("Modèle supprimé avec succès");
    } catch (error) {
      const specificError = error as Error;
      if (specificError.message === 'Session expired. Redirecting to login.') {
        // apiFetch has handled the redirect and thrown an error.
        // No further action needed here.
      } else {
        const errorMessage = specificError.message || "Erreur inconnue";
        toast.error(`Erreur lors de la suppression du modèle: ${errorMessage}.`);
        console.error("Error deleting template:", specificError); // Also log the error
      }
    }
  };

  const filteredHistory = history.filter((workout) => {
    const searchTerm = historySearchTerm.toLowerCase();
    // Ensure workout_details and its name property exist and are strings
    if (
      workout.workout_details &&
      typeof workout.workout_details.name === "string"
    ) {
      return workout.workout_details.name.toLowerCase().includes(searchTerm);
    }
    // Fallback to workout.name if workout_details.name is not available
    if (typeof workout.name === "string") {
      return workout.name.toLowerCase().includes(searchTerm);
    }
    return false; // If no suitable name, don't include it in filtered results
  });

  const handleStartWorkout = (id: string) => {
    window.location.href = `/workout/${id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">

      <div className="container px-4 py-6">
        {pausedWorkout && (
          <Card className="mb-6 bg-yellow-50 border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700">
            <CardHeader>
              <CardTitle className="text-yellow-700 dark:text-yellow-300">
                {pausedWorkout.isPaused ? 'Séance en Pause' : 'Séance en Cours'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <strong>Nom:</strong> {pausedWorkout.name}
              </p>
              {pausedWorkout.isPaused && pausedWorkout.pausedAt && (
                <p>
                  <strong>En pause depuis:</strong>{" "}
                  {new Date(pausedWorkout.pausedAt).toLocaleString()}
                </p>
              )}
              <p>
                <strong>Temps écoulé:</strong>{" "}
                {formatTime(pausedWorkout.elapsedTimeBeforePause || 0)}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleDiscardPausedWorkout}>
                Abandonner
              </Button>
              <Button
                onClick={handleResumePausedWorkout}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                Reprendre
              </Button>
            </CardFooter>
          </Card>
        )}

        <div className="flex flex-col mb-6">
          <h1 className="text-2xl font-bold">Mes séances</h1>
          <p className="text-muted-foreground">
            Créez et suivez vos séances d'entraînement
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Modèles</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {templates.length > 0 ? (
                templates.map((template) => (
                  <WorkoutCard
                    key={template.id}
                    workout={template}
                    onDelete={handleDeleteTemplate}
                    onStart={handleStartWorkout}
                  />
                ))
              ) : (
                <div className="col-span-3 p-8 text-center bg-white rounded-lg shadow-sm dark:bg-zinc-900">
                  <p className="mb-4 text-muted-foreground">
                    Vous n'avez pas encore de modèles de séances
                  </p>
                  <Button asChild>
                    <Link to="/templates/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer un modèle
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {templates.length > 0 && (
              <div className="flex justify-center mt-6">
                <Button asChild>
                  <Link to="/templates/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau modèle
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {/* Calendrier des séances */}
            <div className="mb-6">
              <WorkoutCalendar history={history} />
            </div>

            {/* Barre de recherche et liste de l'historique */}
            <Input
              type="text"
              placeholder="Rechercher dans l'historique..."
              value={historySearchTerm}
              onChange={(e) => setHistorySearchTerm(e.target.value)}
              className="mb-4"
            />
            {filteredHistory.length > 0 ? (
              <div className="space-y-4">
                {filteredHistory.map((workout) => {
                  return (
                    <WorkoutHistoryCard
                      key={workout.history_db_id}
                      workout={workout}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-lg shadow-sm dark:bg-zinc-900">
                <p className="text-muted-foreground">
                  {historySearchTerm
                    ? "Aucun résultat pour votre recherche."
                    : "Vous n'avez pas encore d'historique de séances"}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
