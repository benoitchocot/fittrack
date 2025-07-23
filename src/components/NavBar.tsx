import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, LogOut, Menu, X } from "lucide-react"; // Added Menu and X icons

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsMobileMenuOpen(false); // Close menu on logout
    navigate("/auth/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b dark:bg-zinc-900 dark:border-zinc-800">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <Link to="/" className="text-xl font-semibold text-workout-primary" onClick={closeMobileMenu}>
          FitTrack
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {token && (
            <>
              <NavLink href="/" current={location.pathname === '/'}>
                Home
              </NavLink>
              <NavLink href="/nutrition" current={location.pathname === '/nutrition'}>
                Nutrition
              </NavLink>
              <NavLink href="/scan" current={location.pathname === '/scan'}>
                Scan
              </NavLink>
            </>
          )}
          <NavLink href="/contact" current={location.pathname === '/contact'}>
            Contact
          </NavLink>
          <NavLink href="/terms" current={location.pathname === '/terms'}>
            CGU
          </NavLink>

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

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            aria-label="Ouvrir le menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 pb-4">
          <div className="container flex flex-col items-start px-4 space-y-2">
            {token && (
              <>
                <NavLink href="/" current={location.pathname === '/'} mobile onClick={closeMobileMenu}>
                  Home
                </NavLink>
                <NavLink href="/nutrition" current={location.pathname === '/nutrition'} mobile onClick={closeMobileMenu}>
                  Nutrition
                </NavLink>
                <NavLink href="/scan" current={location.pathname === '/scan'} mobile onClick={closeMobileMenu}>
                  Scan
                </NavLink>
              </>
            )}
            <NavLink href="/contact" current={location.pathname === '/contact'} mobile onClick={closeMobileMenu}>
              Contact
            </NavLink>
            <NavLink href="/terms" current={location.pathname === '/terms'} mobile onClick={closeMobileMenu}>
              CGU
            </NavLink>

            {token ? (
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500"
                aria-label="Déconnexion"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Déconnexion
              </Button>
            ) : (
              <Button variant="ghost" asChild className="w-full justify-start" onClick={closeMobileMenu}>
                <Link to="/auth/login">
                  <User className="w-5 h-5 mr-2" />
                  Connexion
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

interface NavLinkProps {
  href: string;
  current: boolean;
  children: React.ReactNode;
  mobile?: boolean;
  onClick?: () => void; // Added onClick for closing menu
}

const NavLink = ({
  href,
  current,
  children,
  mobile = false,
  onClick,
}: NavLinkProps) => {
  return (
    <Link
      to={href}
      onClick={onClick} // Call onClick when link is clicked
      className={cn(
        "transition-colors",
        mobile
          ? "block w-full py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-workout-primary dark:hover:text-workout-primary" +
              (current
                ? " text-workout-primary dark:text-workout-primary border-l-4 border-workout-primary pl-3"
                : " pl-4")
          : "px-3 py-2 text-sm font-medium rounded-md" +
              (current
                ? " bg-workout-light text-workout-primary dark:bg-zinc-800"
                : " text-gray-600 hover:text-workout-primary dark:text-gray-300 dark:hover:text-workout-primary")
      )}
    >
      {children}
    </Link>
  );
};

export default NavBar;