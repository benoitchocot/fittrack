import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NutritionPage from "./pages/Nutrition";
import TermsOfService from "./pages/TermsOfService"; // Import the new Terms of Service page
import ContactPage from "./pages/Contact"; // Import the new Contact page
import AddToHomeScreenPrompt from "@/components/AddToHomeScreenPrompt"; // Import the new component

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider> {/* AuthProvider wraps Toaster, Sonner, and BrowserRouter */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NavBar /> 
          <Routes>
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/contact" element={<ContactPage />} />
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
                    <Route path="/nutrition" element={<NutritionPage />} />
                    {/* Remove duplicate auth routes from here as they are defined above and public */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
        <AddToHomeScreenPrompt /> {/* Add the component here */}
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
