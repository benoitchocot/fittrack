import React, { createContext, useState, useContext, useEffect } from "react";
import {
  getToken as getStoredToken,
  setToken as storeToken,
  clearToken as removeStoredToken,
} from "@/utils/auth"; // Supposant que ces fonctions existent et gèrent localStorage

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (newToken: string) => void;
  logout: () => void;
  loading: boolean;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialToken = getStoredToken();
    if (
      initialToken &&
      typeof initialToken === "string" &&
      initialToken.trim() !== ""
    ) {
      setToken(initialToken);
      setIsAuthenticated(true);
    } else {
      setToken(null);
      setIsAuthenticated(false);
    }
    setLoading(false); // ✅ terminé
  }, []);

  const login = (newToken: string) => {
    console.log(
      "[AuthContext] Fonction login appelée avec newToken:",
      newToken
    );
    console.log("[AuthContext] Type de newToken:", typeof newToken);
    if (typeof newToken === "string" && newToken.trim() !== "") {
      storeToken(newToken); // storeToken est localStorage.setItem("token", newToken)
      console.log(
        "[AuthContext] Token stocké dans localStorage. Vérifiez l'onglet Application."
      );
      setToken(newToken);
      setIsAuthenticated(true);
      console.log(
        "[AuthContext] État du contexte mis à jour : isAuthenticated = true"
      );
    } else {
      console.error(
        "[AuthContext] Tentative de stocker un token invalide (vide ou non-string):",
        newToken
      );
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
    <AuthContext.Provider
      value={{ token, isAuthenticated, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
