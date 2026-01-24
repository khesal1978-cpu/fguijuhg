import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Mail, Lock, User, Gift, ArrowRight, Loader2, 
  AlertTriangle, Key, Copy, Check, ChevronLeft, ChevronsRight
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
      <div className="min-h-screen bg-background flex flex-col dark">
        {/* Top gradient area */}
        <div className="flex-1 relative flex flex-col items-center justify-center px-6 pt-12">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px]" />
          </div>
          
          {/* Logo grid pattern - decorative */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="grid grid-cols-6 gap-2 p-4">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-foreground/20" />
              ))}
            </div>
          </div>

          <motion.div
            className="relative z-10 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Big Counter */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-6xl md:text-7xl font-display font-bold text-foreground mb-2">
                <AnimatedCounter value={24897} />
              </h1>
              <p className="text-muted-foreground text-sm mb-8">PingCaset IDs</p>
            </motion.div>

            {/* Gradient headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-4"
            >
              <h2 className="text-2xl md:text-3xl font-display font-bold leading-tight">
                <span className="text-primary">Thousands</span>
                <span className="text-foreground"> have</span>
                <br />
                <span className="text-primary">already</span>
                <span className="text-foreground"> started to</span>
                <br />
                <span className="text-primary">mine</span>
                <span className="text-foreground"> CASET</span>
              </h2>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-muted-foreground text-sm mb-6"
            >
              Are you ready to join? ⛏️ ✨
            </motion.p>
          </motion.div>
        </div>

        {/* Bottom CTA area */}
        <motion.div 
          className="px-6 pb-8 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {/* Main CTA Button */}
          <button
            onClick={() => setScreen("landing")}
            className="w-full h-14 rounded-full bg-foreground text-background font-semibold text-base flex items-center justify-between px-2 hover:opacity-90 transition-opacity"
          >
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <ArrowRight className="size-5 text-foreground" />
            </div>
            <span className="flex-1 text-center">Get Started Now</span>
            <ChevronsRight className="size-5 text-muted-foreground mr-2" />
          </button>

          {/* Microsoft Badge */}
          <div className="flex items-center justify-center gap-2 pt-2">
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
          </div>
        </motion.div>
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
