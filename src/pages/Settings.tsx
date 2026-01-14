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

  return (
    <div className="px-4 py-6 md:px-8 lg:px-12 lg:py-10 max-w-[800px] mx-auto w-full">
      {/* Header */}
      <header className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          Settings
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account
        </p>
      </header>

      {/* Profile Card */}
      <motion.div
        className="bg-card rounded-2xl border border-border p-4 sm:p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className="size-16 sm:size-20 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center">
            <User className="size-8 sm:size-10 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-display font-bold text-foreground truncate">
              {profile?.display_name || "Miner"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Level {profile?.level || 1} Miner
            </p>
            <div className="flex items-center gap-2 mt-2">
              {profile?.is_premium && (
                <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-1 rounded-full">
                  PRO
                </span>
              )}
              <span className="text-xs font-medium text-muted-foreground">
                Code: {profile?.referral_code}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Zap className="size-4" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground">
              {Number(profile?.total_mined || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Mined</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gold mb-1">
              <Award className="size-4" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground">
              {profile?.mining_power || 50}%
            </p>
            <p className="text-xs text-muted-foreground">Power</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
              <User className="size-4" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground">
              {profile?.level || 1}
            </p>
            <p className="text-xs text-muted-foreground">Level</p>
          </div>
        </div>
      </motion.div>

      {/* Settings List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
        <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-secondary flex items-center justify-center">
              <User className="size-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Edit Profile</p>
              <p className="text-xs text-muted-foreground">Update your display name</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>

        <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-secondary flex items-center justify-center">
              <Bell className="size-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <p className="text-xs text-muted-foreground">Manage alerts</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>

        <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-secondary flex items-center justify-center">
              <Shield className="size-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Security</p>
              <p className="text-xs text-muted-foreground">Password & 2FA</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>
      </div>

      {/* Logout */}
      <Button
        variant="destructive"
        className="w-full h-12 rounded-xl"
        onClick={handleLogout}
      >
        <LogOut className="size-5 mr-2" />
        Logout
      </Button>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-8">
        PingCaset Mining Hub v1.0
      </p>
    </div>
  );
}
