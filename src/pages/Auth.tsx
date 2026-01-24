import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Hexagon, Mail, Lock, User, Gift, ArrowRight, Loader2, 
  AlertTriangle, Key, Copy, Check, Sparkles, Zap, Shield, ChevronLeft,
  Search, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { firebaseSignUp, firebaseSignIn, createProfile, signInWithGoogle, findUniqueIdByEmail, getProfile, db } from "@/lib/firebase";
import { toast } from "sonner";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

type AuthScreen = "welcome" | "login" | "register" | "recover";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [screen, setScreen] = useState<AuthScreen>("welcome");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [useUniqueId, setUseUniqueId] = useState(false);
  const [uniqueId, setUniqueId] = useState("");
  const [generatedId, setGeneratedId] = useState("");
  const [showIdWarning, setShowIdWarning] = useState(false);
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
    setShowIdWarning(true);
  };

  const copyGeneratedId = () => {
    navigator.clipboard.writeText(generatedId);
    setIdCopied(true);
    toast.success("ID copied! Save it somewhere safe.");
    setTimeout(() => setIdCopied(false), 2000);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      
      // Check if profile exists
      const existingProfile = await getProfile(user.uid);
      
      if (!existingProfile) {
        // Create new profile for Google user
        await createProfile(
          user.uid,
          user.displayName || 'Miner',
          referralCode,
          { recoveryEmail: user.email || undefined }
        );
        toast.success("Account created! Happy mining!");
      } else {
        toast.success("Welcome back!");
      }
      
      navigate("/");
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      if (err?.code === 'auth/popup-closed-by-user') {
        toast.error("Sign-in cancelled");
      } else {
        toast.error(err?.message || "Failed to sign in with Google");
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
      // Search for profile with this recovery email
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
      console.error("Recovery error:", err);
      toast.error("Failed to search for account");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (screen === "login") {
        // Login with Firebase
        const loginEmail = useUniqueId ? `${uniqueId.toLowerCase()}@pingcaset.id` : email;
        await firebaseSignIn(loginEmail, password);
        
        toast.success("Welcome back!");
        navigate("/");
      } else {
        // Register with Firebase
        const isUniqueIdSignup = !!generatedId;
        const signupEmail = isUniqueIdSignup ? `${generatedId.toLowerCase()}@pingcaset.id` : email;
        const userCredential = await firebaseSignUp(signupEmail, password);
        
        // Create profile in Firestore with optional recovery email
        await createProfile(
          userCredential.user.uid,
          displayName || generatedId || 'Miner',
          referralCode,
          { 
            uniqueId: isUniqueIdSignup ? generatedId : undefined,
            recoveryEmail: isUniqueIdSignup ? linkRecoveryEmail || undefined : email
          }
        );
        
        toast.success("Account created! Happy mining!");
        navigate("/");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      const errorMessage = err?.message || "An error occurred";
      if (errorMessage.includes("email-already-in-use")) {
        toast.error("This email is already registered");
      } else if (errorMessage.includes("invalid-credential") || errorMessage.includes("wrong-password")) {
        toast.error("Invalid email or password");
      } else if (errorMessage.includes("user-not-found")) {
        toast.error("No account found with this email");
      } else if (errorMessage.includes("weak-password")) {
        toast.error("Password should be at least 6 characters");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Welcome/Get Started Screen
  if (screen === "welcome") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 dark">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />
        </div>

        <motion.div
          className="relative z-10 w-full max-w-sm text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <motion.div
            className="flex items-center justify-center gap-3 mb-8"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-2xl shadow-primary/30">
              <Hexagon className="size-9 text-white" />
            </div>
          </motion.div>

          <motion.h1
            className="text-3xl font-display font-bold text-foreground mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            PingCaset
          </motion.h1>
          
          <motion.p
            className="text-primary font-semibold tracking-[0.3em] text-xs mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            MINING HUB
          </motion.p>

          <motion.p
            className="text-muted-foreground text-sm leading-relaxed mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Earn CASET tokens through time-based mining. 
            No hardware required — just your time.
          </motion.p>

          {/* Features */}
          <motion.div
            className="grid grid-cols-3 gap-3 mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {[
              { icon: Zap, label: "10 CASET", sub: "per session" },
              { icon: Sparkles, label: "4 Sessions", sub: "per day" },
              { icon: Shield, label: "Secure", sub: "& fair" },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-card/50 border border-border/50">
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
            transition={{ delay: 0.7 }}
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
            className="mt-12 flex items-center justify-center gap-2 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4 dark">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          className="relative w-full max-w-sm z-10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => {
              setScreen("login");
              setFoundUniqueId(null);
              setRecoveryEmail("");
            }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ChevronLeft className="size-4" />
            Back to Login
          </button>

          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
              <RefreshCw className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-foreground">Recover ID</h1>
              <p className="text-[10px] text-primary font-medium tracking-widest">ACCOUNT RECOVERY</p>
            </div>
          </div>

          <div className="card-dark p-6">
            <h2 className="text-lg font-display font-bold text-foreground text-center mb-1">
              Find Your Unique ID
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Enter the Gmail you linked during signup
            </p>

            {foundUniqueId ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center">
                  <p className="text-xs text-muted-foreground mb-2">Your Unique ID</p>
                  <p className="text-2xl font-mono font-bold text-primary">{foundUniqueId}</p>
                </div>
                
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(foundUniqueId);
                    toast.success("ID copied!");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Copy className="size-4 mr-2" />
                  Copy ID
                </Button>

                <Button
                  onClick={() => {
                    setScreen("login");
                    setUseUniqueId(true);
                    setUniqueId(foundUniqueId);
                    setFoundUniqueId(null);
                  }}
                  className="w-full gradient-primary"
                >
                  <Key className="size-4 mr-2" />
                  Login with this ID
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleRecoverUniqueId} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your recovery Gmail"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="pl-10 h-11 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 gradient-primary font-bold rounded-xl"
                >
                  {loading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="size-4 mr-2" />
                      Find My ID
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Login/Register Screen
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 dark">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="relative w-full max-w-sm z-10"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Back Button */}
        <button
          onClick={() => {
            setScreen("welcome");
            setGeneratedId("");
            setShowIdWarning(false);
            setUseUniqueId(false);
          }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
            <Hexagon className="size-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">PingCaset</h1>
            <p className="text-[10px] text-primary font-medium tracking-widest">MINING HUB</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="card-dark p-6">
          <h2 className="text-lg font-display font-bold text-foreground text-center mb-1">
            {screen === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {screen === "login" ? "Sign in to continue mining" : "Start your mining journey"}
          </p>

          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-11 mb-4 border-border hover:bg-muted/50"
          >
            <svg className="size-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-card text-muted-foreground">or</span>
            </div>
          </div>

          {/* Login Method Toggle (Login only) */}
          {screen === "login" && (
            <div className="flex gap-2 mb-4 p-1 bg-muted/50 rounded-xl">
              <button
                type="button"
                onClick={() => setUseUniqueId(false)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  !useUniqueId ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <Mail className="size-4 inline mr-1.5" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setUseUniqueId(true)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  useUniqueId ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <Key className="size-4 inline mr-1.5" />
                Unique ID
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {screen === "register" && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10 h-11 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                    required={!generatedId}
                  />
                </div>

                {/* Unique ID Option for Signup */}
                {!generatedId ? (
                  <>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                        required={!generatedId}
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-card text-muted-foreground">or</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCreateUniqueId}
                      className="w-full h-11 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Key className="size-4 mr-2" />
                      Create Unique ID (No Email)
                    </Button>
                  </>
                ) : (
                  <AnimatePresence>
                    {showIdWarning && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3"
                      >
                        {/* Generated ID Display */}
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                          <p className="text-xs text-muted-foreground mb-2">Your Unique ID</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xl font-mono font-bold text-primary">{generatedId}</p>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={copyGeneratedId}
                              className="text-primary"
                            >
                              {idCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Optional Recovery Email */}
                        <div className="p-4 rounded-xl bg-muted/30 border border-border">
                          <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                            <Mail className="size-3.5 text-primary" />
                            Link Gmail for Recovery (Optional)
                          </p>
                          <Input
                            type="email"
                            placeholder="your@gmail.com"
                            value={linkRecoveryEmail}
                            onChange={(e) => setLinkRecoveryEmail(e.target.value)}
                            className="h-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground text-sm"
                          />
                          <p className="text-[10px] text-muted-foreground mt-2">
                            This lets you recover your ID if forgotten
                          </p>
                        </div>

                        {/* Warning */}
                        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                          <div className="flex gap-3">
                            <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-destructive mb-1">Important Warning</p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                <li className="text-foreground">• Save this ID somewhere safe</li>
                                <li className="text-foreground">• This is your ONLY way to login</li>
                                <li>• Without recovery email, lost ID = <span className="text-destructive font-medium">PERMANENT LOSS</span></li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setGeneratedId("");
                            setShowIdWarning(false);
                            setLinkRecoveryEmail("");
                          }}
                          className="w-full text-muted-foreground"
                        >
                          Use Email Instead
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </>
            )}

            {screen === "login" && (
              <div className="relative">
                {useUniqueId ? (
                  <>
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Your Unique ID (e.g. PC-ABCD1234)"
                      value={uniqueId}
                      onChange={(e) => setUniqueId(e.target.value.toUpperCase())}
                      className="pl-10 h-11 bg-muted/50 border-border font-mono text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </>
                ) : (
                  <>
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </>
                )}
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
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
                  className="pl-10 h-11 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 gradient-primary font-bold rounded-xl shadow-lg shadow-primary/25"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : screen === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Forgot Unique ID link */}
          {screen === "login" && useUniqueId && (
            <button
              onClick={() => setScreen("recover")}
              className="w-full mt-3 text-xs text-primary hover:underline"
            >
              Forgot your Unique ID?
            </button>
          )}

          {/* Toggle Login/Register */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            {screen === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => setScreen("register")}
                  className="text-primary font-medium hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setScreen("login")}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
