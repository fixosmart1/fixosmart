import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-api";
import { ShieldCheck, Clock, Eye, XCircle, CheckCircle, ArrowRight, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

function useVerifyStatus() {
  return useQuery<any>({ queryKey: ['/api/verify/status'] });
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    gradientClass: "from-orange-500 to-amber-500",
    title: "Application Under Review",
    subtitle: "We've received your application and will review it shortly.",
    steps: [
      { label: "Application submitted", done: true },
      { label: "Under review by admin", done: false },
      { label: "Decision made", done: false },
      { label: "Account activated", done: false },
    ],
  },
  under_review: {
    icon: Eye,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    gradientClass: "from-blue-500 to-cyan-500",
    title: "Being Reviewed",
    subtitle: "Our team is actively reviewing your documents and qualifications.",
    steps: [
      { label: "Application submitted", done: true },
      { label: "Under review by admin", done: true },
      { label: "Decision made", done: false },
      { label: "Account activated", done: false },
    ],
  },
  approved: {
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    gradientClass: "from-green-500 to-emerald-500",
    title: "Approved! Welcome aboard",
    subtitle: "Your application has been approved. You can now access your technician dashboard.",
    steps: [
      { label: "Application submitted", done: true },
      { label: "Under review by admin", done: true },
      { label: "Decision made", done: true },
      { label: "Account activated", done: true },
    ],
  },
  rejected: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    gradientClass: "from-red-500 to-rose-500",
    title: "Application Not Approved",
    subtitle: "Unfortunately, your application was not approved at this time. See notes below.",
    steps: [
      { label: "Application submitted", done: true },
      { label: "Under review by admin", done: true },
      { label: "Decision made", done: true },
      { label: "Account activated", done: false },
    ],
  },
};

export function VerificationStatus() {
  const { data: user } = useAuth();
  const { data: status, isLoading } = useVerifyStatus();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && status) {
      if (status.status === null && !status.hasApplication) {
        setLocation("/technician/apply");
      } else if (status.status === "approved") {
        // Allow staying on page to see approved state; also show go-to-dashboard
      }
    }
  }, [status, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentStatus = status?.status || "pending";
  const config = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12">

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${config.gradientClass} rounded-3xl p-8 text-white text-center relative overflow-hidden`}
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute left-4 -bottom-6 w-20 h-20 rounded-full bg-white/5" />
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="relative z-10"
        >
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Icon size={36} />
          </div>
          <h1 className="text-xl font-bold">{config.title}</h1>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">{config.subtitle}</p>
        </motion.div>
      </motion.div>

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass rounded-2xl p-5"
      >
        <h2 className="font-bold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Application Progress</h2>
        <div className="space-y-3">
          {config.steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                s.done ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {s.done ? <CheckCircle size={14} /> : <span className="text-xs font-bold">{i + 1}</span>}
              </div>
              <div className={`flex-1 h-px ${s.done ? "bg-green-500/40" : "bg-border"}`} />
              <span className={`text-sm font-medium ${s.done ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Admin Notes (if rejected or under_review with notes) */}
      {status?.adminNotes && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`glass rounded-2xl p-5 border ${currentStatus === 'rejected' ? 'border-red-500/20' : 'border-blue-500/20'}`}
        >
          <h2 className="font-bold text-sm flex items-center gap-2 mb-3">
            <MessageCircle size={15} className="text-primary" /> Admin Notes
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{status.adminNotes}</p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-3"
      >
        {currentStatus === "approved" && (
          <Link href="/technician/dashboard">
            <button
              data-testid="button-goto-dashboard"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl gradient-primary text-white font-bold"
            >
              Go to My Dashboard <ArrowRight size={18} />
            </button>
          </Link>
        )}
        <Link href="/">
          <button className="w-full py-3.5 rounded-2xl border border-border font-semibold text-sm hover:bg-muted/50 transition-colors">
            Back to Home
          </button>
        </Link>
      </motion.div>

      {/* What to expect info */}
      {(currentStatus === "pending" || currentStatus === "under_review") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5"
        >
          <h2 className="font-bold text-sm mb-3">What happens next?</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">→</span> Our team reviews your documents and credentials</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">→</span> You may be contacted for additional information</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">→</span> Typically reviewed within 1–2 business days</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">→</span> Once approved, your dashboard will be fully unlocked</li>
          </ul>
        </motion.div>
      )}
    </div>
  );
}
