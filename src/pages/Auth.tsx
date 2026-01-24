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
import globeHero from "@/assets/globe-hero.png";

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
    <motion.div
      className="inline-flex items-center gap-2 bg-background/60 backdrop-blur-sm border border-border/50 rounded-full px-4 py-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <span className="size-2 rounded-full bg-success animate-pulse" />
      <span className="text-sm font-medium text-foreground tabular-nums">
        {count.toLocaleString()}
      </span>
      <span className="text-sm text-muted-foreground">users mining now</span>
    </motion.div>
  );
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [screen, setScreen] = useState<AuthScreen>("welcome");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [loginMethod, setLoginMethod] = useState<"email" | "unique-id">("email");
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
      <div 
        className="min-h-screen flex flex-col dark"
        style={{ background: 'linear-gradient(180deg, #0B0B0F 0%, #121218 100%)' }}
      >
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* App Icon with glow */}
          <motion.div
            className="relative mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {/* Radial glow behind icon */}
            <div 
              className="absolute inset-[-50%] rounded-full"
              style={{
                background: 'radial-gradient(circle, hsl(262, 83%, 58% / 0.3) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />
            <img 
              src={pingcasetLogo} 
              alt="PingCaset" 
              className="relative size-24 rounded-3xl"
            />
          </motion.div>

          {/* Headline */}
          <motion.h1 
            className="text-2xl md:text-3xl font-display font-bold text-foreground text-center mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Mine CASET. Build Early.
          </motion.h1>

          {/* Subtext */}
          <motion.p
            className="text-muted-foreground/70 text-sm text-center mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            A fair, time-based crypto mining network
          </motion.p>
        </div>

        {/* Buttons Section */}
        <motion.div 
          className="px-6 pb-8 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Helper text */}
          <p className="text-center text-xs text-muted-foreground/60 mb-2">
            Already have an account?
          </p>

          {/* Primary Button - Login */}
          <button
            onClick={() => setScreen("login")}
            className="w-full h-14 rounded-full bg-foreground text-background font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Login
          </button>

          {/* Secondary Button - Sign Up */}
          <button
            onClick={() => setScreen("register")}
            className="w-full h-14 rounded-full bg-transparent border border-border text-foreground font-semibold text-base hover:bg-muted/30 transition-colors"
          >
            Sign Up
          </button>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <Link to="/privacy-policy" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <Link to="/terms-conditions" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ========================
  // SCREEN 2: ONBOARDING / PREVIEW (Welcome)
  // ========================
  if (screen === "welcome") {
    return (
      <div 
        className="min-h-screen flex flex-col dark overflow-hidden relative"
        style={{ background: '#0A0A0F' }}
      >
        {/* Background purple glow */}
        <div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(123, 63, 228, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Headline Section */}
          <div className="px-6 pt-12 pb-4">
            <motion.h1 
              className="text-[28px] md:text-4xl font-display font-bold text-white text-center leading-tight"
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
              className="text-[#8B8B9E] text-base text-center mt-4 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              No hardware. No fees.
              <br />
              Just time-based mining.
            </motion.p>
          </div>

          {/* Globe Image */}
          <motion.div 
            className="flex-1 flex items-center justify-center px-4 -mt-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="relative w-full max-w-[340px]">
              <img 
                src={globeHero} 
                alt="Global Mining Network" 
                className="w-full h-auto object-contain"
              />
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="relative z-10 px-6 pb-8">
          {/* Mining Status Pill */}
          <motion.div
            className="flex justify-center mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <AnimatedCounter />
          </motion.div>

          {/* CTA Button */}
          <motion.button
            onClick={() => setScreen("landing")}
            className="w-full h-[56px] rounded-full font-semibold text-[17px] text-white flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #7B3FE4 0%, #9C6BFF 100%)',
              boxShadow: '0 4px 24px rgba(123, 63, 228, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Start Mining Now
            <ArrowRight className="size-5" />
          </motion.button>

          {/* Helper text */}
          <motion.p
            className="text-center text-sm text-[#6B6B7B] mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Swipe or tap to start
          </motion.p>

          {/* Microsoft Badge */}
          <motion.div 
            className="flex items-center justify-center mt-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A22] border border-[#2A2A35]">
              <svg viewBox="0 0 23 23" className="size-4" xmlns="http://www.w3.org/2000/svg">
                <path fill="#f25022" d="M1 1h10v10H1z"/>
                <path fill="#00a4ef" d="M1 12h10v10H1z"/>
                <path fill="#7fba00" d="M12 1h10v10H12z"/>
                <path fill="#ffb900" d="M12 12h10v10H12z"/>
              </svg>
              <span className="text-sm text-[#8B8B9E]">Microsoft for Startups</span>
            </div>
          </motion.div>
        </div>
      </div>
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
