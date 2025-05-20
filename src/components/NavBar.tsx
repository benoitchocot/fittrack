
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

const NavBar = () => {
  const location = useLocation();
  
  return (
    <nav className="sticky top-0 z-10 w-full bg-white border-b dark:bg-zinc-900 dark:border-zinc-800">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <Link to="/" className="text-xl font-semibold text-workout-primary">
          FitTrack
        </Link>
        
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex sm:items-center sm:space-x-2">
            <NavLink href="/" current={location.pathname === "/"}>
              Accueil
            </NavLink>
            <NavLink href="/templates" current={location.pathname.includes("/templates")}>
              Modèles
            </NavLink>
          </div>
          
          <Button variant="ghost" size="icon" asChild>
            <Link to="/auth/login">
              <User className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="container sm:hidden">
        <div className="grid grid-cols-2 border-t">
          <NavLink href="/" current={location.pathname === "/"} mobile>
            Accueil
          </NavLink>
          <NavLink href="/templates" current={location.pathname.includes("/templates")} mobile>
            Modèles
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

interface NavLinkProps {
  href: string;
  current: boolean;
  children: React.ReactNode;
  mobile?: boolean;
}

const NavLink = ({ href, current, children, mobile = false }: NavLinkProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "transition-colors",
        mobile
          ? "flex justify-center py-3 text-sm font-medium border-b-2" +
            (current
              ? " border-workout-primary text-workout-primary"
              : " border-transparent hover:text-workout-primary hover:border-workout-primary")
          : "px-3 py-2 text-sm font-medium rounded-md" +
            (current
              ? " bg-workout-light text-workout-primary"
              : " text-gray-600 hover:text-workout-primary dark:text-gray-300")
      )}
    >
      {children}
    </Link>
  );
};

export default NavBar;
