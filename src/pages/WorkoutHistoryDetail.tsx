import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar'; // Adjust path if necessary
import { Button } from '../components/ui/button'; // Adjust path if necessary
import { WorkoutHistory } from '../types/workout'; // Adjust path if necessary
import BASE_URL from '../config'; // Adjust path if necessary
import { getToken } from '../utils/auth'; // For fetching data
import { ArrowLeft } from 'lucide-react';

const WorkoutHistoryDetail = () => {
  const { historyId } = useParams<{ historyId: string }>();
  const navigate = useNavigate();
  const [historyEntry, setHistoryEntry] = useState<WorkoutHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (historyId) {
      setLoading(true);
      const fetchHistoryEntry = async () => {
        try {
          const token = getToken();
          if (!token) {
            setError("Authentification requise.");
            setLoading(false);
            return;
          }
          // Fetch all history entries
          const response = await fetch(`${BASE_URL}history`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch workout history. Status: ' + response.status);
          }
          const allHistoryEntries: WorkoutHistory[] = await response.json();

          // Find the specific entry by historyId from URL params
          // Assuming historyId from params corresponds to the 'id' field of a history entry
          const specificEntry = allHistoryEntries.find(item => item.history_db_id === Number(historyId));

          if (specificEntry) {
            setHistoryEntry(specificEntry);
          } else {
            setError(`Détail de l'historique non trouvé pour l'ID: ${historyId}`);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching history details.');
        } finally {
          setLoading(false);
        }
      };
      fetchHistoryEntry();
    }
  }, [historyId]);

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="container px-4 py-6 text-center">Chargement des détails de l'historique...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavBar />
        <div className="container px-4 py-6 text-center text-red-500">Erreur: {error}</div>
      </>
    );
  }

  if (!historyEntry) {
    return (
      <>
        <NavBar />
        <div className="container px-4 py-6 text-center">Aucun détail trouvé pour cet historique.</div>
      </>
    );
  }

  if (!historyEntry.workout_details) {
    return (
      <>
        <NavBar />
        <div className="container px-4 py-6 text-center text-red-500">
          Erreur: Données de détails de la séance (workout_details) manquantes pour cet historique.
        </div>
      </>
    );
  }

  const { name, startedAt, finishedAt, exercises } = historyEntry.workout_details;

  const calculateDuration = (start: string | undefined, end: string | null | undefined): string => {
    if (!start || !end) return "Durée non disponible";
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <>
      <NavBar />
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)} 
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'historique
        </Button>

        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-zinc-900 mb-6">
          <h1 className="text-3xl font-bold mb-3">{name}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p><span className="font-semibold">ID de la séance:</span> {historyId}</p>
            {startedAt && (
              <p><span className="font-semibold">Date:</span> {new Date(startedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            )}
            {finishedAt && startedAt && (
              <p><span className="font-semibold">Durée:</span> {calculateDuration(startedAt, finishedAt)}</p>
            )}
            {/* Add total volume here if available in historyEntry */}
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Exercices</h2>
        <div className="space-y-6">
          {exercises?.map((exercise, index) => (
            <div key={exercise.id || index} className="p-4 bg-white rounded-lg shadow dark:bg-zinc-800">
              <h3 className="text-xl font-semibold mb-2">{exercise.name}</h3>
              {exercise.comment && ( 
                <p className="mb-3 text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Commentaire:</span>{' '}
                  <span className="text-gray-600 dark:text-gray-400 italic">{exercise.comment}</span>
                </p>
              )}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 mb-1 text-xs font-medium text-muted-foreground px-2">
                  <span>Série</span>
                  <span>Poids & Répétitions</span>
                  <span className="text-right">Statut</span>
                </div>
                {exercise.sets.map((set, setIndex) => (
                  <div key={set.id || setIndex} className="flex justify-between items-center p-2 rounded bg-gray-50 dark:bg-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-600 transition-colors">
                    <span className="text-sm font-medium w-1/3">Série {setIndex + 1}</span>
                    <span className="text-sm w-1/3 text-center">{set.kg ?? set.weight} kg x {set.reps} reps</span>
                    <span className={`text-sm font-medium w-1/3 text-right ${set.completed ? 'text-green-500' : 'text-red-500'}`}>
                      {set.completed ? 'Terminé' : 'Non terminé'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default WorkoutHistoryDetail;
