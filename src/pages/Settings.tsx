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
import { useNotifications } from "@/contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { firebaseAuth } from "@/lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { NotificationBell } from "@/components/notifications/NotificationBell";

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
  
  // Notification preferences - linked to context
  const { requestPushPermission, pushPermissionStatus } = useNotifications();
  const [miningNotifs, setMiningNotifs] = useState(true);
  const [referralNotifs, setReferralNotifs] = useState(true);
  const [gameNotifs, setGameNotifs] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(pushPermissionStatus === 'granted');

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
      <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider px-1">{title}</p>
      <div className="card-glass-strong divide-y divider-glass">
        {items.map((item, i) => (
          <button 
            key={i}
            className={`w-full flex items-center justify-between p-4 list-item-glass ${item.disabled ? 'opacity-50' : ''}`}
            onClick={item.onClick}
          >
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-xl flex items-center justify-center ${
                item.highlight 
                  ? 'bg-primary/25 border border-primary/30' 
                  : 'bg-white/[0.08] border border-white/[0.06]'
              }`}>
                <item.icon className={`size-5 ${item.highlight ? 'text-primary' : 'text-foreground/80'}`} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-semibold ${item.highlight ? 'text-primary' : 'text-foreground'}`}>{item.title}</p>
                <p className="text-xs text-foreground/60">{item.subtitle}</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-foreground/40" />
          </button>
        ))}
      </div>
    </motion.div>
  );

  const renderModal = () => (
    <AnimatePresence>
      {activeModal && (
        <motion.div
          key="modal-backdrop"
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 pb-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActiveModal(null)}
        >
          <motion.div
            key="modal-content"
            className="w-full max-w-md modal-glass p-6 space-y-4 max-h-[80vh] overflow-y-auto overscroll-contain"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
              <button onClick={() => setActiveModal(null)} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
                <X className="size-5 text-foreground/70" />
              </button>
            </div>

            {activeModal === "profile" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground/70 mb-2 block">Display Name</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter display name"
                    className="input-elevated h-12 text-foreground placeholder:text-foreground/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/70 mb-2 block">Email</label>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl input-elevated">
                    <Mail className="size-5 text-foreground/60" />
                    <span className="text-sm font-medium text-foreground">{user?.email || "Not set"}</span>
                  </div>
                </div>
                <Button 
                  className="w-full h-12 text-base font-semibold"
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
              <div className="space-y-3">
                {/* Push notification toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Push Notifications</p>
                    <p className="text-xs text-foreground/60">
                      {pushPermissionStatus === 'granted' 
                        ? 'Enabled - receive alerts when app is closed'
                        : pushPermissionStatus === 'denied'
                        ? 'Blocked - enable in browser settings'
                        : 'Get alerts even when app is closed'}
                    </p>
                  </div>
                  <Switch 
                    checked={pushEnabled} 
                    onCheckedChange={async (checked) => {
                      if (checked && pushPermissionStatus !== 'granted') {
                        const granted = await requestPushPermission();
                        setPushEnabled(granted);
                      } else {
                        setPushEnabled(checked);
                      }
                    }}
                    disabled={pushPermissionStatus === 'denied'}
                  />
                </div>
                
                {/* Notification type toggles */}
                {[
                  { label: "Mining Alerts", desc: "Session complete & claim reminders", value: miningNotifs, onChange: setMiningNotifs },
                  { label: "Referral Updates", desc: "New team member bonuses", value: referralNotifs, onChange: setReferralNotifs },
                  { label: "Game Rewards", desc: "Spin & scratch win alerts", value: gameNotifs, onChange: setGameNotifs },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl card-glass-subtle">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-foreground/60">{item.desc}</p>
                    </div>
                    <Switch checked={item.value} onCheckedChange={item.onChange} />
                  </div>
                ))}
              </div>
            )}

            {activeModal === "security" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/15 border border-primary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="size-5 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Account Protected</span>
                  </div>
                  <p className="text-xs text-foreground/70">
                    Your account is secured with email & password authentication.
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-medium text-foreground/70">Security Features:</p>
                  {[
                    "Email verification",
                    "Password encryption",
                    "Device tracking",
                    "Session management"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm font-medium text-foreground p-2.5 rounded-lg bg-white/[0.04]">
                      <Check className="size-4 text-primary" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeModal === "passcode" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground/70 mb-2 block">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="input-elevated h-12 text-foreground placeholder:text-foreground/40 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="size-5 text-foreground/60" />
                      ) : (
                        <Eye className="size-5 text-foreground/60" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/70 mb-2 block">New Password</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="input-elevated h-12 text-foreground placeholder:text-foreground/40 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeOff className="size-5 text-foreground/60" />
                      ) : (
                        <Eye className="size-5 text-foreground/60" />
                      )}
                    </button>
                  </div>
                </div>
                <Button 
                  className="w-full h-12 text-base font-semibold"
                  onClick={handleChangePassword}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : "Update Password"}
                </Button>
              </div>
            )}

            {activeModal === "id" && (
              <div className="space-y-4">
                <div className="p-6 rounded-xl bg-primary/15 border border-primary/30 text-center">
                  <p className="text-xs font-medium text-foreground/60 mb-3">Your Unique PingCaset ID</p>
                  <p className="text-3xl font-mono font-bold text-primary tracking-wider">
                    {profile?.referral_code || "Loading..."}
                  </p>
                </div>
                <Button 
                  className="w-full h-12 text-base font-semibold"
                  onClick={copyPingCasetId}
                  variant="outline"
                >
                  {idCopied ? (
                    <>
                      <Check className="size-5 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-5 mr-2" />
                      Copy ID
                    </>
                  )}
                </Button>
                <p className="text-xs text-foreground/50 text-center">
                  Share this ID with friends to earn referral bonuses!
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Header with Notification Bell */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account</p>
          </div>
          <NotificationBell />
        </motion.div>

        {/* Profile Card */}
        <motion.div
          className="card-glass-strong p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-4">
            <div className="size-18 w-18 h-18 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-3xl font-bold text-white">
                {(profile?.display_name || "M")[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-display font-bold text-foreground truncate">
                {profile?.display_name || "Miner"}
              </h3>
              <p className="text-sm font-medium text-foreground/70">
                {profile?.is_premium ? "⭐ PRO Member" : "Free Member"}
              </p>
              <button 
                onClick={() => setActiveModal("id")}
                className="text-xs text-primary font-semibold mt-1.5 hover:text-primary/80 transition-colors"
              >
                ID: {profile?.referral_code}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-white/[0.1]">
            {[
              { icon: Zap, value: Number(profile?.total_mined || 0).toLocaleString(), label: "Total Mined", color: "text-primary" },
              { icon: Award, value: `${Number(profile?.mining_rate || 10)}`, label: "Rate/Session", color: "text-gold" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-white/[0.04]">
                <stat.icon className={`size-5 mx-auto mb-1.5 ${stat.color}`} />
                <p className="text-xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-foreground/60">{stat.label}</p>
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

        {/* Microsoft for Startups Badge */}
        <motion.div
          className="flex justify-center pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <span className="text-[10px] text-muted-foreground">Supported by</span>
            <svg 
              viewBox="0 0 23 23" 
              className="size-3"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fill="#f25022" d="M1 1h10v10H1z"/>
              <path fill="#00a4ef" d="M1 12h10v10H1z"/>
              <path fill="#7fba00" d="M12 1h10v10H12z"/>
              <path fill="#ffb900" d="M12 12h10v10H12z"/>
            </svg>
            <span className="text-[10px] font-medium text-foreground/80">Microsoft for Startups</span>
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground">
          PingCaset Mining Hub v1.0
        </p>
      </div>

      {renderModal()}
    </>
  );
}
