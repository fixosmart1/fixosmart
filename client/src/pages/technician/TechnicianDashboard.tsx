import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth, useMyJobs, useMyEarnings, useTechnicians, useServices, useUpdateJob, useLogout } from "@/hooks/use-api";
import { Link } from "wouter";
import {
  Briefcase, TrendingUp, CheckCircle, Clock, Star, MapPin, Calendar,
  Phone, Mail, User, Zap, Droplet, Cpu, ShieldCheck, Wind, Wrench,
  AlertCircle, LogOut, Bell, Edit2, ToggleLeft, ToggleRight, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_ICONS: Record<string, any> = {
  AC: Wind, Electric: Zap, Plumbing: Droplet,
  "Smart Home": Cpu, Security: ShieldCheck, Appliance: Wrench,
};

const TABS = [
  { key: "pending",    label: "Pending",    color: "text-orange-600 dark:text-orange-400" },
  { key: "accepted",   label: "Accepted",   color: "text-blue-600 dark:text-blue-400" },
  { key: "inprogress", label: "In Progress",color: "text-purple-600 dark:text-purple-400" },
  { key: "completed",  label: "Completed",  color: "text-green-600 dark:text-green-400" },
  { key: "cancelled",  label: "Cancelled",  color: "text-red-600 dark:text-red-400" },
] as const;

const STATUS_BADGE: Record<string, string> = {
  pending:    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800",
  accepted:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
  on_the_way: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800",
  arrived:    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800",
  completed:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
  cancelled:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", accepted: "Accepted", on_the_way: "On The Way",
  arrived: "Arrived", completed: "Completed", cancelled: "Cancelled",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function filterJobsByTab(jobs: any[], tab: string) {
  if (tab === "pending")    return jobs.filter(j => j.status === "pending");
  if (tab === "accepted")   return jobs.filter(j => j.status === "accepted");
  if (tab === "inprogress") return jobs.filter(j => ["on_the_way", "arrived"].includes(j.status));
  if (tab === "completed")  return jobs.filter(j => j.status === "completed");
  if (tab === "cancelled")  return jobs.filter(j => j.status === "cancelled");
  return jobs;
}

function getActions(status: string): { label: string; next: string; color: string }[] {
  if (status === "pending")    return [
    { label: "Accept",     next: "accepted",   color: "bg-blue-500 text-white hover:bg-blue-600" },
    { label: "Reject",     next: "cancelled",  color: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" },
  ];
  if (status === "accepted")   return [
    { label: "Start Job",  next: "on_the_way", color: "bg-purple-500 text-white hover:bg-purple-600" },
    { label: "Cancel",     next: "cancelled",  color: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" },
  ];
  if (status === "on_the_way") return [
    { label: "Mark Arrived", next: "arrived",  color: "bg-indigo-500 text-white hover:bg-indigo-600" },
  ];
  if (status === "arrived")    return [
    { label: "Mark Completed", next: "completed", color: "bg-emerald-500 text-white hover:bg-emerald-600" },
  ];
  return [];
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ job, services, onAction, isUpdating }: { job: any; services: any[]; onAction: (id: number, status: string) => void; isUpdating: boolean }) {
  const service = services.find(s => s.id === job.serviceId);
  const Icon = CAT_ICONS[service?.category] || Wrench;
  const actions = getActions(job.status);

  const formatDate = (d: string) => {
    try { return format(new Date(d), "MMM dd, yyyy"); } catch { return d; }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={`card-job-${job.id}`}
      className="glass rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-200"
    >
      {/* Card Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-4">
          {/* Service Icon */}
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-bold leading-tight">
                  {service?.nameEn || `Service Booking #${job.id}`}
                </h3>
                {job.totalAmountSar && (
                  <span className="text-primary font-bold text-sm">{job.totalAmountSar} SAR</span>
                )}
              </div>
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${STATUS_BADGE[job.status] || 'bg-muted text-muted-foreground border border-border'}`}>
                {STATUS_LABEL[job.status] || job.status}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={13} className="text-primary shrink-0" />
            <span className="truncate">{job.district}, {job.city || "Jeddah"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar size={13} className="text-primary shrink-0" />
            <span>{formatDate(job.bookingDate)} · {job.bookingTime}</span>
          </div>
          {job.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
              <MapPin size={13} className="text-muted-foreground shrink-0" />
              <span className="truncate">{job.address}</span>
            </div>
          )}
          {job.notes && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground sm:col-span-2 italic">
              <Wrench size={13} className="shrink-0 mt-0.5" />
              <span>{job.notes}</span>
            </div>
          )}
        </div>

        {/* Customer Panel */}
        <div className="rounded-xl bg-muted/40 border border-border p-3 mb-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <User size={10} /> Customer Info
          </p>
          <p className="font-semibold text-sm">{job.customerName || "Guest"}</p>
          <div className="flex flex-wrap gap-3 mt-1.5">
            {job.customerPhone ? (
              <a
                href={`tel:${job.customerPhone}`}
                data-testid={`link-call-${job.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Phone size={11} /> {job.customerPhone}
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">No phone</span>
            )}
            {job.customerEmail && (
              <a
                href={`mailto:${job.customerEmail}`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:underline"
              >
                <Mail size={11} /> {job.customerEmail}
              </a>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="flex gap-2.5">
            {actions.map(a => (
              <button
                key={a.next}
                data-testid={`button-${a.next === 'cancelled' ? 'reject' : 'action'}-${job.id}`}
                onClick={() => onAction(job.id, a.next)}
                disabled={isUpdating}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${a.color}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
        {job.status === "completed" && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
            <CheckCircle size={15} /> Job completed successfully
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: string }) {
  const msgs: Record<string, { icon: any; title: string; sub: string }> = {
    pending:    { icon: Clock,        title: "No pending orders",      sub: "New assignments will appear here" },
    accepted:   { icon: Briefcase,    title: "No accepted jobs",       sub: "Accept pending orders to see them here" },
    inprogress: { icon: Zap,          title: "No jobs in progress",    sub: "Start an accepted job to track it here" },
    completed:  { icon: CheckCircle,  title: "No completed jobs yet",  sub: "Completed jobs will appear here" },
    cancelled:  { icon: AlertCircle,  title: "No cancelled jobs",      sub: "Cancelled orders will appear here" },
  };
  const m = msgs[tab] || msgs["pending"];
  const Icon = m.icon;
  return (
    <div className="text-center py-14 text-muted-foreground">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <Icon size={28} className="opacity-40" />
      </div>
      <p className="font-semibold text-foreground">{m.title}</p>
      <p className="text-sm mt-1">{m.sub}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TechnicianDashboard() {
  const { t } = useLanguage();
  const { data: user } = useAuth();
  const { data: jobs = [], isLoading } = useMyJobs();
  const { data: earnings } = useMyEarnings();
  const { data: allTechs = [] } = useTechnicians();
  const { data: services = [] } = useServices();
  const updateJob = useUpdateJob();
  const logout = useLogout();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("pending");

  // Find this technician's profile
  const myTech = (allTechs as any[]).find((t: any) => t.userId === user?.id);

  // Stats
  const pendingCount    = (jobs as any[]).filter(j => j.status === "pending").length;
  const activeCount     = (jobs as any[]).filter(j => ["accepted", "on_the_way", "arrived"].includes(j.status)).length;
  const completedCount  = (jobs as any[]).filter(j => j.status === "completed").length;
  const rating          = myTech ? Number(myTech.rating || 0).toFixed(1) : (earnings as any)?.rating || "—";

  const tabJobs = filterJobsByTab(jobs as any[], activeTab);

  const handleAction = async (id: number, status: string) => {
    try {
      await updateJob.mutateAsync({ id, status });
      const labels: Record<string, string> = {
        accepted: "Job accepted!", on_the_way: "On the way!", arrived: "Arrived!",
        completed: "Job completed!", cancelled: "Job cancelled",
      };
      toast({ title: labels[status] || "Status updated", description: `Booking #${id} updated` });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    try { await logout.mutateAsync(); } catch (_) {}
    window.location.href = "/profile";
  };

  const stats = [
    { icon: Clock,       label: "Pending",   value: pendingCount,   color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { icon: Briefcase,   label: "Active",    value: activeCount,    color: "text-blue-500",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
    { icon: CheckCircle, label: "Completed", value: completedCount, color: "text-green-500",  bg: "bg-green-500/10",  border: "border-green-500/20" },
    { icon: Star,        label: "Rating",    value: rating,         color: "text-amber-500",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  ];

  return (
    <div className="space-y-6 pb-8">

      {/* ── Profile Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-primary rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute right-12 -bottom-6 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative z-10 flex items-start justify-between gap-3 flex-wrap">
          {/* Left: Avatar + info */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.fullName}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white/30"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
                  {user?.fullName?.charAt(0).toUpperCase() || "T"}
                </div>
              )}
              {/* Online dot */}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold leading-tight">{user?.fullName || "Technician"}</h1>
              {myTech && (
                <p className="text-white/80 text-sm font-medium">{myTech.specialization} Specialist</p>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                <Star size={12} className="fill-amber-300 text-amber-300" />
                <span className="text-white/90 text-xs font-semibold">{rating} rating</span>
                <span className="text-white/50 text-xs">· {completedCount} jobs done</span>
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              title="Notifications"
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors relative"
            >
              <Bell size={16} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <Link href="/profile">
              <button title="Edit Profile" className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                <Edit2 size={15} />
              </button>
            </Link>
            <button
              data-testid="button-header-logout"
              onClick={handleLogout}
              title="Logout"
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-red-500/60 flex items-center justify-center transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Availability badge */}
        {myTech && (
          <div className="relative z-10 mt-4 flex items-center gap-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
              myTech.isAvailable ? "bg-green-400/20 text-green-100" : "bg-white/10 text-white/60"
            }`}>
              {myTech.isAvailable ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              {myTech.isAvailable ? "Available for jobs" : "Currently unavailable"}
            </div>
            {pendingCount > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-orange-400/20 text-orange-100 px-3 py-1.5 rounded-full text-xs font-semibold">
                <Clock size={12} /> {pendingCount} pending order{pendingCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`glass rounded-2xl p-4 border ${s.border} hover:shadow-md transition-shadow`}
          >
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon size={17} className={s.color} />
            </div>
            <div className="text-2xl font-bold leading-none">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Order Management ───────────────────────────────────────────────── */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Tab bar */}
        <div className="flex overflow-x-auto scrollbar-none border-b border-border bg-muted/30">
          {TABS.map(tab => {
            const count = filterJobsByTab(jobs as any[], tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                data-testid={`tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold shrink-0 border-b-2 transition-all ${
                  isActive
                    ? `border-primary text-primary bg-background`
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Job cards */}
        <div className="p-4 sm:p-5">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : tabJobs.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {tabJobs.map(job => (
                  <OrderCard
                    key={job.id}
                    job={job}
                    services={services as any[]}
                    onAction={handleAction}
                    isUpdating={updateJob.isPending}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Links ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/technician/earnings">
          <div className="glass rounded-2xl p-4 cursor-pointer hover:-translate-y-0.5 transition-all border border-green-500/20 hover:border-green-500/40 group">
            <TrendingUp size={22} className="text-green-500 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-semibold text-sm">My Earnings</p>
            <p className="text-xs text-muted-foreground mt-0.5">{(earnings as any)?.total || 0} SAR total</p>
          </div>
        </Link>
        <Link href="/profile">
          <div className="glass rounded-2xl p-4 cursor-pointer hover:-translate-y-0.5 transition-all border border-blue-500/20 hover:border-blue-500/40 group">
            <User size={22} className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-semibold text-sm">Edit Profile</p>
            <p className="text-xs text-muted-foreground mt-0.5">Update your info</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
