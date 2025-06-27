// src/pages/TermsOfService.tsx
import React from "react";

const TermsOfService: React.FC = () => {
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
            aider à suivre vos entraînements sportifs et à gérer votre
            nutrition. Elle permet aux utilisateurs de créer et d'enregistrer
            des modèles de séances d'entraînement, de suivre leurs apports
            nutritionnels et de consulter leur historique personnel. Les
            informations relatives aux nutriments et calories des aliments
            proviennent de la base de données publique Ciqual de l'ANSES (Agence
            Nationale de Sécurité Sanitaire de l'Alimentation, de
            l'Environnement et du Travail), disponible sur{" "}
            <a
              href="https://ciqual.anses.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              ciqual.anses.fr
            </a>
            .
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
            d'entraînement, apports nutritionnels) sont stockées dans notre base
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
            informations fournies au sein de l'Application (données
            nutritionnelles de Ciqual, suivi d'entraînement) sont données à
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
            Les contenus générés par les utilisateurs (modèles de séances,
            données nutritionnelles) restent leur propriété exclusive.
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
            Article 8 : Contact
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
