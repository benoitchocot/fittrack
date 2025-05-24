// hooks/useRemoteStorage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

type UseRemoteStorageOptions<T> = {
  initialValue: T;
  endpoint: string; // e.g. "http://localhost:3001/data"
};

function useRemoteStorage<T>({ initialValue, endpoint }: UseRemoteStorageOptions<T>) {
  const { token: authToken } = useAuth();
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données depuis le backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Ensure loading is true when fetchData is called
      setError(null); // Clear previous errors
      try {
        console.log('[useRemoteStorage] Attempting fetch. Auth Token:', authToken);
        const fetchHeaders = {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        };
        console.log('[useRemoteStorage] Fetch headers:', JSON.stringify(fetchHeaders));

        const res = await fetch(endpoint, {
          headers: fetchHeaders,
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Erreur de récupération: ${res.status} ${errorText}`);
        }

        const json = await res.json();
        // The conditional transformation for '/history' has been removed.
        // setData(json) will now apply to all endpoints, including /history.
        // This assumes the backend for /history now returns data in the correct WorkoutHistory[] format.
        setData(json);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };

    if (authToken) {
      fetchData();
    } else {
      setData(initialValue); // Reset to initial value if not authenticated
      setLoading(false);
      // setError("Utilisateur non authentifié. Impossible de charger les données."); // Optional: set an error
    }
  }, [endpoint, authToken]); // Removed initialValue from dependencies to prevent potential infinite loops

  // Fonction pour envoyer des données via POST
  const postDataToServer = async (itemToPost: any) => { // 'any' for now, could be made generic for a single item
    if (!authToken) {
      const authError = new Error("Utilisateur non authentifié. Impossible de sauvegarder les données.");
      setError(authError.message);
      console.error("Attempted to POST data without authToken.");
      return Promise.reject(authError);
    }

    setError(null); // Clear previous errors before POSTing
    try {
      console.log('[useRemoteStorage] Attempting POST. Auth Token:', authToken);
      const postHeaders = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };
      console.log('[useRemoteStorage] POST headers:', JSON.stringify(postHeaders));

      const res = await fetch(endpoint, { // Assumes endpoint is the collection endpoint for POST
        method: 'POST',
        headers: postHeaders,
        body: JSON.stringify(itemToPost),
      });

      if (!res.ok) {
        const errorText = await res.text();
        const saveError = new Error(`Erreur de sauvegarde (POST): ${res.status} ${errorText}`);
        setError(saveError.message);
        throw saveError;
      }
      return await res.json(); // Return the created item (or response from server)
    } catch (err) {
      console.error(err);
      // If setError was already called with a more specific error from response, don't overwrite.
      // Otherwise, set a generic error.
      if (!error) { // Check if error state is already set by a more specific message
         setError(err instanceof Error ? err.message : 'Erreur de sauvegarde (POST)');
      }
      return Promise.reject(err); // Propagate the error
    }
  };

  // setData is now the direct state setter from useState.
  // postData is the new function for making POST requests.
  return { data, setData, postData: postDataToServer, loading, error };
}

export default useRemoteStorage;