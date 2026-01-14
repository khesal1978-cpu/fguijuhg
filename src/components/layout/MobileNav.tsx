import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Trophy,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Team", path: "/team" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-border bg-card/95">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute -inset-2 bg-accent rounded-xl"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className="size-5 relative z-10" />
              </motion.div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
