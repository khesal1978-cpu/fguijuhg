import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Trophy,
  Settings,
  LogOut,
  Hexagon,
  Gamepad2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Gamepad2, label: "Games", path: "/games" },
  { icon: Users, label: "Team", path: "/team" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
];

export function Sidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col h-full bg-card border-r border-border">
      {/* Logo Area */}
      <div className="h-20 flex items-center gap-3 px-6 border-b border-border">
        <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-glow">
          <Hexagon className="size-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-tight tracking-tight text-foreground">
            PingCaset
          </h1>
          <p className="text-xs text-primary font-medium tracking-wide">
            MINING HUB
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-2 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
                />
              )}
              <item.icon
                className={`size-5 ${isActive ? "text-primary" : ""}`}
              />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}

        {/* Settings at bottom */}
        <div className="mt-auto pt-4 border-t border-border">
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 ${
              location.pathname === "/settings" ? "bg-accent text-accent-foreground" : ""
            }`}
          >
            <Settings className="size-5" />
            <span className="font-medium text-sm">Settings</span>
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
          <div
            className="size-10 rounded-full bg-gradient-to-br from-primary to-gold"
          />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-foreground truncate">
              {profile?.display_name || "Miner"}
            </span>
            <span className="text-xs text-primary font-medium">
              {profile?.is_premium ? "Pro Plan" : `Level ${profile?.level || 1}`}
            </span>
          </div>
        </div>

        {/* Mining Status */}
        <div className="mt-3 bg-accent/50 rounded-xl p-3 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Mining Power
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-xl font-bold text-foreground">
              {profile?.mining_power || 50}
            </span>
            <span className="text-xs font-medium text-muted-foreground mb-1">
              %
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={signOut}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
