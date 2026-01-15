import { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  iconBg?: string;
  iconColor?: string;
  highlight?: boolean;
}

export function StatCard({
  icon,
  label,
  value,
  unit,
  iconBg,
  iconColor,
  highlight = false,
}: StatCardProps) {
  return (
    <motion.div
      className={`p-4 rounded-2xl border ${
        highlight 
          ? "bg-primary/5 border-primary/20" 
          : "bg-card border-border"
      }`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`size-8 rounded-lg flex items-center justify-center ${
          highlight 
            ? "bg-primary/10 text-primary" 
            : iconBg || "bg-muted"
        } ${iconColor || "text-muted-foreground"}`}>
          {icon}
        </div>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-display font-bold text-foreground">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </motion.div>
  );
}
