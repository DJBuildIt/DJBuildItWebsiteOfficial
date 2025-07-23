import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSupabaseTracking } from "./hooks/useSupabaseTracking";
import Index from "./pages/Index";
import Finance from "./pages/Finance";
import Fitness from "./pages/Fitness";
import Apps from "./pages/Apps";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import BusinessDashboard from "./components/admin/BusinessDashboard";
import { useEffect } from "react";
import { toast } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 404s
        if ((error as any)?.response?.status === 404) return false;
        // Otherwise, retry up to 3 times
        return failureCount < 3;
      },
    },
    mutations: {
      onError: (error: Error) => {
        const errorMessage = error.message || 'An unexpected error occurred';
        toast.error(`Mutation Failed: ${errorMessage}`);
      },
    },
  },
});

// Redirect component for external store
const StoreRedirect = () => {
  useEffect(() => {
    // Redirect to DJBuildIt FourthWall store
    window.location.href = 'https://djbuildit-shop.fourthwall.com/';
  }, []);

  return null; // No UI needed, just redirect
};

// Internal component that initializes Supabase tracking
const AppWithTracking = () => {
  const { isInitialized } = useSupabaseTracking();

  // The useSupabaseTracking hook automatically initializes itself
  // No manual initialization needed - just render the routes
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/finance" element={<Finance />} />
      <Route path="/fitness" element={<Fitness />} />
      <Route path="/apps" element={<Apps />} />
      <Route path="/store" element={<StoreRedirect />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/admin/dashboard" element={<BusinessDashboard />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AppWithTracking />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
