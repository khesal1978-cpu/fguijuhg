import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Hexagon, Mail, Lock, User, Gift, ArrowRight, Loader2, Sparkles } from "lucide-react";
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
          toast.success("Welcome back! ⛏️");
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, displayName, referralCode);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Account created! Start mining now! 🎉");
          navigate("/");
        }
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Large morphing blobs */}
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/10 to-accent-foreground/5 blur-3xl animate-morph" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-gold/10 to-primary/5 blur-3xl animate-morph-reverse" />
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-primary/30 rounded-full animate-float" />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-accent-foreground/40 rounded-full animate-float delay-500" />
        <div className="absolute bottom-1/3 left-1/4 w-4 h-4 bg-gold/20 rounded-full animate-float delay-1000" />
        
        {/* Breathing ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-primary/5 rounded-full animate-breathe" />
      </div>

      <motion.div
        className="relative w-full max-w-md z-10"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <motion.div 
          className="flex items-center justify-center gap-3 mb-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent-foreground rounded-2xl blur-lg opacity-50 animate-breathe" />
            <div className="relative flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-primary to-accent-foreground shadow-glow">
              <Hexagon className="size-7 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="font-serif font-bold text-3xl text-foreground">
              PingCaset
            </h1>
            <p className="text-xs text-primary font-semibold tracking-[0.2em]">
              MINING HUB
            </p>
          </div>
        </motion.div>

        {/* Auth Card */}
        <motion.div 
          className="glass-card rounded-3xl p-7 md:p-9 shadow-glow"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h2 className="text-2xl font-serif font-bold text-foreground text-center mb-2">
            {isLogin ? "Welcome Back" : "Join the Mining"}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-7">
            {isLogin
              ? "Sign in to continue mining"
              : "Create an account to start earning"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <motion.div 
                className="relative"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-12 h-13 rounded-xl bg-muted/50 border-border/50 focus:border-primary/50 transition-all"
                  required={!isLogin}
                />
              </motion.div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-13 rounded-xl bg-muted/50 border-border/50 focus:border-primary/50 transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-13 rounded-xl bg-muted/50 border-border/50 focus:border-primary/50 transition-all"
                required
                minLength={6}
              />
            </div>

            {!isLogin && (
              <motion.div 
                className="relative"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <Gift className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Referral Code (optional)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="pl-12 h-13 rounded-xl bg-muted/50 border-border/50 focus:border-primary/50 transition-all"
                />
                {referralCode && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-primary font-semibold flex items-center gap-1">
                    <Sparkles className="size-3" />
                    +50 Bonus!
                  </span>
                )}
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-glow mt-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="size-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-7 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <span className="font-semibold text-primary">
                {isLogin ? "Sign up" : "Sign in"}
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
