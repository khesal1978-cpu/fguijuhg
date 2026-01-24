import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Mail, Lock, User, Gift, ArrowRight, Loader2, 
  AlertTriangle, Key, Copy, Check, Sparkles, Zap, Shield, ChevronLeft,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { firebaseSignUp, firebaseSignIn, createProfile, signInWithGoogle, getProfile, db } from "@/lib/firebase";
import { toast } from "sonner";
import { collection, query, where, getDocs } from "firebase/firestore";
import pingcasetLogo from "@/assets/pingcaset-logo.png";

type AuthScreen = "welcome" | "login" | "register" | "recover" | "unique-id-setup";

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

  const resetToWelcome = () => {
    setScreen("welcome");
    setGeneratedId("");
    setLoginMethod("email");
    setFoundUniqueId(null);
    setRecoveryEmail("");
    setLinkRecoveryEmail("");
  };

  // Welcome Screen
  if (screen === "welcome") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 dark">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        </div>

        <motion.div
          className="relative z-10 w-full max-w-sm text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <motion.div
            className="mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
          >
            <img 
              src={pingcasetLogo} 
              alt="PingCaset" 
              className="mx-auto size-24 rounded-2xl shadow-2xl shadow-primary/40"
            />
          </motion.div>

          <motion.h1 
            className="text-3xl font-display font-bold text-foreground mb-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            PingCaset
          </motion.h1>
          <motion.p 
            className="text-primary text-xs font-semibold tracking-[0.3em] mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            MINING HUB
          </motion.p>
          
          <motion.p 
            className="text-muted-foreground text-sm leading-relaxed mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Earn CASET tokens through time-based mining.<br/>
            No hardware required — just your time.
          </motion.p>

          {/* Feature Cards */}
          <motion.div 
            className="grid grid-cols-3 gap-3 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { icon: Zap, label: "10 CASET", sub: "per session" },
              { icon: Sparkles, label: "4 Sessions", sub: "per day" },
              { icon: Shield, label: "Secure", sub: "& fair" },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
                <item.icon className="size-5 text-primary mx-auto mb-1" />
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={() => setScreen("register")}
              className="w-full h-14 rounded-2xl gradient-primary font-bold text-lg shadow-xl shadow-primary/30"
            >
              Get Started
              <ArrowRight className="size-5 ml-2" />
            </Button>

            <button
              onClick={() => setScreen("login")}
              className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Already have an account? <span className="text-primary font-medium">Sign in</span>
            </button>
          </motion.div>

          {/* Microsoft Badge */}
          <motion.div
            className="mt-10 flex items-center justify-center gap-2 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <span className="text-xs">Supported by</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border">
              <svg viewBox="0 0 23 23" className="size-4" xmlns="http://www.w3.org/2000/svg">
                <path fill="#f25022" d="M1 1h10v10H1z"/>
                <path fill="#00a4ef" d="M1 12h10v10H1z"/>
                <path fill="#7fba00" d="M12 1h10v10H12z"/>
                <path fill="#ffb900" d="M12 12h10v10H12z"/>
              </svg>
              <span className="text-xs font-medium text-foreground">Microsoft for Startups</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Recovery Screen
  if (screen === "recover") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 dark">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        </div>

        <motion.div
          className="relative w-full max-w-xs z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button onClick={() => setScreen("login")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ChevronLeft className="size-4" /> Back
          </button>

          <div className="text-center mb-6">
            <img src={pingcasetLogo} alt="PingCaset" className="mx-auto size-14 rounded-xl shadow-lg shadow-primary/20 mb-4" />
            <h1 className="text-xl font-display font-bold text-foreground">Find Your ID</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your linked recovery email</p>
          </div>

          <div className="card-dark p-5">
            {foundUniqueId ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Your Unique ID</p>
                  <p className="text-xl font-mono font-bold text-primary">{foundUniqueId}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(foundUniqueId);
                      toast.success("Copied!");
                    }}
                    className="text-sm"
                  >
                    <Copy className="size-4 mr-1.5" /> Copy
                  </Button>
                  <Button
                    onClick={() => {
                      setScreen("login");
                      setLoginMethod("unique-id");
                      setUniqueId(foundUniqueId);
                      setFoundUniqueId(null);
                    }}
                    className="gradient-primary text-sm"
                  >
                    Login <ArrowRight className="size-4 ml-1.5" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleRecoverUniqueId} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@gmail.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="pl-10 h-11 bg-muted/30 border-border"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 gradient-primary">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Find My ID"}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Unique ID Setup Screen
  if (screen === "unique-id-setup") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 dark">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        </div>

        <motion.div
          className="relative w-full max-w-xs z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button onClick={resetToWelcome} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ChevronLeft className="size-4" /> Back
          </button>

          <div className="text-center mb-6">
            <img src={pingcasetLogo} alt="PingCaset" className="mx-auto size-14 rounded-xl shadow-lg shadow-primary/20 mb-4" />
            <h1 className="text-xl font-display font-bold text-foreground">Your Unique ID</h1>
            <p className="text-sm text-muted-foreground mt-1">Save this - it's your login credential</p>
          </div>

          <div className="card-dark p-5 space-y-4">
            {/* ID Display */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
              <div className="flex items-center justify-between">
                <p className="text-xl font-mono font-bold text-primary">{generatedId}</p>
                <Button size="sm" variant="ghost" onClick={copyGeneratedId} className="text-primary hover:text-primary hover:bg-primary/10 h-8 w-8 p-0">
                  {idCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            {/* Warning */}
            <div className="flex gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="text-destructive font-medium">Save this ID!</span> Lost IDs without recovery email cannot be recovered.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 h-10 bg-muted/30 border-border"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Recovery Email (optional)"
                  value={linkRecoveryEmail}
                  onChange={(e) => setLinkRecoveryEmail(e.target.value)}
                  className="pl-10 h-10 bg-muted/30 border-border"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Create Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-10 bg-muted/30 border-border"
                  required
                  minLength={6}
                />
              </div>

              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Referral Code (optional)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="pl-10 h-10 bg-muted/30 border-border"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11 gradient-primary font-semibold">
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Create Account"}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // Login / Register Screen
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 dark">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        className="relative w-full max-w-xs z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button onClick={resetToWelcome} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="size-4" /> Back
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <img src={pingcasetLogo} alt="PingCaset" className="mx-auto size-16 rounded-xl shadow-lg shadow-primary/20 mb-4" />
          <h1 className="font-display font-bold text-xl text-foreground">
            {screen === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {screen === "login" ? "Sign in to continue mining" : "Start your mining journey"}
          </p>
        </div>

        {/* Auth Card */}
        <div className="card-dark p-5 space-y-4">
          {/* Google Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-11 border-border hover:bg-muted/50"
          >
            <svg className="size-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-card text-xs text-muted-foreground">or</span>
            </div>
          </div>

          {/* Login Method Toggle (Login only) */}
          {screen === "login" && (
            <div className="flex p-1 bg-muted/50 rounded-xl">
              <button
                type="button"
                onClick={() => setLoginMethod("email")}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  loginMethod === "email" ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <Mail className="size-3.5" /> Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("unique-id")}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  loginMethod === "unique-id" ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <Key className="size-3.5" /> Unique ID
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {screen === "register" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 h-10 bg-muted/30 border-border"
                  required
                />
              </div>
            )}

            {screen === "login" ? (
              loginMethod === "unique-id" ? (
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="PC-XXXXXXXX"
                    value={uniqueId}
                    onChange={(e) => setUniqueId(e.target.value.toUpperCase())}
                    className="pl-10 h-10 bg-muted/30 border-border font-mono"
                    required
                  />
                </div>
              ) : (
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 bg-muted/30 border-border"
                    required
                  />
                </div>
              )
            ) : (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-10 bg-muted/30 border-border"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-10 bg-muted/30 border-border"
                required
                minLength={6}
              />
            </div>

            {screen === "register" && (
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Referral Code (optional)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="pl-10 h-10 bg-muted/30 border-border"
                />
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11 gradient-primary font-semibold">
              {loading ? <Loader2 className="size-4 animate-spin" /> : screen === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {/* Unique ID Signup Option (Register only) */}
          {screen === "register" && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-card text-xs text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={handleCreateUniqueId}
                className="w-full h-10 text-primary hover:text-primary hover:bg-primary/10 text-sm"
              >
                <Key className="size-4 mr-2" />
                Create with Unique ID (No Email)
              </Button>
            </>
          )}

          {/* Forgot ID (Login with Unique ID only) */}
          {screen === "login" && loginMethod === "unique-id" && (
            <button
              type="button"
              onClick={() => setScreen("recover")}
              className="w-full text-center text-xs text-primary hover:underline"
            >
              Forgot your Unique ID?
            </button>
          )}
        </div>

        {/* Toggle */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          {screen === "login" ? (
            <>Don't have an account? <button onClick={() => setScreen("register")} className="text-primary hover:underline">Sign up</button></>
          ) : (
            <>Have an account? <button onClick={() => setScreen("login")} className="text-primary hover:underline">Sign in</button></>
          )}
        </p>
      </motion.div>
    </div>
  );
}
