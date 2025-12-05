// src/pages/TermsOfService.tsx
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import API_BASE_URL from "@/config";
import { getToken } from "@/utils/auth";

const TermsOfService: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleRequestDeletion = async () => {
    if (!confirm(
      "Êtes-vous sûr de vouloir demander la suppression de votre compte ?\n\n" +
      "Cette action entraînera la suppression définitive de :\n" +
      "- Toutes vos séances d'entraînement\n" +
      "- Votre historique complet\n" +
      "- Tous vos modèles créés\n" +
      "- Votre compte utilisateur\n\n" +
      "Un email sera envoyé à l'administrateur pour traiter votre demande."
    )) {
      return;
    }

    setDeleting(true);
    setDeleteStatus({ type: null, message: '' });

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}users/me/request-deletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteStatus({
          type: 'success',
          message: data.message || 'Votre demande de suppression a été envoyée à l\'administrateur. Vous recevrez une confirmation une fois que votre compte aura été supprimé.'
        });
      } else {
        setDeleteStatus({
          type: 'error',
          message: data.error || 'Une erreur est survenue lors de l\'envoi de la demande.'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la demande de suppression:', error);
      setDeleteStatus({
        type: 'error',
        message: 'Impossible de contacter le serveur. Veuillez réessayer plus tard.'
      });
    } finally {
      setDeleting(false);
    }
  };
  return (
    <>
      <div className="container mx-auto p-4 pt-20">
        {" "}
        <h1 className="text-3xl font-bold mb-6">
          Conditions Générales d'Utilisation (CGU)
        </h1>
        <div className="prose max-w-none">
          <p>
            Bienvenue sur FitTrack ! Ces Conditions Générales d'Utilisation
            (ci-après les "CGU") régissent votre accès et votre utilisation de
            l'application FitTrack (ci-après "l'Application"). En téléchargeant,
            installant ou utilisant l'Application, vous acceptez d'être lié par
            les présentes CGU. Si vous n'acceptez pas ces termes, veuillez ne
            pas utiliser l'Application.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">
            Article 1 : Objet de l'Application
          </h2>
          <p>
            FitTrack est une application mobile et web gratuite conçue pour vous
            aider à suivre vos entraînements sportifs. Elle permet aux utilisateurs de créer et d'enregistrer
            des modèles de séances d'entraînement et de consulter leur historique personnel.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">
            Article 2 : Accès et Utilisation de l'Application
          </h2>
          <p>
            L'accès à l'Application est ouvert à tout public. L'utilisation de
            l'Application est gratuite.
          </p>
          <p>
            Vous reconnaissez que l'Application est susceptible d'afficher des
            publicités, notamment via Google AdSense. Ces publicités contribuent
            à financer le développement et la maintenance de l'Application.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">
            Article 3 : Données Personnelles et Confidentialité
          </h2>
          <p>
            FitTrack s'engage à respecter la confidentialité de vos données
            personnelles. Les données que vous renseignez (informations
            d'entraînement) sont stockées dans notre base
            de données. Ces informations sont strictement privées et ne sont
            accessibles qu'à vous. Il n'existe aucune fonctionnalité de contact
            ou de partage d'informations entre les utilisateurs au sein de
            l'Application.
          </p>
          <p>
            Votre adresse e-mail est collectée uniquement dans le but de vous
            informer des mises à jour des présentes CGU ou des évolutions
            majeures de l'Application. Nous nous engageons à ne pas utiliser
            votre e-mail à des fins commerciales non sollicitées.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">
            Article 4 : Absence de Responsabilité et de Garantie
          </h2>
          <p>
            FitTrack est un outil de suivi et d'information. Toutes les
            informations fournies au sein de l'Application (suivi d'entraînement) sont données à
            titre purement indicatif. FitTrack ne fournit aucun conseil médical,
            diététique ou sportif personnalisé. Vous êtes seul responsable de
            l'utilisation que vous faites de ces informations et des
            conséquences qui pourraient en découler.
          </p>
          <p>
            FitTrack, ses développeurs et contributeurs déclinent toute
            responsabilité en cas de dommages directs ou indirects, de blessures
            ou de problèmes de santé qui pourraient résulter de l'utilisation ou
            de la mauvaise utilisation des informations ou fonctionnalités de
            l'Application. Il est fortement recommandé de consulter un
            professionnel de santé ou un spécialiste du sport qualifié avant
            d'entreprendre tout régime alimentaire ou programme d'exercice
            physique.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">
            Article 5 : Propriété Intellectuelle
          </h2>
          <p>
            L'Application FitTrack est un projet open source. Le code source est
            disponible et accessible publiquement sur GitHub à l'adresse
            suivante :{" "}
            <a
              href="https://github.com/benoitchocot/fittrack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              https://github.com/benoitchocot/fittrack
            </a>
          </p>
          <p>
            Les contenus générés par les utilisateurs (modèles de séances) restent leur propriété exclusive.
            Cependant, en les saisissant dans l'Application, vous nous accordez
            une licence non exclusive, mondiale, gratuite pour les héberger et
            les utiliser aux seules fins de vous fournir le service.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">
            Article 6 : Modifications des CGU
          </h2>
          <p>
            FitTrack se réserve le droit de modifier les présentes CGU à tout
            moment. Toute modification vous sera notifiée par e-mail à l'adresse
            que vous avez fournie lors de la création de votre compte, et/ou par
            une notification au sein de l'Application. Votre utilisation
            continue de l'Application après la publication des modifications
            constitue votre acceptation des nouvelles CGU.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">
            Article 7 : Droit Applicable et Litiges
          </h2>
          <p>
            Les présentes CGU sont régies par le droit français. En cas de
            litige relatif à l'interprétation ou à l'exécution des présentes
            CGU, les parties s'efforceront de trouver une solution amiable. À
            défaut d'accord amiable, les tribunaux français seront seuls
            compétents.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">
            Article 8 : Suppression de compte
          </h2>
          <p>
            Vous avez le droit de demander la suppression de votre compte et de toutes vos données personnelles à tout moment. 
            La suppression de votre compte entraînera la suppression permanente de toutes vos données, y compris vos séances 
            d'entraînement, historique, modèles et autres informations associées à votre compte.
          </p>

          {isAuthenticated ? (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700 mb-4">
                Si vous souhaitez supprimer votre compte, cliquez sur le bouton ci-dessous. Un email sera envoyé à 
                l'administrateur qui procédera à la suppression de votre compte après vérification.
              </p>

              {deleteStatus.type && (
                <Alert className={`mb-4 ${
                  deleteStatus.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <AlertDescription>
                    {deleteStatus.message}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleRequestDeletion}
                disabled={deleting || deleteStatus.type === 'success'}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? (
                  <>⌛ Envoi en cours...</>
                ) : (
                  <>🗑️ Demander la suppression de mon compte</>
                )}
              </Button>
            </div>
          ) : (
            <p className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-600 italic">
              Vous devez être connecté pour demander la suppression de votre compte.
            </p>
          )}

          <h2 className="text-2xl font-semibold mt-6 mb-3">
            Article 9 : Contact
          </h2>
          <p>
            Pour toute question ou information concernant l'Application ou les
            présentes CGU, vous pouvez nous contacter via le formulaire de
            contact disponible sur le site web de FitTrack à l'adresse :{" "}
            <a
              href="https://muscu.chocot.be/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              https://muscu.chocot.be/contact
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;
