import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { 
  Mail, Lock, User, Gift, ArrowRight, Loader2, 
  AlertTriangle, Key, Copy, Check, ChevronLeft, Zap, Sparkles, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { firebaseSignUp, firebaseSignIn, createProfile, signInWithGoogle, getProfile, db } from "@/lib/firebase";
import { toast } from "sonner";
import { collection, query, where, getDocs } from "firebase/firestore";
import pingcasetLogo from "@/assets/pingcaset-logo.png";

type AuthScreen = "welcome" | "landing" | "login" | "register" | "recover" | "unique-id-setup";

// Animated counter component
const AnimatedCounter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <span className="tabular-nums">
      {displayValue.toLocaleString()}
    </span>
  );
};

// 3D Floating Element Component
const FloatingElement = ({ 
  children, 
  delay = 0, 
  duration = 4,
  x = 0,
  y = 0,
  size = "md"
}: { 
  children: React.ReactNode; 
  delay?: number; 
  duration?: number;
  x?: number;
  y?: number;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "size-12",
    md: "size-16",
    lg: "size-20"
  };

  return (
    <motion.div
      className={`absolute ${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm border border-primary/20 flex items-center justify-center shadow-xl shadow-primary/10`}
      style={{ 
        left: `calc(50% + ${x}px)`, 
        top: `calc(40% + ${y}px)`,
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
      initial={{ opacity: 0, scale: 0, rotateX: -30, rotateY: 30 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        rotateX: [-5, 5, -5], 
        rotateY: [-10, 10, -10],
        y: [-10, 10, -10]
      }}
      transition={{ 
        opacity: { delay, duration: 0.5 },
        scale: { delay, duration: 0.5, type: "spring" },
        rotateX: { delay: delay + 0.5, duration, repeat: Infinity, ease: "easeInOut" },
        rotateY: { delay: delay + 0.5, duration: duration * 1.2, repeat: Infinity, ease: "easeInOut" },
        y: { delay: delay + 0.5, duration: duration * 0.8, repeat: Infinity, ease: "easeInOut" }
      }}
    >
      {children}
    </motion.div>
  );
};

// Swipeable Button Component
const SwipeButton = ({ onComplete }: { onComplete: () => void }) => {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const thumbWidth = 56;
  const maxDrag = containerWidth - thumbWidth - 8;
  
  const background = useTransform(
    x,
    [0, maxDrag],
    ["hsl(262, 83%, 65%)", "hsl(142, 70%, 45%)"]
  );
  
  const arrowOpacity = useTransform(x, [0, maxDrag * 0.5], [1, 0]);
  const checkOpacity = useTransform(x, [maxDrag * 0.5, maxDrag], [0, 1]);

  useEffect(() => {
    if (constraintsRef.current) {
      setContainerWidth(constraintsRef.current.offsetWidth);
    }
  }, []);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > maxDrag * 0.7) {
      animate(x, maxDrag, { type: "spring", stiffness: 400, damping: 40 });
      setTimeout(onComplete, 300);
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 40 });
    }
  };

  return (
    <motion.div
      ref={constraintsRef}
      className="relative w-full h-14 rounded-full bg-muted border border-border overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
          animate={{ x: ["-100%", "400%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
      </div>
      
      {/* Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-muted-foreground font-medium text-sm">Swipe to Get Started</span>
        <motion.div 
          className="ml-2 flex gap-1"
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowRight className="size-4 text-muted-foreground" />
        </motion.div>
      </div>
      
      {/* Draggable thumb */}
      <motion.div
        className="absolute top-1 left-1 size-12 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center shadow-lg"
        style={{ x, background }}
        drag="x"
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div style={{ opacity: arrowOpacity }} className="absolute">
          <ArrowRight className="size-5 text-white" />
        </motion.div>
        <motion.div style={{ opacity: checkOpacity }} className="absolute">
          <Check className="size-5 text-white" />
        </motion.div>
      </motion.div>
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

  // Welcome Screen with Counter
  if (screen === "welcome") {
    return (
      <div className="min-h-screen bg-background flex flex-col dark overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Primary glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/25 rounded-full blur-[120px]" />
          {/* Secondary glow */}
          <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] bg-purple-500/15 rounded-full blur-[100px]" />
          {/* Accent glow */}
          <div className="absolute top-1/2 left-0 w-[200px] h-[200px] bg-accent-foreground/10 rounded-full blur-[80px]" />
        </div>

        {/* 3D Floating Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <FloatingElement x={-100} y={-80} delay={0.3} duration={4} size="lg">
            <Zap className="size-8 text-primary" />
          </FloatingElement>
          <FloatingElement x={90} y={-40} delay={0.5} duration={5} size="md">
            <Sparkles className="size-6 text-accent-foreground" />
          </FloatingElement>
          <FloatingElement x={-70} y={80} delay={0.7} duration={4.5} size="sm">
            <Shield className="size-5 text-primary/80" />
          </FloatingElement>
          <FloatingElement x={110} y={100} delay={0.4} duration={5.5} size="md">
            <div className="text-lg font-bold text-primary">₿</div>
          </FloatingElement>
          <FloatingElement x={-120} y={20} delay={0.6} duration={4} size="sm">
            <div className="size-3 rounded-full bg-primary" />
          </FloatingElement>
          <FloatingElement x={130} y={-100} delay={0.8} duration={5} size="sm">
            <div className="size-3 rounded-full bg-accent-foreground" />
          </FloatingElement>
        </div>

        {/* Decorative rings */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <motion.div 
            className="size-64 rounded-full border border-primary/10"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute inset-4 rounded-full border border-primary/5"
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 relative flex flex-col items-center justify-center px-6 pt-12 z-10">
          <motion.div
            className="relative z-10 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo */}
            <motion.img 
              src={pingcasetLogo} 
              alt="PingCaset" 
              className="mx-auto size-24 rounded-2xl shadow-2xl shadow-primary/40 mb-6"
              initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ type: "spring", delay: 0.1, duration: 0.8 }}
            />

            {/* Big Counter */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-1">
                <AnimatedCounter value={24897} />
              </h1>
              <p className="text-muted-foreground text-sm mb-6">Active Miners</p>
            </motion.div>

            {/* Gradient headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-3"
            >
              <h2 className="text-xl md:text-2xl font-display font-bold leading-tight">
                <span className="text-primary">Join thousands</span>
                <span className="text-foreground"> who are</span>
                <br />
                <span className="text-foreground">already mining </span>
                <span className="text-primary">CASET</span>
              </h2>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-muted-foreground text-sm mb-4"
            >
              Start earning crypto rewards today ⛏️
            </motion.p>
          </motion.div>
        </div>

        {/* Bottom CTA area */}
        <div className="relative z-10 px-6 pb-8 space-y-4">
          {/* Swipeable Button */}
          <SwipeButton onComplete={() => setScreen("landing")} />

          {/* Or tap button */}
          <motion.button
            onClick={() => setScreen("landing")}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            or tap to continue
          </motion.button>

          {/* Microsoft Badge */}
          <motion.div 
            className="flex items-center justify-center gap-2 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <span className="text-xs text-muted-foreground">Supported by</span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border">
              <svg viewBox="0 0 23 23" className="size-3.5" xmlns="http://www.w3.org/2000/svg">
                <path fill="#f25022" d="M1 1h10v10H1z"/>
                <path fill="#00a4ef" d="M1 12h10v10H1z"/>
                <path fill="#7fba00" d="M12 1h10v10H12z"/>
                <path fill="#ffb900" d="M12 12h10v10H12z"/>
              </svg>
              <span className="text-[10px] font-medium text-foreground">Microsoft for Startups</span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Landing Screen (Login/Signup choice)
  if (screen === "landing") {
    return (
      <div className="min-h-screen bg-background flex flex-col dark">
        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Logo */}
            <motion.img 
              src={pingcasetLogo} 
              alt="PingCaset" 
              className="mx-auto size-40 rounded-3xl shadow-2xl shadow-primary/30 mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
            />

            <motion.h1 
              className="text-3xl font-display font-bold text-foreground mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Are you ready!
            </motion.h1>
            <motion.p
              className="text-muted-foreground text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Start mining CASET tokens today
            </motion.p>
          </motion.div>
        </div>

        {/* Bottom buttons */}
        <motion.div 
          className="px-6 pb-6 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Login Button - White/Light */}
          <button
            onClick={() => setScreen("login")}
            className="w-full h-14 rounded-full bg-foreground text-background font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Login
          </button>

          {/* Sign Up Button - Dark with border */}
          <button
            onClick={() => setScreen("register")}
            className="w-full h-14 rounded-full bg-muted border border-border text-foreground font-semibold text-base hover:bg-muted/80 transition-colors"
          >
            Sign Up
          </button>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-6 pt-4">
            <Link to="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy policy
            </Link>
            <Link to="/terms-conditions" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms of service
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Recovery Screen
  if (screen === "recover") {
    return (
      <div className="min-h-screen bg-background flex flex-col p-6 dark">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setScreen("login")} 
            className="size-10 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ChevronLeft className="size-5 text-foreground" />
          </button>
          <img src={pingcasetLogo} alt="PingCaset" className="size-10 rounded-lg" />
          <div className="size-10" /> {/* Spacer */}
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
              <div className="p-4 rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
                    <Mail className="size-5 text-muted-foreground" />
                  </div>
                  <Input
                    type="email"
                    placeholder="Enter your recovery email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="border-0 bg-transparent h-auto p-0 text-base focus-visible:ring-0"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 rounded-full gradient-primary font-semibold text-base">
                {loading ? <Loader2 className="size-5 animate-spin" /> : "Find My ID"}
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Unique ID Setup Screen
  if (screen === "unique-id-setup") {
    return (
      <div className="min-h-screen bg-background flex flex-col p-6 dark">
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
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Your Unique ID</h1>
          <p className="text-muted-foreground text-sm mb-6">Save this ID - it's your login credential</p>

          {/* ID Display */}
          <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-mono font-bold text-primary">{generatedId}</p>
              <button 
                onClick={copyGeneratedId} 
                className="size-10 rounded-xl bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
              >
                {idCopied ? <Check className="size-5 text-primary" /> : <Copy className="size-5 text-primary" />}
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 mb-6">
            <AlertTriangle className="size-5 text-destructive shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="text-destructive font-medium">Save this ID!</span> Lost IDs without recovery email cannot be recovered.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <InputField icon={User} placeholder="Display Name" value={displayName} onChange={setDisplayName} />
            <InputField icon={Mail} placeholder="Recovery Email (optional)" value={linkRecoveryEmail} onChange={setLinkRecoveryEmail} type="email" />
            <InputField icon={Lock} placeholder="Create Password" value={password} onChange={setPassword} type="password" required />
            <InputField icon={Gift} placeholder="Referral Code (optional)" value={referralCode} onChange={(v) => setReferralCode(v.toUpperCase())} />

            <Button type="submit" disabled={loading} className="w-full h-14 rounded-full gradient-primary font-semibold text-base mt-4">
              {loading ? <Loader2 className="size-5 animate-spin" /> : "Create Account"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Login / Register Screen
  return (
    <div className="min-h-screen bg-background flex flex-col p-6 dark">
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
      <motion.div 
        className="flex-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          {screen === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {screen === "login" ? "Sign in with your credentials" : "Sign up to start mining CASET"}
        </p>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full h-14 rounded-full bg-foreground text-background font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-4"
        >
          <svg className="size-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-background text-xs text-muted-foreground">or</span>
          </div>
        </div>

        {/* Login Method Toggle */}
        {screen === "login" && (
          <div className="flex p-1 bg-muted rounded-full mb-4">
            <button
              type="button"
              onClick={() => setLoginMethod("email")}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                loginMethod === "email" ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Mail className="size-4" /> Email
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod("unique-id")}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                loginMethod === "unique-id" ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Key className="size-4" /> Unique ID
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {screen === "register" && (
            <InputField icon={User} placeholder="Display Name" value={displayName} onChange={setDisplayName} required />
          )}

          {screen === "login" ? (
            loginMethod === "unique-id" ? (
              <InputField icon={Key} placeholder="PC-XXXXXXXX" value={uniqueId} onChange={(v) => setUniqueId(v.toUpperCase())} required mono />
            ) : (
              <InputField icon={Mail} placeholder="Email" value={email} onChange={setEmail} type="email" required />
            )
          ) : (
            <InputField icon={Mail} placeholder="Email" value={email} onChange={setEmail} type="email" required />
          )}

          <InputField icon={Lock} placeholder="Password" value={password} onChange={setPassword} type="password" required />

          {screen === "register" && (
            <InputField icon={Gift} placeholder="Referral Code (optional)" value={referralCode} onChange={(v) => setReferralCode(v.toUpperCase())} />
          )}

          <Button type="submit" disabled={loading} className="w-full h-14 rounded-full gradient-primary font-semibold text-base mt-2">
            {loading ? <Loader2 className="size-5 animate-spin" /> : screen === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {/* Unique ID option for register */}
        {screen === "register" && (
          <button
            type="button"
            onClick={handleCreateUniqueId}
            className="w-full mt-4 py-3 text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-2"
          >
            <Key className="size-4" />
            Create with Unique ID (No Email)
          </button>
        )}

        {/* Forgot ID link */}
        {screen === "login" && loginMethod === "unique-id" && (
          <button
            type="button"
            onClick={() => setScreen("recover")}
            className="w-full mt-4 text-center text-sm text-primary hover:underline"
          >
            Forgot your Unique ID?
          </button>
        )}

        {/* Toggle */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {screen === "login" ? (
            <>Don't have an account? <button onClick={() => setScreen("register")} className="text-primary font-medium hover:underline">Sign up</button></>
          ) : (
            <>Have an account? <button onClick={() => setScreen("login")} className="text-primary font-medium hover:underline">Sign in</button></>
          )}
        </p>
      </motion.div>
    </div>
  );
}

// Reusable Input Field Component
function InputField({ 
  icon: Icon, 
  placeholder, 
  value, 
  onChange, 
  type = "text", 
  required = false,
  mono = false
}: { 
  icon: any; 
  placeholder: string; 
  value: string; 
  onChange: (value: string) => void; 
  type?: string; 
  required?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="p-4 rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <Input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`border-0 bg-transparent h-auto p-0 text-base focus-visible:ring-0 ${mono ? 'font-mono' : ''}`}
          required={required}
          minLength={type === "password" ? 6 : undefined}
        />
      </div>
    </div>
  );
}
