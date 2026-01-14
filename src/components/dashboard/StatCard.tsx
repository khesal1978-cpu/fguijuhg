import { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
  iconBg?: string;
  iconColor?: string;
}

export function StatCard({
  icon,
  label,
  value,
  unit,
  iconBg = "bg-accent",
  iconColor = "text-primary",
}: StatCardProps) {
  return (
    <motion.div 
      className="glass-card rounded-xl p-4 flex items-center gap-3 group cursor-default"
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <motion.div 
        className={`size-12 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} relative overflow-hidden`}
        whileHover={{ rotate: 5 }}
      >
        {icon}
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </motion.div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-lg font-serif font-bold text-foreground truncate">
          {value}
          {unit && <span className="text-xs font-sans font-medium text-muted-foreground ml-1">{unit}</span>}
        </p>
      </div>
    </motion.div>
  );
}
