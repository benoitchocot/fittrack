import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, LogOut } from "lucide-react";

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth/login");
  };

  return (
    <nav className="sticky top-0 z-10 w-full bg-white border-b dark:bg-zinc-900 dark:border-zinc-800">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <div className="text-xl font-semibold text-workout-primary">
          FitTrack
        </div>

        <div className="flex items-center space-x-4">
          <NavLink href="/" current={location.pathname === '/'} >
            Home
          </NavLink>
          <NavLink href="/nutrition" current={location.pathname === '/nutrition'}>
            Nutrition
          </NavLink>

          {/* Bouton user ou logout selon présence token */}
          {token ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/auth/login">
                <User className="w-5 h-5" />
              </Link>
            </Button>
          )}
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

const NavLink = ({
  href,
  current,
  children,
  mobile = false,
}: NavLinkProps) => {
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