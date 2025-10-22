import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

type UseRemoteStorageOptions<T> = {
  initialValue: T;
  endpoint: string; // e.g. "http://localhost:3001/data"
};

function useRemoteStorage<T>({ initialValue, endpoint }: UseRemoteStorageOptions<T>) {
  const { token: authToken } = useAuth();
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[useRemoteStorage] Attempting fetch via apiFetch. Endpoint:', endpoint);
      const res = await apiFetch(endpoint);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erreur de récupération: ${res.status} ${errorText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      const specificError = err as Error;
      if (specificError.message !== 'Session expired. Redirecting to login.') {
        console.error(err);
        setError(specificError.message || 'Impossible de charger les données');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (authToken) {
      fetchData();
    } else {
      setData(initialValue);
      setLoading(false);
    }
  }, [endpoint, authToken]);

  // Expose a refetch function
  const refetch = () => {
    if (authToken) {
      fetchData();
    }
  };

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
      // authToken is checked before calling postDataToServer.
      // apiFetch will handle token inclusion and Content-Type for JSON string.
      console.log('[useRemoteStorage] Attempting POST via apiFetch. Endpoint:', endpoint);

      const res = await apiFetch(endpoint, { 
        method: 'POST',
        // apiFetch sets Content-Type: application/json if body is an object.
        // Since itemToPost is stringified, this should be fine.
        // If specific Content-Type is needed for stringified body, add it here.
        body: JSON.stringify(itemToPost),
      });

      // apiFetch throws for 401, which will be caught by the catch block.
      // For other errors, we check response.ok.
      if (!res.ok) {
        const errorText = await res.text();
        const saveError = new Error(`Erreur de sauvegarde (POST): ${res.status} ${errorText}`);
        // setError(saveError.message); // Error will be set in the catch block
        throw saveError; // Throw to be caught by the generic catch block
      }
      return await res.json(); // Return the created item (or response from server)
    } catch (err) {
      const specificError = err as Error;
      if (specificError.message === 'Session expired. Redirecting to login.') {
        // apiFetch has handled the redirect.
        // We still need to reject the promise so the caller knows the POST failed.
        return Promise.reject(specificError);
      } else {
        console.error(err);
        // Set error state if not already set by a more specific message from response processing
        // The primary error setting now happens here.
        setError(specificError.message || 'Erreur de sauvegarde (POST)');
        return Promise.reject(specificError); // Propagate the error
      }
    }
  };

  // setData is now the direct state setter from useState.
  // postData is the new function for making POST requests.
  return { data, setData, postData: postDataToServer, loading, error, refetch };
}

export default useRemoteStorage;
