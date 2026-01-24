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

// Active miner dot positions on world map (realistic positions)
const minerPositions = [
  // North America
  { x: 15, y: 28, delay: 0, size: 1.2 }, { x: 20, y: 32, delay: 0.5, size: 1 }, { x: 12, y: 35, delay: 1.2, size: 0.8 },
  { x: 22, y: 38, delay: 2.1, size: 1.1 }, { x: 18, y: 42, delay: 0.8, size: 0.9 },
  // South America  
  { x: 28, y: 62, delay: 1.5, size: 1 }, { x: 30, y: 70, delay: 0.3, size: 0.8 }, { x: 26, y: 55, delay: 2.4, size: 1.1 },
  // Europe
  { x: 48, y: 28, delay: 0.2, size: 1.2 }, { x: 52, y: 32, delay: 1.8, size: 1 }, { x: 46, y: 35, delay: 0.9, size: 0.9 },
  { x: 50, y: 25, delay: 1.4, size: 0.8 }, { x: 54, y: 30, delay: 2.6, size: 1.1 },
  // Africa
  { x: 50, y: 52, delay: 0.7, size: 1 }, { x: 54, y: 48, delay: 1.1, size: 0.9 }, { x: 48, y: 58, delay: 2.0, size: 1.2 },
  // Asia
  { x: 65, y: 30, delay: 0.1, size: 1.1 }, { x: 72, y: 35, delay: 0.6, size: 1.3 }, { x: 80, y: 38, delay: 1.3, size: 1 },
  { x: 70, y: 42, delay: 1.9, size: 0.9 }, { x: 76, y: 28, delay: 0.4, size: 1.2 }, { x: 85, y: 45, delay: 2.2, size: 0.8 },
  { x: 68, y: 48, delay: 2.8, size: 1 },
  // Australia
  { x: 84, y: 65, delay: 0.8, size: 1.1 }, { x: 80, y: 70, delay: 1.6, size: 0.9 },
];

// Animated Miner Dot with smooth pulse
const MinerDot = ({ x, y, delay, size = 1 }: { x: number; y: number; delay: number; size?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000 + 800);
    return () => clearTimeout(timer);
  }, [delay]);
  
  if (!isVisible) return null;
  
  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {/* Outer pulse ring */}
      <motion.div
        className="absolute rounded-full bg-primary/30"
        style={{ 
          width: 16 * size, 
          height: 16 * size,
          left: -8 * size,
          top: -8 * size
        }}
        animate={{ 
          scale: [1, 2.5, 1],
          opacity: [0.4, 0, 0.4]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeOut",
          delay: delay * 0.5
        }}
      />
      {/* Inner glow */}
      <motion.div
        className="absolute rounded-full bg-primary/50"
        style={{ 
          width: 8 * size, 
          height: 8 * size,
          left: -4 * size,
          top: -4 * size
        }}
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.6, 0.3, 0.6]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay * 0.3
        }}
      />
      {/* Core dot */}
      <motion.div 
        className="rounded-full bg-primary"
        style={{ width: 4 * size, height: 4 * size, marginLeft: -2 * size, marginTop: -2 * size }}
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </motion.div>
  );
};

// Realistic World Map with Active Miners
const ActiveMinersMap = () => {
  const [activeCount, setActiveCount] = useState(0);
  
  useEffect(() => {
    const target = 24897;
    const duration = 2500;
    const steps = 80;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setActiveCount(target);
        clearInterval(timer);
      } else {
        setActiveCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <motion.div 
      className="relative w-full max-w-md mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Map container with subtle border */}
      <div className="relative aspect-[2/1] rounded-2xl overflow-hidden bg-card/30 border border-border/50 p-4">
        {/* World map SVG - Realistic simplified outline */}
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          
          {/* North America */}
          <motion.path
            d="M50,120 L80,90 L120,80 L160,85 L200,75 L240,90 L270,120 L280,160 L260,200 L240,220 L200,240 L180,260 L160,250 L140,230 L120,240 L100,220 L80,200 L60,180 L50,150 Z"
            fill="url(#landGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
          />
          
          {/* South America */}
          <motion.path
            d="M200,280 L230,270 L260,290 L280,330 L300,380 L290,420 L260,450 L230,460 L200,440 L190,400 L200,360 L190,320 Z"
            fill="url(#landGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.4 }}
          />
          
          {/* Europe */}
          <motion.path
            d="M440,100 L480,90 L520,100 L550,120 L560,150 L540,180 L500,190 L460,180 L440,160 L430,130 Z"
            fill="url(#landGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
          />
          
          {/* Africa */}
          <motion.path
            d="M440,200 L500,190 L560,210 L580,260 L570,320 L540,380 L500,400 L460,390 L440,350 L430,300 L440,250 Z"
            fill="url(#landGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />
          
          {/* Asia */}
          <motion.path
            d="M560,80 L620,70 L700,80 L780,100 L850,130 L880,180 L870,230 L840,270 L780,290 L720,280 L660,250 L620,220 L580,180 L560,140 Z"
            fill="url(#landGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
          />
          
          {/* India/Southeast Asia */}
          <motion.path
            d="M680,250 L720,240 L760,260 L780,300 L760,340 L720,350 L680,330 L670,290 Z"
            fill="url(#landGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.6 }}
          />
          
          {/* Australia */}
          <motion.path
            d="M800,340 L860,330 L920,350 L940,400 L920,440 L860,450 L810,430 L790,390 Z"
            fill="url(#landGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.7 }}
          />
          
          {/* Japan */}
          <motion.path
            d="M880,140 L910,130 L930,160 L920,200 L890,210 L870,180 Z"
            fill="url(#landGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.4 }}
          />
        </svg>
        
        {/* Miner dots overlay */}
        <div className="absolute inset-4">
          {minerPositions.map((pos, i) => (
            <MinerDot key={i} x={pos.x} y={pos.y} delay={pos.delay} size={pos.size} />
          ))}
        </div>
      </div>
      
      {/* Counter badge */}
      <motion.div
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card border border-border rounded-full px-5 py-2 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, type: "spring", stiffness: 100 }}
      >
        <motion.div 
          className="size-2 rounded-full bg-success"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-base font-bold text-foreground tabular-nums">
          {activeCount.toLocaleString()}
        </span>
        <span className="text-sm text-muted-foreground">mining now</span>
      </motion.div>
    </motion.div>
  );
};

// Subtle Floating Element Component - Premium minimal style
const FloatingElement = ({ 
  children, 
  delay = 0, 
  duration = 6,
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
    sm: "size-10",
    md: "size-14",
    lg: "size-16"
  };

  return (
    <motion.div
      className={`absolute ${sizeClasses[size]} rounded-xl bg-card/60 backdrop-blur-md border border-border/50 flex items-center justify-center`}
      style={{ 
        left: `calc(50% + ${x}px)`, 
        top: `calc(40% + ${y}px)`,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 0.8, 
        scale: 1, 
        y: [-6, 6, -6]
      }}
      transition={{ 
        opacity: { delay, duration: 0.6 },
        scale: { delay, duration: 0.6, type: "spring", stiffness: 100 },
        y: { delay: delay + 0.5, duration, repeat: Infinity, ease: "easeInOut" }
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
      className="relative w-full h-14 rounded-full bg-card border border-border overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      {/* Subtle shimmer effect */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-foreground/[0.03] to-transparent"
          animate={{ x: ["-100%", "500%"] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
      </div>
      
      {/* Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-muted-foreground font-medium text-sm">Swipe to Get Started</span>
        <motion.div 
          className="ml-2 flex gap-1"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ArrowRight className="size-4 text-muted-foreground" />
        </motion.div>
      </div>
      
      {/* Draggable thumb */}
      <motion.div
        className="absolute top-1 left-1 size-12 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center"
        style={{ x, background }}
        drag="x"
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div style={{ opacity: arrowOpacity }} className="absolute">
          <ArrowRight className="size-5 text-primary-foreground" />
        </motion.div>
        <motion.div style={{ opacity: checkOpacity }} className="absolute">
          <Check className="size-5 text-primary-foreground" />
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

  // Welcome Screen - Premium Minimal
  if (screen === "welcome") {
    return (
      <div className="min-h-screen bg-background flex flex-col dark overflow-hidden">
        {/* Subtle background gradient - deeply integrated */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60%] bg-gradient-to-b from-primary/[0.08] via-primary/[0.03] to-transparent" />
        </div>

        {/* Floating Elements - Subtle and premium */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <FloatingElement x={-90} y={-60} delay={0.4} duration={7} size="lg">
            <Zap className="size-6 text-primary/70" />
          </FloatingElement>
          <FloatingElement x={80} y={-20} delay={0.6} duration={8} size="md">
            <Sparkles className="size-5 text-muted-foreground" />
          </FloatingElement>
          <FloatingElement x={-60} y={70} delay={0.8} duration={6} size="sm">
            <Shield className="size-4 text-primary/60" />
          </FloatingElement>
          <FloatingElement x={100} y={90} delay={0.5} duration={7.5} size="sm">
            <div className="text-sm font-semibold text-muted-foreground">₿</div>
          </FloatingElement>
        </div>

        {/* Decorative ring - very subtle */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <motion.div 
            className="size-72 rounded-full border border-border/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 relative flex flex-col items-center justify-center px-6 pt-12 z-10">
          <motion.div
            className="relative z-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo - Clean shadow */}
            <motion.img 
              src={pingcasetLogo} 
              alt="PingCaset" 
              className="mx-auto size-20 rounded-2xl mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
            />

            {/* World Map with Active Miners */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6"
            >
              <ActiveMinersMap />
            </motion.div>

            {/* Headline - Clean typography */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-2"
            >
              <h2 className="text-xl md:text-2xl font-semibold leading-tight text-foreground">
                Join thousands who are
                <br />
                already mining <span className="text-primary">CASET</span>
              </h2>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground text-sm"
            >
              Start earning crypto rewards today
            </motion.p>
          </motion.div>
        </div>

        {/* Bottom CTA area */}
        <div className="relative z-10 px-6 pb-8 space-y-3">
          {/* Swipeable Button */}
          <SwipeButton onComplete={() => setScreen("landing")} />

          {/* Or tap button */}
          <motion.button
            onClick={() => setScreen("landing")}
            className="w-full text-center text-sm text-muted-foreground/70 hover:text-muted-foreground transition-colors py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            or tap to continue
          </motion.button>

          {/* Microsoft Badge - Subtle */}
          <motion.div 
            className="flex items-center justify-center gap-2 pt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <span className="text-xs text-muted-foreground/60">Supported by</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card border border-border">
              <svg viewBox="0 0 23 23" className="size-3" xmlns="http://www.w3.org/2000/svg">
                <path fill="#f25022" d="M1 1h10v10H1z"/>
                <path fill="#00a4ef" d="M1 12h10v10H1z"/>
                <path fill="#7fba00" d="M12 1h10v10H12z"/>
                <path fill="#ffb900" d="M12 12h10v10H12z"/>
              </svg>
              <span className="text-[10px] font-medium text-muted-foreground">Microsoft for Startups</span>
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
