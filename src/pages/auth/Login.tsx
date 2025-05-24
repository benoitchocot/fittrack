import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
// import { setToken } from "@/utils/auth"; // Supprimé
import { useAuth } from "@/context/AuthContext"; // Import useAuth


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth(); // Obtenir login du contexte
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("https://apimuscu.chocot.be/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la connexion");
        return;
      }

      // setToken(data.token); // Supprimé
      console.log('[Login.tsx] Token reçu du backend:', data.token);
      console.log('[Login.tsx] Type du token:', typeof data.token);
      login(data.token); // Utiliser la fonction login du contexte
      toast.success("Connecté avec succès !");
      navigate("/");
    } catch (error) {
      toast.error("Erreur réseau");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="text-3xl font-semibold text-workout-primary">
            FitTrack
          </Link>
          <p className="mt-2 text-muted-foreground">
            Connectez-vous pour accéder à vos séances d'entraînement
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Connexion</CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre compte
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                  >
                    Mot de passe oublié ?
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-workout-primary hover:bg-workout-dark"
              >
                Connexion
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex justify-center">
            <div className="text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link
                to="/auth/register"
                className="text-workout-primary hover:underline"
              >
                S'inscrire
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
