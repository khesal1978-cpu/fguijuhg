import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Hexagon, Mail, Lock, User, Gift, ArrowRight, Loader2 } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Credentials verified! Face verification required.");
          navigate("/face-auth?mode=login");
        }
      } else {
        const { error } = await signUp(email, password, displayName, referralCode);
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

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 h-11 bg-muted/50 border-border"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 bg-muted/50 border-border"
                required
              />
            </div>

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
              disabled={loading}
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
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="font-medium text-primary">{isLogin ? "Sign up" : "Sign in"}</span>
            </button>
            
            {isLogin && (
              <Link 
                to="/face-auth?mode=recovery"
                className="block text-sm text-primary hover:underline"
              >
                Forgot password? Recover with Face ID
              </Link>
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