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
  }, [endpoint, authToken]);

  // Fonction pour sauvegarder les données
  const saveData = async (newData: T) => {
    if (!authToken) {
      setError("Utilisateur non authentifié. Impossible de sauvegarder les données.");
      console.error("Attempted to save data without authToken.");
      return; // Prevent API call
    }

    // setError(null); // Clear previous errors before saving
    try {
      setData(newData); // Optimiste
      console.log('[useRemoteStorage] Attempting save. Auth Token:', authToken);
      const saveHeaders = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };
      console.log('[useRemoteStorage] Save headers:', JSON.stringify(saveHeaders));

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: saveHeaders,
        body: JSON.stringify(newData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erreur de sauvegarde: ${res.status} ${errorText}`);
      }
      // No need to setData(await res.json()) for POST, optimistic update is fine
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde');
      // Optionally revert optimistic update here if needed
    }
  };

  return { data, setData: saveData, loading, error };
}

export default useRemoteStorage;