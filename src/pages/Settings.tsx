import { motion } from "framer-motion";
import { User, Bell, Shield, LogOut, ChevronRight, Zap, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const settingsItems = [
    { icon: User, title: "Edit Profile", subtitle: "Update display name" },
    { icon: Bell, title: "Notifications", subtitle: "Manage alerts" },
    { icon: Shield, title: "Security", subtitle: "Password & 2FA" },
  ];

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        className="card-dark p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
            <User className="size-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-display font-bold text-foreground truncate">
              {profile?.display_name || "Miner"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Level {profile?.level || 1} • {profile?.is_premium ? "⭐ PRO" : "Free"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Code: {profile?.referral_code}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border">
          {[
            { icon: Zap, value: Number(profile?.total_mined || 0).toLocaleString(), label: "Mined", color: "text-primary" },
            { icon: Award, value: `${profile?.mining_power || 50}%`, label: "Power", color: "text-gold" },
            { icon: User, value: profile?.level || 1, label: "Level", color: "text-accent-foreground" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <stat.icon className={`size-4 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Settings List */}
      <motion.div 
        className="card-dark divide-y divide-border"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {settingsItems.map((item, i) => (
          <button 
            key={i}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center">
                <item.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        ))}
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="destructive"
          className="w-full h-12 rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="size-4 mr-2" />
          Logout
        </Button>
      </motion.div>

      <p className="text-center text-xs text-muted-foreground">
        PingCaset Mining Hub v1.0
      </p>
    </div>
  );
}
