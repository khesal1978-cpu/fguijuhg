import { motion } from "framer-motion";
import { User, Bell, Shield, LogOut, ChevronRight, Zap, Award, Loader2, Sparkles } from "lucide-react";
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
        <motion.div 
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-breathe" />
            <div className="relative size-14 rounded-2xl bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center">
              <Loader2 className="size-7 animate-spin text-primary-foreground" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </motion.div>
      </div>
    );
  }

  const settingsItems = [
    { icon: User, title: "Edit Profile", subtitle: "Update your display name", onClick: () => {} },
    { icon: Bell, title: "Notifications", subtitle: "Manage alerts", onClick: () => {} },
    { icon: Shield, title: "Security", subtitle: "Password & 2FA", onClick: () => {} },
  ];

  return (
    <div className="px-4 py-6 md:px-8 lg:py-8 max-w-[800px] mx-auto w-full space-y-6 md:space-y-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account
        </p>
      </motion.header>

      {/* Profile Card */}
      <motion.div
        className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Background blob */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/10 to-accent-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 animate-morph" />
        
        <div className="flex items-center gap-5 relative z-10">
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <div className="size-20 sm:size-24 rounded-full bg-gradient-to-br from-primary via-accent-foreground to-gold p-0.5">
              <div className="size-full rounded-full bg-card flex items-center justify-center">
                <User className="size-10 sm:size-12 text-primary" />
              </div>
            </div>
            {profile?.is_premium && (
              <div className="absolute -top-1 -right-1 size-7 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center border-2 border-card">
                <Sparkles className="size-4 text-white" />
              </div>
            )}
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-foreground truncate">
              {profile?.display_name || "Miner"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Level {profile?.level || 1} Miner
            </p>
            <div className="flex items-center gap-2 mt-3">
              {profile?.is_premium && (
                <span className="text-xs font-bold text-gold bg-gradient-to-r from-gold/10 to-gold/20 px-3 py-1 rounded-full border border-gold/30">
                  ⭐ PRO
                </span>
              )}
              <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                Code: {profile?.referral_code}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border/50 relative z-10">
          {[
            { icon: Zap, value: Number(profile?.total_mined || 0).toLocaleString(), label: "Total Mined", color: "text-primary" },
            { icon: Award, value: `${profile?.mining_power || 50}%`, label: "Power", color: "text-gold" },
            { icon: User, value: profile?.level || 1, label: "Level", color: "text-accent-foreground" },
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              className="text-center"
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <div className={`flex items-center justify-center gap-1 ${stat.color} mb-2`}>
                <stat.icon className="size-5" />
              </div>
              <p className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Settings List */}
      <motion.div 
        className="glass-card rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        {settingsItems.map((item, index) => (
          <motion.button 
            key={index}
            className={`w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-all duration-300 ${
              index !== settingsItems.length - 1 ? 'border-b border-border/50' : ''
            }`}
            onClick={item.onClick}
            whileHover={{ x: 4 }}
          >
            <div className="flex items-center gap-4">
              <div className="size-11 rounded-xl bg-gradient-to-br from-muted to-accent/30 flex items-center justify-center">
                <item.icon className="size-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </motion.button>
        ))}
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Button
          variant="destructive"
          className="w-full h-13 rounded-2xl text-base font-semibold"
          onClick={handleLogout}
        >
          <LogOut className="size-5 mr-2" />
          Logout
        </Button>
      </motion.div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pt-4">
        PingCaset Mining Hub v1.0
      </p>
    </div>
  );
}
