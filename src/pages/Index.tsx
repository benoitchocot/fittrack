import React, { useState } from "react";
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

const Index = () => {
  const token = localStorage.getItem("token") || "";

  const {
    data: templates,
    setData: setTemplates,
    loading: loadingTemplates,
  } = useRemoteStorage<WorkoutTemplate[]>({
    initialValue: [],
    endpoint: "http://localhost:3001/templates",
    token,
  });

  const {
    data: history,
    loading: loadingHistory,
  } = useRemoteStorage<WorkoutHistory[]>({
    initialValue: [],
    endpoint: "http://localhost:3001/history",
    token,
  });

  const [activeTab, setActiveTab] = useState("templates");

  const handleDeleteTemplate = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/templates/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`, // token is accessible from component scope
        },
      });

      if (!response.ok) {
        // Attempt to parse error body, otherwise use statusText
        let errorData = { error: `Erreur HTTP ${response.status}` }; // Default error
        try {
          errorData = await response.json();
        } catch (e) {
          // If parsing JSON fails, use the status text or the default message.
          errorData.error = response.statusText || errorData.error;
        }
        toast.error(`Erreur serveur: ${errorData.error}`);
        return; // Stop further execution if API call fails
      }

      // If API call is successful, then update local state
      const updatedTemplates = templates.filter((template) => template.id !== id);
      setTemplates(updatedTemplates); // This is setData from useRemoteStorage
      toast.success("Modèle supprimé avec succès");

    } catch (error) {
      console.error("Failed to delete template via API:", error);
      // Check if error is an instance of Error to safely access message property
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Erreur lors de la suppression du modèle: ${errorMessage}.`);
    }
  };

  const handleStartWorkout = (id: string) => {
    window.location.href = `/workout/${id}`;
  };

  if (loadingTemplates || loadingHistory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
        <NavBar />
        <div className="container px-4 py-6 text-center">
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

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
                {history.map((workout) => (
                  <WorkoutHistoryCard key={workout.id} workout={workout} />
                ))}
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
