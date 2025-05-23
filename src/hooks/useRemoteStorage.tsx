// hooks/useRemoteStorage.tsx
import { useState, useEffect } from 'react';

type UseRemoteStorageOptions<T> = {
  initialValue: T;
  token: string;
  endpoint: string; // e.g. "http://localhost:3001/data"
};

function useRemoteStorage<T>({ initialValue, token, endpoint }: UseRemoteStorageOptions<T>) {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données depuis le backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) throw new Error('Erreur de récupération');

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, token]);

  // Fonction pour sauvegarder les données
  const saveData = async (newData: T) => {
    try {
      setData(newData); // Optimiste
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData),
      });

      if (!res.ok) throw new Error('Erreur de sauvegarde');
    } catch (err) {
      console.error(err);
      setError('Erreur de sauvegarde');
    }
  };

  return { data, setData: saveData, loading, error };
}

export default useRemoteStorage;