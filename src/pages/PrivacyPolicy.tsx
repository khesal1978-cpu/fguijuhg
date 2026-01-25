import { forwardRef, memo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, Eye, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicyInner = forwardRef<HTMLDivElement, object>(function PrivacyPolicy(_, ref) {
  const navigate = useNavigate();

  return (
    <div ref={ref} className="px-4 py-6 pb-32 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-xl bg-white/[0.08] border border-white/[0.1]"
          onClick={() => navigate("/settings")}
        >
          <ArrowLeft className="size-5 text-foreground" />
        </Button>
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="card-dark p-5 space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Data Usage */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-primary" />
            <h2 className="text-base font-display font-semibold text-foreground">Data We Collect</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Account Information:</strong> Email address, display name, and referral codes.</p>
            <p><strong>Device Data:</strong> Device type, operating system, and app version for optimization.</p>
            <p><strong>Usage Analytics:</strong> Mining sessions, game plays, and feature interactions to improve the app.</p>
            <p><strong>Face Verification (Optional):</strong> Used for identity verification and security. Processed securely and not stored permanently.</p>
          </div>
        </section>

        {/* Storage & Encryption */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-gold" />
            <h2 className="text-base font-display font-semibold text-foreground">Storage & Encryption</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• All data is encrypted in transit using TLS 1.3 encryption.</p>
            <p>• Sensitive data is encrypted at rest using AES-256 encryption.</p>
            <p>• Passwords are hashed using industry-standard bcrypt algorithms.</p>
            <p>• We use secure cloud infrastructure with regular security audits.</p>
            <p>• Backups are encrypted and stored in geographically distributed locations.</p>
          </div>
        </section>

        {/* How We Use Data */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="size-4 text-accent-foreground" />
            <h2 className="text-base font-display font-semibold text-foreground">How We Use Your Data</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>1. <strong>Service Delivery:</strong> To provide mining, games, and referral features.</p>
            <p>2. <strong>Security:</strong> To prevent fraud and protect your account.</p>
            <p>3. <strong>Improvements:</strong> To enhance app performance and user experience.</p>
            <p>4. <strong>Communications:</strong> To send important updates about your account.</p>
            <p>5. <strong>Compliance:</strong> To meet legal and regulatory requirements.</p>
          </div>
        </section>

        {/* User Rights */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-success" />
            <h2 className="text-base font-display font-semibold text-foreground">Your Rights</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Access:</strong> Request a copy of your personal data at any time.</p>
            <p><strong>Correction:</strong> Update or correct inaccurate information.</p>
            <p><strong>Deletion:</strong> Request account and data deletion (subject to legal requirements).</p>
            <p><strong>Portability:</strong> Export your data in a machine-readable format.</p>
            <p><strong>Objection:</strong> Opt-out of marketing communications.</p>
          </div>
        </section>

        {/* Data Protection Compliance */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-muted-foreground" />
            <h2 className="text-base font-display font-semibold text-foreground">Compliance</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>We comply with applicable data protection regulations including:</p>
            <p>• General Data Protection Regulation (GDPR)</p>
            <p>• California Consumer Privacy Act (CCPA)</p>
            <p>• Other applicable regional privacy laws</p>
          </div>
        </section>

        {/* Contact */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-display font-semibold text-foreground">Contact Us</h2>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>For privacy-related inquiries, contact us at:</p>
            <p className="text-primary mt-1">privacy@pingcaset.com</p>
          </div>
        </section>
      </motion.div>

      <p className="text-center text-xs text-muted-foreground">
        Your privacy is important to us.
      </p>
    </div>
  );
});

export default memo(PrivacyPolicyInner);
