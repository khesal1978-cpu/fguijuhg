import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 relative overflow-hidden flex flex-col h-full">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl animate-float" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gold/5 blur-3xl animate-float-delayed" />
          <div className="absolute top-[40%] left-[20%] w-[200px] h-[200px] rounded-full bg-accent/30 blur-2xl animate-pulse-slow" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex-1 overflow-y-auto pb-24 lg:pb-0">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
