import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, forwardRef, memo } from "react";
import { motion } from "framer-motion";
import { Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFoundInner = forwardRef<HTMLDivElement, object>(function NotFound(_, ref) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div ref={ref} className="flex min-h-screen items-center justify-center bg-background p-6">
      <motion.div 
        className="text-center space-y-6 max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mx-auto size-20 rounded-2xl bg-destructive/20 border border-destructive/30 flex items-center justify-center">
          <AlertCircle className="size-10 text-destructive" />
        </div>
        <div>
          <h1 className="text-5xl font-display font-bold text-foreground mb-2">404</h1>
          <p className="text-lg text-muted-foreground">Page not found</p>
        </div>
        <p className="text-sm text-foreground/60">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button 
          onClick={() => navigate("/")} 
          className="w-full h-12 text-base font-semibold"
        >
          <Home className="size-5 mr-2" />
          Back to Home
        </Button>
      </motion.div>
    </div>
  );
});

export default memo(NotFoundInner);
