import { motion } from "framer-motion";
import { 
  User, Bell, Shield, LogOut, ChevronRight, Zap, Award, Loader2,
  FileText, Lock, HelpCircle, Trash2, KeyRound, Fingerprint, ScanFace
} from "lucide-react";
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

  interface SettingItem {
    icon: typeof User;
    title: string;
    subtitle: string;
    onClick: () => void;
    disabled?: boolean;
    highlight?: boolean;
  }

  const generalSettings: SettingItem[] = [
    { icon: User, title: "Edit Profile", subtitle: "Update display name", onClick: () => {} },
    { icon: Bell, title: "Notifications", subtitle: "Manage alerts", onClick: () => {} },
    { icon: Shield, title: "Security", subtitle: "Password & 2FA", onClick: () => {} },
  ];

  const accountControls: SettingItem[] = [
    { icon: KeyRound, title: "Change Passcode", subtitle: "Update your password", onClick: () => {} },
    { icon: Fingerprint, title: "Face Verification", subtitle: "Manage biometric auth", onClick: () => navigate("/face-auth?mode=settings"), highlight: true },
    { icon: Fingerprint, title: "View PingCaset ID", subtitle: profile?.referral_code || "Loading...", onClick: () => {} },
    { icon: Trash2, title: "Request Account Deletion", subtitle: "Coming soon", onClick: () => {}, disabled: true },
  ];

  const legalSettings: SettingItem[] = [
    { icon: FileText, title: "Terms & Conditions", subtitle: "Mining & referral rules", onClick: () => navigate("/terms") },
    { icon: Lock, title: "Privacy Policy", subtitle: "Data usage & protection", onClick: () => navigate("/privacy") },
    { icon: HelpCircle, title: "Help Center", subtitle: "AI-powered support", onClick: () => navigate("/help"), highlight: true },
  ];

  const renderSettingsList = (items: SettingItem[], title: string) => (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="text-xs font-medium text-muted-foreground px-1">{title}</p>
      <div className="card-dark divide-y divide-border">
        {items.map((item, i) => (
          <button 
            key={i}
            className={`w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={item.disabled ? undefined : item.onClick}
            disabled={item.disabled}
          >
            <div className="flex items-center gap-3">
              <div className={`size-9 rounded-lg flex items-center justify-center ${item.highlight ? 'bg-primary/20' : 'bg-muted'}`}>
                <item.icon className={`size-4 ${item.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium ${item.highlight ? 'text-primary' : 'text-foreground'}`}>{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </motion.div>
  );

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
              ID: {profile?.referral_code}
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

      {/* Settings Sections */}
      <div className="space-y-4">
        {renderSettingsList(generalSettings, "General")}
        {renderSettingsList(accountControls, "Account")}
        {renderSettingsList(legalSettings, "Support & Legal")}
      </div>

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
