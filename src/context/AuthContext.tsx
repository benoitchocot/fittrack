import React, { createContext, useState, useContext, useEffect } from 'react';
import { getToken as getStoredToken, setToken as storeToken, clearToken as removeStoredToken } from '@/utils/auth'; // Supposant que ces fonctions existent et gèrent localStorage

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (newToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Au chargement initial, essayer de récupérer le token depuis localStorage
  useEffect(() => {
    const initialToken = getStoredToken(); // getStoredToken est getToken de utils/auth
    console.log('[AuthProvider] Initializing... Attempting to load token from localStorage.');
    console.log('[AuthProvider] Token found in localStorage:', initialToken); 
    console.log('[AuthProvider] Type of token from localStorage:', typeof initialToken);

    if (initialToken && typeof initialToken === 'string' && initialToken.trim() !== '') {
      setToken(initialToken);
      setIsAuthenticated(true);
      console.log('[AuthProvider] Auth state initialized FROM localStorage. Token:', initialToken, 'isAuthenticated: true');
    } else {
      console.log('[AuthProvider] No valid token found in localStorage on init, or token is invalid. Setting isAuthenticated: false.');
      // Assurez-vous que l'état est propre si aucun token n'est trouvé ou s'il est invalide
      setToken(null); 
      setIsAuthenticated(false);
    }
  }, []); // Le tableau de dépendances vide est correct pour une exécution unique au montage

  const login = (newToken: string) => {
    console.log('[AuthContext] Fonction login appelée avec newToken:', newToken);
    console.log('[AuthContext] Type de newToken:', typeof newToken);
    if (typeof newToken === 'string' && newToken.trim() !== '') {
      storeToken(newToken); // storeToken est localStorage.setItem("token", newToken)
      console.log('[AuthContext] Token stocké dans localStorage. Vérifiez l\'onglet Application.');
      setToken(newToken);
      setIsAuthenticated(true);
      console.log('[AuthContext] État du contexte mis à jour : isAuthenticated = true');
    } else {
      console.error('[AuthContext] Tentative de stocker un token invalide (vide ou non-string):', newToken);
      // Optionnel: gérer ce cas d'erreur, par exemple ne pas mettre isAuthenticated à true
      setToken(null); // S'assurer que le token est null
      setIsAuthenticated(false); // S'assurer que l'état reflète l'échec
    }
  };

  const logout = () => {
    removeStoredToken(); // Effacer de localStorage
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
