import { motion } from "framer-motion";
import { ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TermsConditions() {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
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
          <h1 className="text-xl font-display font-bold text-foreground">Terms & Conditions</h1>
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
        {/* Mining Rules */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h2 className="text-base font-display font-semibold text-foreground">Mining Rules</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>1. Each mining session lasts 4 hours. You must claim rewards before starting a new session.</p>
            <p>2. Mining power affects your earning rate. Increase it through referrals and completing tasks.</p>
            <p>3. Coins earned are added to your balance upon claiming.</p>
            <p>4. Only one active mining session is allowed per account at a time.</p>
            <p>5. Abandoned sessions (not claimed within 24 hours) may be forfeited.</p>
          </div>
        </section>

        {/* Referral Conditions */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-gold" />
            <h2 className="text-base font-display font-semibold text-foreground">Referral & Reward Conditions</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>1. Share your unique referral code with friends to earn rewards.</p>
            <p>2. When someone signs up using your code: you earn 50 coins (direct referral).</p>
            <p>3. When your referral invites someone: you earn 25 coins (indirect referral).</p>
            <p>4. The invited friend receives 100 coins as a welcome bonus.</p>
            <p>5. Referral rewards are credited immediately upon successful signup.</p>
            <p>6. Self-referrals or fake accounts will result in immediate disqualification.</p>
            <p>7. Maximum of 100 direct referrals per account. Contact support for exceptions.</p>
          </div>
        </section>

        {/* Account Suspension */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-destructive" />
            <h2 className="text-base font-display font-semibold text-foreground">Account Suspension Policies</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Your account may be suspended or terminated for:</p>
            <p>• Creating multiple accounts to abuse referral rewards</p>
            <p>• Using bots, scripts, or automation tools</p>
            <p>• Exploiting bugs or glitches for unfair advantage</p>
            <p>• Engaging in any form of fraud or deceptive practices</p>
            <p>• Violating any terms outlined in this agreement</p>
          </div>
        </section>

        {/* Fraud & Abuse */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-accent-foreground" />
            <h2 className="text-base font-display font-semibold text-foreground">Fraud & Abuse Handling</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>1. All accounts are monitored for suspicious activity.</p>
            <p>2. Detected fraud results in immediate account suspension.</p>
            <p>3. All accumulated coins may be forfeited without notice.</p>
            <p>4. We reserve the right to modify rewards to prevent abuse.</p>
            <p>5. Decisions regarding fraud are final and non-negotiable.</p>
            <p>6. Report suspected abuse to support@pingcaset.com.</p>
          </div>
        </section>

        {/* General Terms */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <h2 className="text-base font-display font-semibold text-foreground">General Terms</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• We reserve the right to modify these terms at any time.</p>
            <p>• Continued use of the app constitutes acceptance of any changes.</p>
            <p>• Coin values and rewards are subject to change without prior notice.</p>
            <p>• PingCaset is not responsible for losses due to user negligence.</p>
          </div>
        </section>
      </motion.div>

      <p className="text-center text-xs text-muted-foreground">
        By using PingCaset, you agree to these terms.
      </p>
    </div>
  );
}
