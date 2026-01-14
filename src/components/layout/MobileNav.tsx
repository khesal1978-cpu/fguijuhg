import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Gamepad2,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: Gamepad2, label: "Games", path: "/games" },
  { icon: Users, label: "Team", path: "/team" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-1.5 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-colors active-scale"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute -inset-2 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <item.icon 
                  className={`size-5 relative z-10 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`} 
                />
              </div>
              <span 
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
