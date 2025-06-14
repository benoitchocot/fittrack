import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext"; // Import AuthProvider

import RequireAuth from "@/components/RequireAuth";
import Index from "./pages/Index";
import TemplateEditor from "./pages/TemplateEditor";
import ActiveWorkout from "./pages/ActiveWorkout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";
import WorkoutHistoryDetail from "./pages/WorkoutHistoryDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider> {/* AuthProvider wraps Toaster, Sonner, and BrowserRouter */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/templates/new" element={<TemplateEditor />} />
                  <Route
                    path="/templates/edit/:id"
                    element={<TemplateEditor />}
                  />
                  <Route path="/workout/:id" element={<ActiveWorkout />} />
                  <Route path="/history/:historyId" element={<WorkoutHistoryDetail />} />
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/register" element={<Register />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
