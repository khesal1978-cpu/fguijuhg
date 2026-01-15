import { motion } from "framer-motion";

export function ParticlesBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Large morphing blobs */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-primary/8 to-accent/12 rounded-full blur-3xl animate-morph" />
      <div className="absolute -bottom-48 -left-32 w-[400px] h-[400px] bg-gradient-to-tr from-accent-foreground/8 to-primary/6 rounded-full blur-3xl animate-morph-reverse" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-2xl animate-float" />
      
      {/* Floating particles - scattered across viewport */}
      {[
        { top: "8%", left: "12%", size: "w-2 h-2", opacity: "bg-primary/25", delay: "0s" },
        { top: "15%", right: "18%", size: "w-3 h-3", opacity: "bg-accent-foreground/20", delay: "0.5s" },
        { top: "25%", left: "5%", size: "w-1.5 h-1.5", opacity: "bg-primary/35", delay: "1s" },
        { top: "35%", right: "8%", size: "w-2.5 h-2.5", opacity: "bg-accent-foreground/15", delay: "1.5s" },
        { top: "45%", left: "22%", size: "w-2 h-2", opacity: "bg-primary/20", delay: "2s" },
        { top: "55%", right: "25%", size: "w-1.5 h-1.5", opacity: "bg-accent-foreground/30", delay: "0.8s" },
        { top: "65%", left: "35%", size: "w-3 h-3", opacity: "bg-primary/15", delay: "1.2s" },
        { top: "12%", left: "55%", size: "w-2 h-2", opacity: "bg-accent-foreground/25", delay: "1.8s" },
        { top: "50%", left: "65%", size: "w-1.5 h-1.5", opacity: "bg-primary/30", delay: "0.3s" },
        { top: "75%", right: "12%", size: "w-2.5 h-2.5", opacity: "bg-accent-foreground/20", delay: "2.2s" },
        { top: "80%", left: "8%", size: "w-2 h-2", opacity: "bg-primary/25", delay: "1.4s" },
        { top: "90%", left: "45%", size: "w-1.5 h-1.5", opacity: "bg-accent-foreground/35", delay: "0.6s" },
      ].map((particle, i) => (
        <motion.div
          key={i}
          className={`absolute ${particle.size} ${particle.opacity} rounded-full animate-float`}
          style={{
            top: particle.top,
            left: particle.left,
            right: particle.right,
            animationDelay: particle.delay,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        />
      ))}
      
      {/* Breathing rings - centered */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-primary/5 rounded-full animate-breathe" />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-accent-foreground/5 rounded-full animate-breathe"
        style={{ animationDelay: "2s" }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-primary/8 rounded-full animate-breathe"
        style={{ animationDelay: "1s" }}
      />
      
      {/* Subtle dot grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }} 
      />
      
      {/* Gradient mesh lines */}
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="absolute top-0 left-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-accent-foreground/3 to-transparent" />
      <div className="absolute top-0 right-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="absolute left-0 top-1/3 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
      <div className="absolute left-0 top-2/3 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-foreground/3 to-transparent" />
    </div>
  );
}
