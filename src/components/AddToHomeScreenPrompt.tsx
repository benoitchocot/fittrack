// src/components/AddToHomeScreenPrompt.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AddToHomeScreenPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other' | null>(null);
  const [browser, setBrowser] = useState<'safari' | 'chrome' | 'firefox' | 'other' | null>(null);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;

    if (!isMobile) {
      return;
    }

    if (localStorage.getItem('addToHomeScreenDismissed')) {
      return;
    }

    // Check if the app is already installed (PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      return;
    }
    
    // Further checks to ensure it's not a webview within another app
    if ((navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches) {
        return; 
    }


    const ua = navigator.userAgent.toLowerCase();
    if (isIOS) {
      setPlatform('ios');
      if (ua.includes('safari/') && !ua.includes('crios/') && !ua.includes('fxios/')) {
        setBrowser('safari');
      } else if (ua.includes('crios/')) {
        setBrowser('chrome');
      } else if (ua.includes('fxios/')) {
        setBrowser('firefox');
      }
       else {
        setBrowser('other');
      }
    } else if (isAndroid) {
      setPlatform('android');
      if (ua.includes('firefox/')) {
        setBrowser('firefox');
      } else if (ua.includes('chrome/') && !ua.includes('edge/') && !ua.includes('opr/')) {
        setBrowser('chrome');
      } else {
        setBrowser('other'); // Covers Samsung Internet, Opera, Edge, etc.
      }
    } else {
      setPlatform('other');
      setBrowser('other');
    }

    // Only show for mobile devices, not tablets for now
    // A more robust check might be needed depending on requirements
    const isLikelyPhone = window.innerWidth < 768; // Example breakpoint

    if (isMobile && isLikelyPhone) {
        // Delay showing the prompt slightly to allow the main UI to load
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 3000); // 3 seconds delay
        return () => clearTimeout(timer);
    }

  }, []);

  const handleDismiss = () => {
    localStorage.setItem('addToHomeScreenDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible || !platform || !browser ) {
    return null;
  }

  let instructions = '';
  let icon = '';

  if (platform === 'ios') {
    if (browser === 'safari') {
      instructions = "Pour ajouter à l'écran d'accueil, appuyez sur l'icône de partage (carré avec une flèche vers le haut) en bas de l'écran, puis sélectionnez 'Sur l'écran d'accueil'.";
      icon = 'ios_share.svg'; // Placeholder, replace with actual icon path
    } else if (browser === 'chrome') {
      instructions = "Pour ajouter à l'écran d'accueil, appuyez sur les trois points en haut à droite, puis sélectionnez 'Ajouter à l'écran d'accueil'.";
      icon = 'chrome_menu.svg'; // Placeholder
    } else if (browser === 'firefox') {
        instructions = "Pour ajouter à l'écran d'accueil, appuyez sur les trois points en bas à droite, puis sélectionnez 'Installer'.";
        icon = 'firefox_menu.svg'; // Placeholder
    }
     else {
      // Generic iOS instructions or hide
      return null;
    }
  } else if (platform === 'android') {
    if (browser === 'chrome') {
      instructions = "Pour ajouter à l'écran d'accueil, appuyez sur les trois points en haut à droite, puis sélectionnez 'Installer l'application' ou 'Ajouter à l'écran d'accueil'.";
      icon = 'chrome_menu.svg'; // Placeholder
    } else if (browser === 'firefox') {
      instructions = "Pour ajouter à l'écran d'accueil, appuyez sur les trois points en bas à droite, puis sélectionnez 'Installer'.";
      icon = 'firefox_menu.svg'; // Placeholder
    } else {
      // Generic Android instructions or hide for less common browsers
      instructions = "Vous pouvez généralement ajouter cette application à votre écran d'accueil via le menu de votre navigateur.";
    }
  } else {
    // Not iOS or Android phone, or already installed
    return null;
  }
  
  if (!instructions) return null;


  return (
    <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md bg-background border border-border shadow-lg rounded-lg p-4 z-[1000] text-foreground">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-foreground/70 hover:text-foreground"
        aria-label="Fermer"
      >
        <X size={20} />
      </button>
      <div className="flex flex-col items-center text-center">
        {/* TODO: Add actual icons if desired, e.g. using Lucide icons or SVGs */}
        {/* {platform === 'ios' && browser === 'safari' && <Share className="w-6 h-6 mb-2 text-primary" />} */}
        {/* {browser === 'chrome' && <MoreVertical className="w-6 h-6 mb-2 text-primary" />} */}
        {/* {browser === 'firefox' && <MoreVertical className="w-6 h-6 mb-2 text-primary" />} */}
        <p className="text-sm">{instructions}</p>
      </div>
    </div>
  );
};

export default AddToHomeScreenPrompt;
