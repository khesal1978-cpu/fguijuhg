import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Bell, Shield, LogOut, ChevronRight, Zap, Award, Loader2,
  FileText, Lock, HelpCircle, Trash2, KeyRound, Key, X, Copy, Check,
  Mail, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { firebaseAuth } from "@/lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

type ModalType = "profile" | "notifications" | "security" | "passcode" | "id" | null;

export default function Settings() {
  const { profile, user, signOut, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [idCopied, setIdCopied] = useState(false);
  
  // Form states
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Notification states
  const [miningNotifs, setMiningNotifs] = useState(true);
  const [referralNotifs, setReferralNotifs] = useState(true);
  const [gameNotifs, setGameNotifs] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const copyPingCasetId = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setIdCopied(true);
      toast.success("PingCaset ID copied!");
      setTimeout(() => setIdCopied(false), 2000);
    }
  };

  const handleChangePassword = async () => {
    if (!firebaseAuth.currentUser || !currentPassword || !newPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        firebaseAuth.currentUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(firebaseAuth.currentUser, credential);
      
      // Update password
      await updatePassword(firebaseAuth.currentUser, newPassword);
      
      toast.success("Password updated successfully!");
      setActiveModal(null);
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        toast.error("Current password is incorrect");
      } else {
        toast.error("Failed to update password");
      }
    } finally {
      setIsSubmitting(false);
    }
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
    { icon: User, title: "Edit Profile", subtitle: profile?.display_name || "Update display name", onClick: () => setActiveModal("profile") },
    { icon: Bell, title: "Notifications", subtitle: "Manage alerts", onClick: () => setActiveModal("notifications") },
    { icon: Shield, title: "Security", subtitle: "Account protection", onClick: () => setActiveModal("security") },
  ];

  const accountControls: SettingItem[] = [
    { icon: KeyRound, title: "Change Password", subtitle: "Update your password", onClick: () => setActiveModal("passcode") },
    { icon: Key, title: "View PingCaset ID", subtitle: profile?.referral_code || "Loading...", onClick: () => setActiveModal("id"), highlight: true },
    { icon: Trash2, title: "Request Account Deletion", subtitle: "Contact support", onClick: () => toast.info("Contact support@pingcaset.com"), disabled: false },
  ];

  const legalSettings: SettingItem[] = [
    { icon: FileText, title: "Whitepaper", subtitle: "CASET tokenomics & vision", onClick: () => navigate("/whitepaper"), highlight: true },
    { icon: FileText, title: "Terms & Conditions", subtitle: "Mining & referral rules", onClick: () => navigate("/terms") },
    { icon: Lock, title: "Privacy Policy", subtitle: "Data usage & protection", onClick: () => navigate("/privacy") },
    { icon: HelpCircle, title: "Help Center", subtitle: "AI-powered support", onClick: () => navigate("/help") },
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
            className={`w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors ${item.disabled ? 'opacity-50' : ''}`}
            onClick={item.onClick}
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

  const renderModal = () => {
    if (!activeModal) return null;

    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActiveModal(null)}
        >
          <motion.div
            className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-4"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-foreground">
                {activeModal === "profile" && "Edit Profile"}
                {activeModal === "notifications" && "Notifications"}
                {activeModal === "security" && "Security Info"}
                {activeModal === "passcode" && "Change Password"}
                {activeModal === "id" && "Your PingCaset ID"}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-muted rounded-lg">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>

            {activeModal === "profile" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Display Name</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter display name"
                    className="bg-muted/50 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{user?.email || "Not set"}</span>
                  </div>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => {
                    toast.success("Profile update coming soon!");
                    setActiveModal(null);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            )}

            {activeModal === "notifications" && (
              <div className="space-y-4">
                {[
                  { label: "Mining Alerts", desc: "Get notified when mining session ends", value: miningNotifs, onChange: setMiningNotifs },
                  { label: "Referral Updates", desc: "New team member notifications", value: referralNotifs, onChange: setReferralNotifs },
                  { label: "Game Rewards", desc: "Spin & scratch win alerts", value: gameNotifs, onChange: setGameNotifs },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={item.value} onCheckedChange={item.onChange} />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground text-center">
                  Push notifications coming soon!
                </p>
              </div>
            )}

            {activeModal === "security" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="size-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Account Protected</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your account is secured with email & password authentication.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Security Features:</p>
                  {[
                    "Email verification",
                    "Password encryption",
                    "Device tracking",
                    "Session management"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="size-3 text-primary" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeModal === "passcode" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="bg-muted/50 text-foreground pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="size-4 text-muted-foreground" />
                      ) : (
                        <Eye className="size-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">New Password</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="bg-muted/50 text-foreground pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showNewPassword ? (
                        <EyeOff className="size-4 text-muted-foreground" />
                      ) : (
                        <Eye className="size-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
                <Button 
                  className="w-full"
                  onClick={handleChangePassword}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Update Password"}
                </Button>
              </div>
            )}

            {activeModal === "id" && (
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-primary/10 border border-primary/30 text-center">
                  <p className="text-xs text-muted-foreground mb-2">Your Unique PingCaset ID</p>
                  <p className="text-2xl font-mono font-bold text-primary tracking-wider">
                    {profile?.referral_code || "Loading..."}
                  </p>
                </div>
                <Button 
                  className="w-full"
                  onClick={copyPingCasetId}
                  variant="outline"
                >
                  {idCopied ? (
                    <>
                      <Check className="size-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-4 mr-2" />
                      Copy ID
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Share this ID with friends to earn referral bonuses!
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <>
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
              <span className="text-2xl font-bold text-white">
                {(profile?.display_name || "M")[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-display font-bold text-foreground truncate">
                {profile?.display_name || "Miner"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {profile?.is_premium ? "⭐ PRO Member" : "Free Member"}
              </p>
              <button 
                onClick={() => setActiveModal("id")}
                className="text-xs text-primary font-medium mt-1 hover:underline"
              >
                ID: {profile?.referral_code}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-border">
            {[
              { icon: Zap, value: Number(profile?.total_mined || 0).toLocaleString(), label: "Total Mined", color: "text-primary" },
              { icon: Award, value: `${Number(profile?.mining_rate || 10)}`, label: "Rate/Session", color: "text-gold" },
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

      {renderModal()}
    </>
  );
}
