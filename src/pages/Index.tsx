import React, { useState, useEffect } from "react"; // Added useEffect
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WorkoutCard from "@/components/WorkoutCard";
import WorkoutHistoryCard from "@/components/WorkoutHistoryCard";
import NavBar from "@/components/NavBar";
import { Plus } from "lucide-react";
import useRemoteStorage from "@/hooks/useRemoteStorage";
import { WorkoutTemplate, WorkoutHistory } from "@/types/workout";
import { toast } from "sonner";
import { getToken } from "@/utils/auth";
import { useAuth } from "@/context/AuthContext";
import BASE_URL from "../config"
const Index = () => {
  const { token, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("templates");

  // Toujours appeler useRemoteStorage, en passant token vide si non dispo
  const {
    data: templates,
    setData: setTemplatesLocally, // Renamed to reflect it's for local state
    // postData: postNewTemplate, // Not used in Index.tsx for template creation
    loading: loadingTemplates,
  } = useRemoteStorage<WorkoutTemplate[]>({
    initialValue: [],
    endpoint: `${BASE_URL}templates`,
    token: token || "",
  });

  const {
    data: history,
    setData: setLocalHistoryStateForIndex, // Explicit name
    postData: postHistoryEntryToServerForIndex, // Explicit name (likely unused here)
    loading: loadingHistory,
  } = useRemoteStorage<WorkoutHistory[]>({
    initialValue: [],
    endpoint: `${BASE_URL}history`,
    token: token || "",
  });

  useEffect(() => {
    // The history.forEach loop and its console.warn have been removed.
    // The main console.log for fetched history data is kept.
    if (history && Array.isArray(history) && history.length > 0) {
      console.log("Fetched history data in Index.tsx:", JSON.stringify(history, null, 2));
    } else if (history) {
      console.log("Fetched history data in Index.tsx (empty or not array):", history);
    }
  }, [history]);

  // Afficher un loader global si auth en cours ou données en chargement
  if (authLoading || loadingTemplates || loadingHistory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
        <NavBar />
        <div className="container px-4 py-6 text-center">
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      const authToken = getToken();
      if (!authToken) {
        toast.error("Utilisateur non authentifié. Impossible de supprimer le modèle.");
        return;
      }
      const response = await fetch(`${BASE_URL}templates/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        let errorData = { error: `Erreur HTTP ${response.status}` };
        try {
          errorData = await response.json();
        } catch {
          errorData.error = response.statusText || errorData.error;
        }
        toast.error(`Erreur serveur: ${errorData.error}`);
        return;
      }

      const updatedTemplates = templates.filter((template) => template.id !== id);
      setTemplatesLocally(updatedTemplates); // This now only updates local state
      toast.success("Modèle supprimé avec succès");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Erreur lors de la suppression du modèle: ${errorMessage}.`);
    }
  };

  const handleStartWorkout = (id: string) => {
    window.location.href = `/workout/${id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <NavBar />

      <div className="container px-4 py-6">
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
            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map((workout) => {
                  // Removed console.log for rendering item and the if block with console.warn for history_db_id.
                  return <WorkoutHistoryCard key={workout.history_db_id} workout={workout} />;
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-lg shadow-sm dark:bg-zinc-900">
                <p className="text-muted-foreground">
                  Vous n'avez pas encore d'historique de séances
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
