// src/pages/admin/DeleteAccount.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import API_BASE_URL from '@/config';

const DeleteAccountPage: React.FC = () => {
  const { userId, token } = useParams<{ userId: string; token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    verifyToken();
  }, [userId, token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}users/delete/${userId}/${token}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setUserEmail(data.userEmail);
      } else {
        setError(data.error || 'Token invalide ou expiré');
      }
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
      setError('Impossible de vérifier le token');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le compte de ${userEmail} ?\n\nCette action est IRRÉVERSIBLE et supprimera:\n- Toutes les séances d'entraînement\n- L'historique complet\n- Tous les modèles créés\n- Le compte utilisateur`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}users/delete/${userId}/${token}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la communication avec le serveur');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl w-full text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Compte supprimé avec succès
          </h1>
          <p className="text-gray-600 mb-6">
            Le compte de <strong>{userEmail}</strong> a été définitivement supprimé avec toutes ses données.
          </p>
          <Button onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Erreur
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="text-red-500 text-6xl mb-4">🗑️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Suppression de compte
          </h1>
          <p className="text-gray-600 mb-4">
            Vous êtes sur le point de supprimer le compte de:
          </p>
          <p className="text-xl font-semibold text-gray-900 mb-6">
            {userEmail}
          </p>
        </div>

        <Alert className="bg-red-50 border-red-200 mb-6">
          <AlertDescription className="text-red-800">
            <p className="font-semibold mb-2">⚠️ Attention - Action irréversible</p>
            <p className="text-sm">
              Cette action supprimera définitivement:
            </p>
            <ul className="list-disc list-inside text-sm mt-2 ml-4">
              <li>Le compte utilisateur</li>
              <li>Toutes les séances d'entraînement</li>
              <li>L'historique complet</li>
              <li>Tous les modèles créés</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? (
              <>
                <span className="animate-spin mr-2">⌛</span>
                Suppression...
              </>
            ) : (
              <>🗑️ Confirmer la suppression</>
            )}
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            disabled={deleting}
          >
            Annuler
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          En confirmant, vous déclarez avoir l'autorité pour supprimer ce compte.
        </p>
      </div>
    </div>
  );
};

export default DeleteAccountPage;
