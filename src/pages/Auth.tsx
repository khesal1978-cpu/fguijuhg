import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Hexagon, Mail, Lock, User, Gift, ArrowRight, Loader2, AlertTriangle, Key, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // If using unique ID, convert to email format
        const loginEmail = useUniqueId ? `${uniqueId.toLowerCase()}@pingcaset.id` : email;
        const { error } = await signIn(loginEmail, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Credentials verified! Face verification required.");
          navigate("/face-auth?mode=login");
        }
      } else {
        // For signup with unique ID
        const signupEmail = generatedId ? `${generatedId.toLowerCase()}@pingcaset.id` : email;
        const { error } = await signUp(signupEmail, password, displayName || generatedId, referralCode);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Account created! Set up face verification.");
          navigate("/face-auth?mode=register");
        }
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 dark">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="relative w-full max-w-sm z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
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
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {isLogin ? "Sign in to continue" : "Start your mining journey"}
          </p>

          {/* Login Method Toggle (Login only) */}
          {isLogin && (
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
            {!isLogin && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10 h-11 bg-muted/50 border-border"
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
                        className="pl-10 h-11 bg-muted/50 border-border"
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

                        {/* Warning */}
                        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                          <div className="flex gap-3">
                            <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-destructive mb-1">Important Warning</p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• Save this ID somewhere safe</li>
                                <li>• This is your ONLY way to login</li>
                                <li>• If you lose it, your account is <span className="text-destructive font-medium">PERMANENTLY LOST</span></li>
                                <li>• There is NO recovery option</li>
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

            {isLogin && (
              <div className="relative">
                {useUniqueId ? (
                  <>
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Your Unique ID (e.g. PC-ABCD1234)"
                      value={uniqueId}
                      onChange={(e) => setUniqueId(e.target.value.toUpperCase())}
                      className="pl-10 h-11 bg-muted/50 border-border font-mono"
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
                      className="pl-10 h-11 bg-muted/50 border-border"
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
                className="pl-10 h-11 bg-muted/50 border-border"
                required
                minLength={6}
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Referral Code (optional)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="pl-10 h-11 bg-muted/50 border-border"
                />
                {referralCode && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-medium">
                    +50 Bonus!
                  </span>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 gradient-primary font-semibold mt-2"
              disabled={loading || (!isLogin && !email && !generatedId)}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="size-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-5 text-center space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setGeneratedId("");
                setShowIdWarning(false);
                setUseUniqueId(false);
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="font-medium text-primary">{isLogin ? "Sign up" : "Sign in"}</span>
            </button>
            
            {isLogin && !useUniqueId && (
              <Link 
                to="/face-auth?mode=recovery"
                className="block text-sm text-primary hover:underline"
              >
                Forgot password? Recover with Face ID
              </Link>
            )}

            {isLogin && useUniqueId && (
              <p className="text-xs text-muted-foreground/70 px-4">
                ⚠️ If you lost your Unique ID, your account cannot be recovered.
              </p>
            )}
          </div>
        </div>

        {/* Microsoft for Startups Badge */}
        <motion.div
          className="mt-8 flex items-center justify-center gap-2 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-xs">Supported by</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border">
            <svg 
              viewBox="0 0 23 23" 
              className="size-4"
              xmlns="http://www.w3.org/2000/svg"
            >
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