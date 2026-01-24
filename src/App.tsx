import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import Team from "./pages/Team";
import Games from "./pages/Games";
import Settings from "./pages/Settings";
import TermsConditions from "./pages/TermsConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import HelpCenter from "./pages/HelpCenter";
import Whitepaper from "./pages/Whitepaper";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/games" element={<Games />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/team" element={<Team />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/terms" element={<TermsConditions />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/whitepaper" element={<Whitepaper />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;