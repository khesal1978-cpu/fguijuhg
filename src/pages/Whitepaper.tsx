import { motion } from "framer-motion";
import { ArrowLeft, Coins, Users, Zap, Shield, Wallet, TrendingUp, Target, AlertTriangle, Download, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const sections = [
  {
    id: "abstract",
    title: "Abstract",
    icon: Target,
    content: `PingCaset is a mobile-first digital asset ecosystem designed to enable fair and accessible token earning through time-based participation rather than hardware-intensive mining. The platform focuses on controlled token emissions, real user activity, and long-term sustainability while preparing for future blockchain integration and public exchange listings.`
  },
  {
    id: "problem",
    title: "Problem Statement",
    icon: AlertTriangle,
    content: `Most crypto earning platforms suffer from:`,
    list: [
      "High entry barriers (hardware, capital, energy)",
      "Bot farming and fake accounts",
      "Uncontrolled inflation",
      "Referral abuse",
      "Lack of transparency in reward logic"
    ]
  },
  {
    id: "solution",
    title: "PingCaset Solution",
    icon: Zap,
    content: `PingCaset introduces a human-centric earning model:`,
    list: [
      "Time-based mining with fixed cycles",
      "Manual session activation",
      "Invite-based mining boosts using active users only",
      "Strong emission caps",
      "Modular security that scales with adoption"
    ]
  },
  {
    id: "mining",
    title: "Time-Based Mining",
    icon: Coins,
    content: `Mining does not depend on device power. Each mining session lasts 6 hours. Users can mine up to 4 sessions per day. Each session must be manually activated.`,
    highlight: {
      label: "Base Mining Reward",
      value: "10 CASET per session",
      sub: "Maximum: 40 CASET per day (without boosts)"
    }
  },
  {
    id: "multiplier",
    title: "Mining Rate Boost",
    icon: TrendingUp,
    content: `Mining rewards increase based on the number of ACTIVE referrals. An active referral must have registered using an invite code, completed at least one mining session, and have mined within the last 48 hours.`,
    table: [
      { referrals: "0", multiplier: "1.0×" },
      { referrals: "1-2", multiplier: "1.2×" },
      { referrals: "3-5", multiplier: "1.7×" },
      { referrals: "6-10", multiplier: "2.0×" },
      { referrals: "11+", multiplier: "2.5× (MAX)" }
    ]
  },
  {
    id: "referral",
    title: "Referral Rewards",
    icon: Users,
    content: `2-Tier Referral System: Direct referral (Level 1) earns you 50 CASET. Indirect referral (Level 2) earns you 25 CASET when your referrals invite friends. The invited friend receives 100 CASET welcome bonus. Rewards are issued immediately upon signup. This prevents fake or inactive referrals.`
  },
  {
    id: "tokenomics",
    title: "Token Economics",
    icon: Wallet,
    content: `Total CASET Supply: 50,000,000,000 (50 Billion). The supply is capped and non-inflationary.`,
    allocation: [
      { category: "User Mining Rewards", percent: "40%", amount: "20B" },
      { category: "Referral Rewards", percent: "15%", amount: "7.5B" },
      { category: "Games & Engagement", percent: "5%", amount: "2.5B" },
      { category: "Team & Founders", percent: "10%", amount: "5B" },
      { category: "Ecosystem & Partnerships", percent: "10%", amount: "5B" },
      { category: "Liquidity & Exchange", percent: "10%", amount: "5B" },
      { category: "Reserve / Treasury", percent: "10%", amount: "5B" }
    ]
  },
  {
    id: "security",
    title: "Authentication & Security",
    icon: Shield,
    content: `Current Phase Security includes Gmail + Password login, Email verification, Device-level abuse prevention, and Server-side reward validation. Advanced biometric verification is planned for later phases, especially before withdrawals or exchange listings.`
  }
];

const generateWhitepaperText = () => {
  let text = `============================================================
PINGCASET (CASET) WHITE PAPER
============================================================

Version: 1.1
Status: Public
Token Symbol: CASET
Total Supply: 50,000,000,000 CASET
Mining Model: Time-Based (4 Sessions / Day)

============================================================

`;

  sections.forEach((section) => {
    text += `------------------------------------------------------------
${section.title.toUpperCase()}
------------------------------------------------------------

${section.content}

`;
    if (section.list) {
      section.list.forEach((item) => {
        text += `• ${item}\n`;
      });
      text += "\n";
    }
    if (section.highlight) {
      text += `${section.highlight.label}: ${section.highlight.value}
${section.highlight.sub}

`;
    }
    if (section.table) {
      text += `Active Referrals | Multiplier
-----------------|------------
`;
      section.table.forEach((row) => {
        text += `${row.referrals.padEnd(17)}| ${row.multiplier}\n`;
      });
      text += "\n";
    }
    if (section.allocation) {
      text += `Category                         | Allocation
---------------------------------|------------
`;
      section.allocation.forEach((item) => {
        text += `${item.category.padEnd(33)}| ${item.percent} (${item.amount})\n`;
      });
      text += "\n";
    }
  });

  text += `------------------------------------------------------------
DISCLAIMER
------------------------------------------------------------

PingCaset and CASET tokens are not investment products.
They do not represent equity, dividends, or guaranteed returns.
Exchange listings are subject to external approval and cannot be guaranteed.
Users are responsible for complying with local laws and regulations.

============================================================
END OF WHITE PAPER
============================================================`;

  return text;
};

export default function Whitepaper() {
  const handleDownload = () => {
    const content = generateWhitepaperText();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PingCaset_Whitepaper_v1.1.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Whitepaper downloaded!");
  };

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
          <Link to="/settings" className="p-2.5 -ml-2 bg-white/[0.08] border border-white/[0.1] rounded-xl hover:bg-white/[0.12] transition-colors">
              <ArrowLeft className="size-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">CASET Whitepaper</h1>
              <p className="text-xs text-muted-foreground">Version 1.1 • Token Symbol: CASET</p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleDownload}
            className="gap-1.5 bg-white/[0.08] border-white/[0.15] text-foreground hover:bg-white/[0.12]"
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Hero Card */}
        <motion.div
          className="card-dark p-6 text-center space-y-4 border-primary/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="size-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
            <Coins className="size-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">PINGCASET</h2>
            <p className="text-sm text-primary font-medium">CASET Token</p>
          </div>
          <div className="flex justify-center gap-6 pt-2">
            <div>
              <p className="text-2xl font-display font-bold text-foreground">50B</p>
              <p className="text-xs text-muted-foreground">Total Supply</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="text-2xl font-display font-bold text-foreground">4</p>
              <p className="text-xs text-muted-foreground">Sessions/Day</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="text-2xl font-display font-bold text-foreground">10</p>
              <p className="text-xs text-muted-foreground">CASET/Session</p>
            </div>
          </div>
        </motion.div>

        {/* Download Button - Mobile Prominent */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button 
            className="w-full h-12 gap-2"
            onClick={handleDownload}
          >
            <FileText className="size-5" />
            Download Whitepaper
            <Download className="size-4" />
          </Button>
        </motion.div>

        {/* Sections */}
        {sections.map((section, i) => (
          <motion.div
            key={section.id}
            className="card-dark p-5 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 1) * 0.05 }}
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <section.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground">{section.title}</h3>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>

            {section.list && (
              <ul className="space-y-2 pl-1">
                {section.list.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {section.highlight && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">{section.highlight.label}</p>
                <p className="text-xl font-display font-bold text-primary">{section.highlight.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{section.highlight.sub}</p>
              </div>
            )}

            {section.table && (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="grid grid-cols-2 text-xs font-medium text-muted-foreground bg-muted/50 px-4 py-2">
                  <span>Active Referrals</span>
                  <span className="text-right">Multiplier</span>
                </div>
                {section.table.map((row, j) => (
                  <div key={j} className="grid grid-cols-2 text-sm px-4 py-2.5 border-t border-border">
                    <span className="text-foreground">{row.referrals}</span>
                    <span className="text-right font-medium text-primary">{row.multiplier}</span>
                  </div>
                ))}
              </div>
            )}

            {section.allocation && (
              <div className="space-y-2">
                {section.allocation.map((item, j) => (
                  <div key={j} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                    <span className="text-foreground">{item.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{item.amount}</span>
                      <span className="font-medium text-primary w-12 text-right">{item.percent}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}

        {/* Disclaimer */}
        <motion.div
          className="card-dark p-5 border-destructive/20 bg-destructive/5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="size-5 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Disclaimer</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            PingCaset and CASET tokens are not investment products. They do not represent equity, dividends, or guaranteed returns. Exchange listings are subject to external approval and cannot be guaranteed. Users are responsible for complying with local laws and regulations.
          </p>
        </motion.div>

        {/* Bottom Download */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button 
            variant="outline"
            className="w-full h-12 gap-2 bg-white/[0.08] border-white/[0.15] text-foreground hover:bg-white/[0.12]"
            onClick={handleDownload}
          >
            <Download className="size-4 text-foreground" />
            Save Whitepaper for Offline Reading
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
