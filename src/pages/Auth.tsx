import { useState, useEffect, forwardRef, memo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Mail, Lock, User, Gift, ArrowRight, Loader2, 
  AlertTriangle, Key, Copy, Check, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { firebaseSignUp, firebaseSignIn, createProfile, getProfile, db } from "@/lib/firebase";
import { toast } from "sonner";
import { collection, query, where, getDocs } from "firebase/firestore";
import pingcasetLogo from "@/assets/pingcaset-logo.png";
import globeBackground from "@/assets/globe-background.png";
import welcomeVideo from "@/assets/welcome-video.mp4";

type AuthScreen = "welcome" | "landing" | "login" | "register" | "recover" | "unique-id-setup";

// Animated counter for user count - wrapped with forwardRef
const AnimatedCounterInner = forwardRef<HTMLSpanElement, object>(function AnimatedCounter(_, ref) {
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
    <span ref={ref}>
      <span className="text-white font-semibold">{count.toLocaleString()}</span>
      <span className="text-[#8E8E9A] ml-1">users mining now</span>
    </span>
  );
});

const AnimatedCounter = memo(AnimatedCounterInner);

const AuthInner = forwardRef<HTMLDivElement, object>(function Auth(_, ref) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [screen, setScreen] = useState<AuthScreen>("welcome");
  const [loading, setLoading] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [loginMethod, setLoginMethod] = useState<"email" | "unique-id">("email");

  // Video ready state handled via onCanPlay
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
    
    // Validate referral code is provided for registration
    if ((screen === "register" || screen === "unique-id-setup") && !referralCode.trim()) {
      toast.error("Invite code is required");
      return;
    }
    
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
        console.log('Starting registration with referral code:', referralCode);
        const userCredential = await firebaseSignUp(email, password);
        console.log('Firebase user created:', userCredential.user.uid);
        
        // Create profile IMMEDIATELY with referral code before navigation
        await createProfile(
          userCredential.user.uid,
          displayName || 'Miner',
          referralCode.trim(),
          { recoveryEmail: email }
        );
        console.log('Profile created with referral code:', referralCode);
        
        toast.success("Account created!");
        navigate("/");
      } else if (screen === "unique-id-setup") {
        const signupEmail = `${generatedId.toLowerCase()}@pingcaset.id`;
        console.log('Starting unique ID registration with referral code:', referralCode);
        const userCredential = await firebaseSignUp(signupEmail, password);
        console.log('Firebase user created:', userCredential.user.uid);
        
        // Create profile IMMEDIATELY with referral code before navigation
        await createProfile(
          userCredential.user.uid,
          displayName || generatedId,
          referralCode.trim(),
          { 
            uniqueId: generatedId,
            recoveryEmail: linkRecoveryEmail || undefined
          }
        );
        console.log('Profile created with referral code:', referralCode);
        
        toast.success("Account created!");
        navigate("/");
      }
    } catch (err: any) {
      console.error('Registration error:', err);
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
          {/* App Icon with 3D effect and glow - NO DELAY */}
          <motion.div
            className="relative mb-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Soft glow behind icon */}
            <div 
              className="absolute -inset-10 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(123, 63, 228, 0.35) 0%, rgba(123, 63, 228, 0.1) 40%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />
            <img 
              src={pingcasetLogo} 
              alt="PingCaset" 
              className="relative size-[120px] sm:size-[130px] rounded-[28px]"
              style={{
                boxShadow: '0 20px 40px rgba(123, 63, 228, 0.3), 0 10px 25px rgba(0, 0, 0, 0.35)'
              }}
            />
          </motion.div>

          {/* Headline */}
          <motion.h1 
            className="text-[28px] sm:text-[32px] font-display font-bold text-white text-center leading-[1.15] mb-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            Mine CASET.
            <br />
            Build Early.
          </motion.h1>

          {/* Subtext with glassmorphic pill */}
          <motion.p
            className="text-white/60 text-[13px] sm:text-[14px] text-center tracking-wide px-4 py-2 rounded-full backdrop-blur-md"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            A fair, time-based crypto mining network
          </motion.p>
        </div>

        {/* Buttons Section */}
        <motion.div 
          className="relative z-10 px-6 pb-8 sm:pb-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {/* Helper text */}
          <p className="text-center text-[14px] text-white/40 mb-4">
            Already have an account?
          </p>

          {/* Primary Button - Login */}
          <motion.button
            onClick={() => setScreen("login")}
            className="group relative w-full h-[56px] rounded-full font-semibold text-[16px] mb-3 overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #E8E8EC 0%, #D8D8DC 100%)',
              color: '#0A0A0F',
            }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <span 
              className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                animation: 'shine 3s ease-in-out infinite',
              }}
            />
            <span className="relative z-10">Login</span>
          </motion.button>

          {/* Secondary Button - Sign Up with glassmorphism */}
          <motion.button
            onClick={() => setScreen("register")}
            className="w-full h-[56px] rounded-full font-semibold text-[16px] text-white backdrop-blur-md"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.06)',
            }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign Up
          </motion.button>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-6 pt-8">
            <Link to="/privacy-policy" className="text-[13px] text-white/30 hover:text-white/50 transition-colors">
              Privacy policy
            </Link>
            <span className="text-white/20">•</span>
            <Link to="/terms-conditions" className="text-[13px] text-white/30 hover:text-white/50 transition-colors">
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
        className="min-h-screen min-h-[100dvh] flex flex-col dark overflow-hidden relative bg-[#0A0A12]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Video Background - loads in background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          onCanPlay={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          <source src={welcomeVideo} type="video/mp4" />
        </video>
        
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
              className="text-white/70 text-[13px] sm:text-[14px] text-center mt-4 tracking-wide px-4 py-2 rounded-full backdrop-blur-md"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              No hardware • No fees • Time-based mining
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
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.85) 0%, rgba(20, 20, 28, 0.9) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
              animate={{ 
                boxShadow: [
                  '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  '0 8px 40px rgba(34, 197, 94, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span 
                className="size-2.5 rounded-full bg-[#22C55E]"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <AnimatedCounter />
            </motion.div>
          </motion.div>

          {/* CTA Button with Enhanced Animation */}
          <motion.button
            onClick={() => setScreen("landing")}
            className="group relative w-full h-[60px] rounded-full font-semibold text-[18px] text-white flex items-center justify-center gap-2.5 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #7B3FE4 0%, #9C6BFF 50%, #7B3FE4 100%)',
              boxShadow: '0 0 30px rgba(123, 63, 228, 0.5), 0 0 60px rgba(123, 63, 228, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
              border: '1px solid rgba(156, 107, 255, 0.3)'
            }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              boxShadow: [
                '0 0 30px rgba(123, 63, 228, 0.5), 0 0 60px rgba(123, 63, 228, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                '0 0 40px rgba(123, 63, 228, 0.7), 0 0 80px rgba(123, 63, 228, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                '0 0 30px rgba(123, 63, 228, 0.5), 0 0 60px rgba(123, 63, 228, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
              ]
            }}
            transition={{ 
              delay: 0.6, 
              type: "spring", 
              stiffness: 200,
              boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Shine animation overlay */}
            <span 
              className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                animation: 'shine 2.5s ease-in-out infinite',
              }}
            />
            <motion.span 
              className="relative z-10 flex items-center gap-2.5"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              Start Mining Now
              <ArrowRight className="size-5" strokeWidth={2.5} />
            </motion.span>
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
      <div className="min-h-screen min-h-[100dvh] flex flex-col dark overflow-hidden relative">
        {/* Background */}
        <div className="absolute inset-0 bg-[#050507]" />
        
        {/* Top purple glow */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(123, 63, 228, 0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Content */}
        <motion.div 
          className="relative z-10 flex-1 flex flex-col px-6 pt-6 pb-6 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {/* Back button */}
          <motion.button 
            onClick={resetToLanding} 
            className="size-10 rounded-full backdrop-blur-md flex items-center justify-center mb-5"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="size-5 text-white" />
          </motion.button>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
          >
            <h1 className="text-[26px] font-display font-bold text-white mb-1">Welcome back</h1>
            <p className="text-white/50 text-[14px] mb-6">Login to continue mining</p>
          </motion.div>

          {/* Form */}
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.2 }}
          >
            {/* Method Toggle */}
            <div 
              className="flex gap-1.5 p-1 rounded-xl mb-1 backdrop-blur-md"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <button
                type="button"
                onClick={() => setLoginMethod("email")}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  loginMethod === "email" 
                    ? "bg-white/10 text-white" 
                    : "text-white/40"
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("unique-id")}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  loginMethod === "unique-id" 
                    ? "bg-white/10 text-white" 
                    : "text-white/40"
                }`}
              >
                Unique ID
              </button>
            </div>

            {loginMethod === "email" ? (
              <div className="relative">
                <div 
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255, 255, 255, 0.06)' }}
                >
                  <Mail className="size-4 text-white/50" />
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-[52px] pl-14 rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/40 text-[15px]"
                />
              </div>
            ) : (
              <div className="relative">
                <div 
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255, 255, 255, 0.06)' }}
                >
                  <Key className="size-4 text-white/50" />
                </div>
                <Input
                  type="text"
                  placeholder="PC-XXXXXXXX"
                  value={uniqueId}
                  onChange={(e) => setUniqueId(e.target.value.toUpperCase())}
                  required
                  className="h-[52px] pl-14 rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/40 text-[15px] font-mono"
                />
              </div>
            )}

            <div className="relative">
              <div 
                className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.06)' }}
              >
                <Lock className="size-4 text-white/50" />
              </div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-[52px] pl-14 rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/40 text-[15px]"
              />
            </div>

            {loginMethod === "unique-id" && (
              <button
                type="button"
                onClick={() => setScreen("recover")}
                className="flex items-center gap-2 text-[13px] text-primary"
              >
                <Key className="size-3.5" />
                Forgot your Unique ID? <span className="text-white/40">Recover ›</span>
              </button>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full h-[54px] rounded-full font-semibold text-[16px] text-white flex items-center justify-center gap-2 mt-3"
              style={{
                background: 'linear-gradient(135deg, #7B3FE4 0%, #9C6BFF 100%)',
                boxShadow: '0 0 25px rgba(123, 63, 228, 0.35)',
              }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : (
                <>Login & Start Mining <ArrowRight className="size-4" /></>
              )}
            </motion.button>
          </motion.form>
        </motion.div>

        {/* Bottom link */}
        <motion.div 
          className="relative z-10 text-center pb-6 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.3 }}
        >
          <p className="text-[14px] text-white/40">
            Don't have an account?{" "}
            <button onClick={() => setScreen("register")} className="text-primary font-medium">
              Sign up
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  // Register Screen
  if (screen === "register") {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col dark overflow-hidden relative">
        {/* Background */}
        <div className="absolute inset-0 bg-[#050507]" />
        
        {/* Top purple glow */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(123, 63, 228, 0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Content */}
        <motion.div 
          className="relative z-10 flex-1 flex flex-col px-6 pt-6 pb-6 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {/* Back button */}
          <motion.button 
            onClick={resetToLanding} 
            className="size-10 rounded-full backdrop-blur-md flex items-center justify-center mb-5"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="size-5 text-white" />
          </motion.button>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
          >
            <h1 className="text-[26px] font-display font-bold text-white mb-1">Create your account</h1>
            <p className="text-white/50 text-[14px] mb-6">Start mining CASET in minutes</p>
          </motion.div>

          {/* Form */}
          {/* Form */}
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.2 }}
          >
            {/* Display Name */}
            <div className="relative">
              <div 
                className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.06)' }}
              >
                <User className="size-4 text-white/50" />
              </div>
              <Input
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-[52px] pl-14 rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/40 text-[15px]"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <div 
                className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.06)' }}
              >
                <Mail className="size-4 text-white/50" />
              </div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-[52px] pl-14 rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/40 text-[15px]"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div 
                className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.06)' }}
              >
                <Lock className="size-4 text-white/50" />
              </div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-[52px] pl-14 rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/40 text-[15px]"
              />
            </div>

            {/* Referral Code - Required */}
            <div className="relative">
              <div 
                className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.06)' }}
              >
                <Gift className="size-4 text-white/50" />
              </div>
              <Input
                type="text"
                placeholder="Invite code (required)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                required
                className="h-[52px] pl-14 rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/40 text-[15px]"
              />
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full h-[54px] rounded-full font-semibold text-[16px] text-white flex items-center justify-center gap-2 mt-3"
              style={{
                background: 'linear-gradient(135deg, #7B3FE4 0%, #9C6BFF 100%)',
                boxShadow: '0 0 25px rgba(123, 63, 228, 0.35)',
              }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : (
                <>Create Account <ArrowRight className="size-4" /></>
              )}
            </motion.button>
          </motion.form>

          {/* Advanced Options Divider */}
          <motion.div 
            className="flex items-center gap-4 my-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.3 }}
          >
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[12px] text-white/40">Advanced</span>
            <div className="flex-1 h-px bg-white/10" />
          </motion.div>

          {/* Unique ID Option */}
          <motion.button
            type="button"
            onClick={handleCreateUniqueId}
            className="flex items-center justify-center gap-2 text-[14px] text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.35 }}
          >
            <Key className="size-4" />
            Create with Unique ID (no email)
          </motion.button>
        </motion.div>

        {/* Bottom link */}
        <motion.div 
          className="relative z-10 text-center pb-6 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.4 }}
        >
          <p className="text-[14px] text-white/40">
            Have an account?{" "}
            <button onClick={() => setScreen("login")} className="text-primary font-medium">
              Sign in
            </button>
          </p>
        </motion.div>
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
                placeholder="Invite code (required)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                required
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
});

export default memo(AuthInner);
