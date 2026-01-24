import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Mail, Lock, User, Gift, ArrowRight, Loader2, 
  AlertTriangle, Key, Copy, Check, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { firebaseSignUp, firebaseSignIn, createProfile, signInWithGoogle, getProfile, db } from "@/lib/firebase";
import { toast } from "sonner";
import { collection, query, where, getDocs } from "firebase/firestore";
import pingcasetLogo from "@/assets/pingcaset-logo.png";
import globeBackground from "@/assets/globe-background.png";

type AuthScreen = "welcome" | "landing" | "login" | "register" | "recover" | "unique-id-setup";

// Animated counter for user count
const AnimatedCounter = () => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const target = 24897;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <>
      <span className="text-white font-semibold">{count.toLocaleString()}</span>
      <span className="text-[#8E8E9A] ml-1">users mining now</span>
    </>
  );
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [screen, setScreen] = useState<AuthScreen>("welcome");
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [loginMethod, setLoginMethod] = useState<"email" | "unique-id">("email");

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.src = globeBackground;
    img.onload = () => setImageLoaded(true);
  }, []);
  const [uniqueId, setUniqueId] = useState("");
  const [generatedId, setGeneratedId] = useState("");
  const [idCopied, setIdCopied] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [foundUniqueId, setFoundUniqueId] = useState<string | null>(null);
  const [linkRecoveryEmail, setLinkRecoveryEmail] = useState("");

  const generateUniqueId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'PC-';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  const handleCreateUniqueId = () => {
    const newId = generateUniqueId();
    setGeneratedId(newId);
    setScreen("unique-id-setup");
  };

  const copyGeneratedId = () => {
    navigator.clipboard.writeText(generatedId);
    setIdCopied(true);
    toast.success("ID copied to clipboard!");
    setTimeout(() => setIdCopied(false), 2000);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      const existingProfile = await getProfile(user.uid);
      
      if (!existingProfile) {
        await createProfile(
          user.uid,
          user.displayName || 'Miner',
          referralCode,
          { recoveryEmail: user.email || undefined }
        );
        toast.success("Account created!");
      } else {
        toast.success("Welcome back!");
      }
      navigate("/");
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        toast.error("Sign-in cancelled");
      } else {
        toast.error(err?.message || "Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverUniqueId = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFoundUniqueId(null);

    try {
      const q = query(
        collection(db, 'profiles'),
        where('recovery_email', '==', recoveryEmail.toLowerCase())
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const profile = snap.docs[0].data();
        if (profile.unique_id) {
          setFoundUniqueId(profile.unique_id);
          toast.success("Found your Unique ID!");
        } else {
          toast.error("No Unique ID linked to this email");
        }
      } else {
        toast.error("No account found with this email");
      }
    } catch (err: any) {
      toast.error("Failed to search");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (screen === "login") {
        const loginEmail = loginMethod === "unique-id" 
          ? `${uniqueId.toLowerCase()}@pingcaset.id` 
          : email;
        await firebaseSignIn(loginEmail, password);
        toast.success("Welcome back!");
        navigate("/");
      } else if (screen === "register") {
        const userCredential = await firebaseSignUp(email, password);
        await createProfile(
          userCredential.user.uid,
          displayName || 'Miner',
          referralCode,
          { recoveryEmail: email }
        );
        toast.success("Account created!");
        navigate("/");
      } else if (screen === "unique-id-setup") {
        const signupEmail = `${generatedId.toLowerCase()}@pingcaset.id`;
        const userCredential = await firebaseSignUp(signupEmail, password);
        await createProfile(
          userCredential.user.uid,
          displayName || generatedId,
          referralCode,
          { 
            uniqueId: generatedId,
            recoveryEmail: linkRecoveryEmail || undefined
          }
        );
        toast.success("Account created!");
        navigate("/");
      }
    } catch (err: any) {
      const errorMessage = err?.message || "An error occurred";
      if (errorMessage.includes("email-already-in-use")) {
        toast.error("This account already exists");
      } else if (errorMessage.includes("invalid-credential") || errorMessage.includes("wrong-password")) {
        toast.error("Invalid credentials");
      } else if (errorMessage.includes("user-not-found")) {
        toast.error("Account not found");
      } else if (errorMessage.includes("weak-password")) {
        toast.error("Password must be 6+ characters");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetToLanding = () => {
    setScreen("landing");
    setGeneratedId("");
    setLoginMethod("email");
    setFoundUniqueId(null);
    setRecoveryEmail("");
    setLinkRecoveryEmail("");
  };

  // ========================
  // SCREEN 1: AUTH (LOGIN / SIGNUP)
  // ========================
  if (screen === "landing") {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col dark overflow-hidden relative">
        {/* Background - pure dark */}
        <div className="absolute inset-0 bg-[#050507]" />
        
        {/* Subtle ambient glow at top */}
        <div 
          className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(123, 63, 228, 0.12) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-10">
          {/* App Icon with 3D effect and glow */}
          <motion.div
            className="relative mb-12"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, delay: 0.1 }}
          >
            {/* Soft glow behind icon */}
            <div 
              className="absolute -inset-12 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(123, 63, 228, 0.4) 0%, rgba(123, 63, 228, 0.15) 35%, transparent 65%)',
                filter: 'blur(25px)',
              }}
            />
            {/* Bottom reflection */}
            <div 
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-28 h-6 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse, rgba(123, 63, 228, 0.5) 0%, transparent 70%)',
                filter: 'blur(12px)',
              }}
            />
            <img 
              src={pingcasetLogo} 
              alt="PingCaset" 
              className="relative size-[140px] sm:size-[150px] rounded-[32px]"
              style={{
                boxShadow: '0 25px 50px rgba(123, 63, 228, 0.35), 0 15px 35px rgba(0, 0, 0, 0.4)'
              }}
            />
          </motion.div>

          {/* Headline */}
          <motion.h1 
            className="text-[30px] sm:text-[34px] font-display font-bold text-white text-center leading-[1.2] mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Mine CASET.
            <br />
            Build Early.
          </motion.h1>

          {/* Subtext */}
          <motion.p
            className="text-[#7A7A8A] text-[16px] text-center leading-[1.6]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            A fair, time-based
            <br />
            crypto mining network
          </motion.p>
        </div>

        {/* Buttons Section */}
        <motion.div 
          className="relative z-10 px-6 pb-8 sm:pb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Helper text */}
          <p className="text-center text-[15px] text-[#5A5A6A] mb-5">
            Already have an account?
          </p>

          {/* Primary Button - Login (off-white/light gray) */}
          <motion.button
            onClick={() => setScreen("login")}
            className="group relative w-full h-[58px] rounded-full font-semibold text-[17px] mb-3 overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #E8E8EC 0%, #D8D8DC 100%)',
              color: '#0A0A0F',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Shine effect */}
            <span 
              className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                animation: 'shine 3s ease-in-out infinite',
              }}
            />
            <span className="relative z-10">Login</span>
          </motion.button>

          {/* Secondary Button - Sign Up */}
          <motion.button
            onClick={() => setScreen("register")}
            className="w-full h-[58px] rounded-full font-semibold text-[17px] text-white"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(25, 25, 30, 0.6)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign Up
          </motion.button>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-8 pt-10">
            <Link to="/privacy-policy" className="text-[14px] text-[#5A5A6A] hover:text-[#8A8A9A] transition-colors">
              Privacy policy
            </Link>
            <Link to="/terms-conditions" className="text-[14px] text-[#5A5A6A] hover:text-[#8A8A9A] transition-colors">
              Terms of service
            </Link>
          </div>
        </motion.div>

        {/* CSS for shine animation */}
        <style>{`
          @keyframes shine {
            0% { transform: translateX(-100%); }
            20% { transform: translateX(100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  // ========================
  // SCREEN 2: ONBOARDING / PREVIEW (Welcome)
  // ========================
  if (screen === "welcome") {
    return (
      <motion.div 
        className="min-h-screen min-h-[100dvh] flex flex-col dark overflow-hidden relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Globe Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-[center_60%] bg-no-repeat transition-opacity duration-500"
          style={{ 
            backgroundImage: `url(${globeBackground})`,
            opacity: imageLoaded ? 1 : 0
          }}
        />
        
        {/* Dark overlay - darker at top and bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A12]/90 via-transparent to-[#0A0A12]/95" />

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col px-6">
          {/* Headline Section */}
          <div className="pt-14 sm:pt-20">
            <motion.h1 
              className="text-[32px] sm:text-[38px] md:text-[44px] font-display font-bold text-white text-center leading-[1.1]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Be early.
              <br />
              Mine CASET
              <br />
              before listing.
            </motion.h1>

            <motion.p
              className="text-[#A0A0B0] text-[16px] sm:text-[17px] text-center mt-5 leading-[1.5]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              No hardware. No fees.
              <br />
              Just time-based mining.
            </motion.p>
          </div>

          {/* Spacer */}
          <div className="flex-1" />
        </div>

        {/* Bottom Section */}
        <div className="relative z-10 px-6 pb-10 sm:pb-12">
          {/* Mining Status Pill */}
          <motion.div
            className="flex justify-center mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div 
              className="inline-flex items-center gap-2.5 rounded-full px-6 py-3"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.9) 0%, rgba(20, 20, 28, 0.95) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}
            >
              <span className="size-2.5 rounded-full bg-[#22C55E] animate-pulse" />
              <AnimatedCounter />
            </div>
          </motion.div>

          {/* CTA Button with Shine Effect */}
          <motion.button
            onClick={() => setScreen("landing")}
            className="group relative w-full h-[58px] rounded-full font-semibold text-[18px] text-white flex items-center justify-center gap-2.5 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #7B3FE4 0%, #9C6BFF 50%, #7B3FE4 100%)',
              boxShadow: '0 0 30px rgba(123, 63, 228, 0.5), 0 0 60px rgba(123, 63, 228, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
              border: '1px solid rgba(156, 107, 255, 0.3)'
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Shine animation overlay */}
            <span 
              className="absolute inset-0 overflow-hidden rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                animation: 'shine 3s ease-in-out infinite',
              }}
            />
            <span className="relative z-10 flex items-center gap-2.5">
              Start Mining Now
              <ArrowRight className="size-5" strokeWidth={2.5} />
            </span>
          </motion.button>

          {/* Helper text */}
          <motion.p
            className="text-center text-[14px] text-[#6B6B7B] mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Swipe or tap to start
          </motion.p>

          {/* Microsoft Badge */}
          <motion.div 
            className="flex items-center justify-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div 
              className="flex items-center gap-3 px-5 py-2.5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(25, 25, 32, 0.9) 0%, rgba(18, 18, 24, 0.95) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <svg viewBox="0 0 23 23" className="size-4" xmlns="http://www.w3.org/2000/svg">
                <path fill="#f25022" d="M1 1h10v10H1z"/>
                <path fill="#00a4ef" d="M1 12h10v10H1z"/>
                <path fill="#7fba00" d="M12 1h10v10H12z"/>
                <path fill="#ffb900" d="M12 12h10v10H12z"/>
              </svg>
              <span className="text-[14px] text-[#A0A0B0]">Microsoft for Startups</span>
            </div>
          </motion.div>
        </div>

        {/* CSS for shine animation */}
        <style>{`
          @keyframes shine {
            0% { transform: translateX(-100%); }
            20% { transform: translateX(100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </motion.div>
    );
  }

  // Recovery Screen
  if (screen === "recover") {
    return (
      <div 
        className="min-h-screen flex flex-col p-6 dark"
        style={{ background: 'linear-gradient(180deg, #0B0B0F 0%, #121218 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setScreen("login")} 
            className="size-10 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ChevronLeft className="size-5 text-foreground" />
          </button>
          <img src={pingcasetLogo} alt="PingCaset" className="size-10 rounded-lg" />
          <div className="size-10" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Find Your ID</h1>
          <p className="text-muted-foreground text-sm mb-8">Enter your linked recovery email</p>

          {foundUniqueId ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30 text-center">
                <p className="text-xs text-muted-foreground mb-2">Your Unique ID</p>
                <p className="text-2xl font-mono font-bold text-primary">{foundUniqueId}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(foundUniqueId);
                    toast.success("Copied!");
                  }}
                  className="h-12 rounded-xl"
                >
                  <Copy className="size-4 mr-2" /> Copy
                </Button>
                <Button
                  onClick={() => {
                    setScreen("login");
                    setLoginMethod("unique-id");
                    setUniqueId(foundUniqueId);
                    setFoundUniqueId(null);
                  }}
                  className="h-12 rounded-xl gradient-primary"
                >
                  Login <ArrowRight className="size-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleRecoverUniqueId} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Recovery email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                  className="h-14 pl-12 rounded-xl bg-muted border-border text-foreground"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full h-14 rounded-xl gradient-primary"
                disabled={loading}
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : "Search"}
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Login Screen
  if (screen === "login") {
    return (
      <div 
        className="min-h-screen flex flex-col p-6 dark"
        style={{ background: 'linear-gradient(180deg, #0B0B0F 0%, #121218 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={resetToLanding} 
            className="size-10 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ChevronLeft className="size-5 text-foreground" />
          </button>
          <img src={pingcasetLogo} alt="PingCaset" className="size-10 rounded-lg" />
          <div className="size-10" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-8">Login to continue mining</p>

          {/* Method Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setLoginMethod("email")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                loginMethod === "email" 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod("unique-id")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                loginMethod === "unique-id" 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground"
              }`}
            >
              Unique ID
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginMethod === "email" ? (
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 pl-12 rounded-xl bg-muted border-border text-foreground"
                />
              </div>
            ) : (
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="PC-XXXXXXXX"
                  value={uniqueId}
                  onChange={(e) => setUniqueId(e.target.value.toUpperCase())}
                  required
                  className="h-14 pl-12 rounded-xl bg-muted border-border text-foreground font-mono"
                />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-14 pl-12 rounded-xl bg-muted border-border text-foreground"
              />
            </div>

            {loginMethod === "unique-id" && (
              <button
                type="button"
                onClick={() => setScreen("recover")}
                className="text-sm text-primary hover:underline"
              >
                Forgot your Unique ID?
              </button>
            )}

            <Button
              type="submit"
              className="w-full h-14 rounded-xl font-semibold"
              style={{
                background: 'linear-gradient(135deg, #7B3FE4 0%, #9C6BFF 100%)',
              }}
              disabled={loading}
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : "Login"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full h-14 rounded-xl border-border"
            disabled={loading}
          >
            <svg className="size-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
        </div>

        {/* Bottom link */}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button onClick={() => setScreen("register")} className="text-primary font-medium">
              Sign up
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Register Screen
  if (screen === "register") {
    return (
      <div 
        className="min-h-screen flex flex-col p-6 dark"
        style={{ background: 'linear-gradient(180deg, #0B0B0F 0%, #121218 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={resetToLanding} 
            className="size-10 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ChevronLeft className="size-5 text-foreground" />
          </button>
          <img src={pingcasetLogo} alt="PingCaset" className="size-10 rounded-lg" />
          <div className="size-10" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Create account</h1>
          <p className="text-muted-foreground text-sm mb-8">Start mining CASET tokens today</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-14 pl-12 rounded-xl bg-muted border-border text-foreground"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 pl-12 rounded-xl bg-muted border-border text-foreground"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password (6+ characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-14 pl-12 rounded-xl bg-muted border-border text-foreground"
              />
            </div>

            <div className="relative">
              <Gift className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Referral code (optional)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="h-14 pl-12 rounded-xl bg-muted border-border text-foreground"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-xl font-semibold"
              style={{
                background: 'linear-gradient(135deg, #7B3FE4 0%, #9C6BFF 100%)',
              }}
              disabled={loading}
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : "Create Account"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Alternative options */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full h-14 rounded-xl border-border"
              disabled={loading}
            >
              <svg className="size-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCreateUniqueId}
              className="w-full h-14 rounded-xl border-border"
            >
              <Key className="size-5 mr-2" />
              Create Unique ID instead
            </Button>
          </div>
        </div>

        {/* Bottom link */}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button onClick={() => setScreen("login")} className="text-primary font-medium">
              Login
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Unique ID Setup Screen
  if (screen === "unique-id-setup") {
    return (
      <div 
        className="min-h-screen flex flex-col p-6 dark"
        style={{ background: 'linear-gradient(180deg, #0B0B0F 0%, #121218 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setScreen("register")} 
            className="size-10 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ChevronLeft className="size-5 text-foreground" />
          </button>
          <img src={pingcasetLogo} alt="PingCaset" className="size-10 rounded-lg" />
          <div className="size-10" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Your Unique ID</h1>
          <p className="text-muted-foreground text-sm mb-6">Save this ID - it's your login credential</p>

          {/* ID Display */}
          <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-mono font-bold text-primary">{generatedId}</p>
              <button
                type="button"
                onClick={copyGeneratedId}
                className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
              >
                {idCopied ? <Check className="size-5 text-success" /> : <Copy className="size-5 text-primary" />}
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gold/10 border border-gold/30 mb-6">
            <AlertTriangle className="size-5 text-gold flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Write this down! Without it, you cannot recover your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-14 pl-12 rounded-xl bg-muted border-border text-foreground"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-14 pl-12 rounded-xl bg-muted border-border text-foreground"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Recovery email (optional)"
                value={linkRecoveryEmail}
                onChange={(e) => setLinkRecoveryEmail(e.target.value)}
                className="h-14 pl-12 rounded-xl bg-muted border-border text-foreground"
              />
            </div>

            <div className="relative">
              <Gift className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Referral code (optional)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="h-14 pl-12 rounded-xl bg-muted border-border text-foreground"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-xl font-semibold"
              style={{
                background: 'linear-gradient(135deg, #7B3FE4 0%, #9C6BFF 100%)',
              }}
              disabled={loading}
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : "Complete Setup"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
