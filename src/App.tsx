import { lazy, Suspense, memo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/PageLoader";
import { NetworkStatus } from "@/components/NetworkStatus";
import { PageTransition } from "@/components/PageTransition";

// Lazy load pages for better performance
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Team = lazy(() => import("./pages/Team"));
const Games = lazy(() => import("./pages/Games"));
const Settings = lazy(() => import("./pages/Settings"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Whitepaper = lazy(() => import("./pages/Whitepaper"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Configure query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Animated routes wrapper
const AnimatedRoutes = memo(function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/auth" element={
          <PageTransition>
            <Auth />
          </PageTransition>
        } />
        <Route element={<AppLayout />}>
          <Route path="/" element={
            <PageTransition>
              <Dashboard />
            </PageTransition>
          } />
          <Route path="/games" element={
            <PageTransition>
              <Games />
            </PageTransition>
          } />
          <Route path="/wallet" element={
            <PageTransition>
              <Wallet />
            </PageTransition>
          } />
          <Route path="/team" element={
            <PageTransition>
              <Team />
            </PageTransition>
          } />
          <Route path="/settings" element={
            <PageTransition>
              <Settings />
            </PageTransition>
          } />
          <Route path="/terms" element={
            <PageTransition>
              <TermsConditions />
            </PageTransition>
          } />
          <Route path="/privacy" element={
            <PageTransition>
              <PrivacyPolicy />
            </PageTransition>
          } />
          <Route path="/help" element={
            <PageTransition>
              <HelpCenter />
            </PageTransition>
          } />
          <Route path="/whitepaper" element={
            <PageTransition>
              <Whitepaper />
            </PageTransition>
          } />
        </Route>
        <Route path="*" element={
          <PageTransition>
            <NotFound />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
});

const App = memo(() => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={300}>
          <Toaster />
          <Sonner 
            position="top-center" 
            toastOptions={{
              duration: 3000,
              className: "!bg-card !border-border !text-foreground",
            }}
          />
          <NetworkStatus />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <AnimatedRoutes />
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
));

App.displayName = "App";

export default App;
