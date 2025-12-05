// Main React component for the FitTrack application.
// Sets up providers for queries (TanStack Query), tooltips, notifications (Toaster/Sonner),
// authentication (AuthProvider), and routing with React Router.
// Defines all application routes and requires authentication for most pages.
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext"; // Import AuthProvider

import NavBar from "@/components/NavBar"; // Import NavBar
import RequireAuth from "@/components/RequireAuth";
import Index from "./pages/Index";
import TemplateEditor from "./pages/TemplateEditor";
import ActiveWorkout from "./pages/ActiveWorkout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";
import WorkoutHistoryDetail from "./pages/WorkoutHistoryDetail";
import TermsOfService from "./pages/TermsOfService";
import ContactPage from "./pages/Contact";
import ProfilePage from "./pages/Profile";
import DeleteAccountPage from "./pages/admin/DeleteAccount";
import AddToHomeScreenPrompt from "@/components/AddToHomeScreenPrompt";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const showNavBar = !location.pathname.startsWith("/workout/");

  return (
    <>
      {showNavBar && <NavBar />}
      <Routes>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin/delete-account/:userId/:token" element={<DeleteAccountPage />} />
        {/* Routes requiring authentication */}
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/templates/new" element={<TemplateEditor />} />
                <Route path="/templates/edit/:id" element={<TemplateEditor />} />
                <Route path="/workout/:id" element={<ActiveWorkout />} />
                <Route path="/history/:historyId" element={<WorkoutHistoryDetail />} />
                <Route path="/profil" element={<ProfilePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </RequireAuth>
          }
        />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider> {/* AuthProvider wraps Toaster, Sonner, and BrowserRouter */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
        <AddToHomeScreenPrompt /> {/* Add the component here */}
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
