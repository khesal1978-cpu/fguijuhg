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
      className="bg-card rounded-2xl p-6 shadow-card border border-border flex items-center gap-4 hover:shadow-glow transition-shadow group"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={`size-14 rounded-2xl ${iconBg} flex items-center justify-center ${iconColor}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <h4 className="text-xl font-display font-bold text-foreground mt-1">
          {value}{" "}
          {unit && (
            <span className="text-sm font-medium text-muted-foreground">
              {unit}
            </span>
          )}
        </h4>
      </div>
    </motion.div>
  );
}
