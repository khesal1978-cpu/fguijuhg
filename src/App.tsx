import { lazy, Suspense, memo, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatus } from "@/components/NetworkStatus";
import { PageTransition } from "@/components/PageTransition";

// Lazy load pages for better performance
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Team = lazy(() => import("./pages/Team"));
const Groups = lazy(() => import("./pages/Groups"));
const Games = lazy(() => import("./pages/Games"));
const Settings = lazy(() => import("./pages/Settings"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Whitepaper = lazy(() => import("./pages/Whitepaper"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Ultra-minimal loading placeholder - prevents layout shift without showing spinner
const PagePlaceholder = memo(() => (
  <div className="w-full h-full min-h-[50vh]" aria-hidden="true" />
));
PagePlaceholder.displayName = "PagePlaceholder";

// Configure query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Animated routes wrapper with optimized Suspense boundaries
const AnimatedRoutes = memo(function AnimatedRoutes() {
  const location = useLocation();
  
  // Memoize location key to prevent unnecessary re-renders
  const locationKey = useMemo(() => location.pathname, [location.pathname]);
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={locationKey}>
        <Route path="/auth" element={
          <PageTransition>
            <Suspense fallback={<PagePlaceholder />}>
              <Auth />
            </Suspense>
          </PageTransition>
        } />
        <Route element={<AppLayout />}>
          <Route path="/" element={
            <PageTransition>
              <Suspense fallback={<PagePlaceholder />}>
                <Dashboard />
              </Suspense>
            </PageTransition>
          } />
          <Route path="/games" element={
            <PageTransition>
              <Suspense fallback={<PagePlaceholder />}>
                <Games />
              </Suspense>
            </PageTransition>
          } />
          <Route path="/wallet" element={
            <PageTransition>
              <Suspense fallback={<PagePlaceholder />}>
                <Wallet />
              </Suspense>
            </PageTransition>
          } />
          <Route path="/team" element={
            <PageTransition>
              <Suspense fallback={<PagePlaceholder />}>
                <Team />
              </Suspense>
            </PageTransition>
          } />
          <Route path="/groups" element={
            <PageTransition>
              <Suspense fallback={<PagePlaceholder />}>
                <Groups />
              </Suspense>
            </PageTransition>
          } />
          <Route path="/settings" element={
            <PageTransition>
              <Suspense fallback={<PagePlaceholder />}>
                <Settings />
              </Suspense>
            </PageTransition>
          } />
          <Route path="/terms" element={
            <PageTransition>
              <Suspense fallback={<PagePlaceholder />}>
                <TermsConditions />
              </Suspense>
            </PageTransition>
          } />
          <Route path="/privacy" element={
            <PageTransition>
              <Suspense fallback={<PagePlaceholder />}>
                <PrivacyPolicy />
              </Suspense>
            </PageTransition>
          } />
          <Route path="/help" element={
            <PageTransition>
              <Suspense fallback={<PagePlaceholder />}>
                <HelpCenter />
              </Suspense>
            </PageTransition>
          } />
          <Route path="/whitepaper" element={
            <PageTransition>
              <Suspense fallback={<PagePlaceholder />}>
                <Whitepaper />
              </Suspense>
            </PageTransition>
          } />
        </Route>
        <Route path="*" element={
          <PageTransition>
            <Suspense fallback={<PagePlaceholder />}>
              <NotFound />
            </Suspense>
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
        <NotificationProvider>
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
              <AnimatedRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
));

App.displayName = "App";

export default App;
