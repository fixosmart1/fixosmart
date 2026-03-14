import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useMyJobs, useUpdateJob, useServices } from "@/hooks/use-api";
import {
  Briefcase, MapPin, Calendar, Phone, Mail, User, Zap, Droplet,
  Cpu, ShieldCheck, Wind, Wrench, Clock, CheckCircle, AlertCircle,
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
  { key: "all",        label: "All Orders" },
  { key: "pending",    label: "Pending" },
  { key: "accepted",   label: "Accepted" },
  { key: "inprogress", label: "In Progress" },
  { key: "completed",  label: "Completed" },
  { key: "cancelled",  label: "Cancelled" },
];

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

function filterJobs(jobs: any[], tab: string) {
  if (tab === "all")        return jobs;
  if (tab === "pending")    return jobs.filter(j => j.status === "pending");
  if (tab === "accepted")   return jobs.filter(j => j.status === "accepted");
  if (tab === "inprogress") return jobs.filter(j => ["on_the_way", "arrived"].includes(j.status));
  if (tab === "completed")  return jobs.filter(j => j.status === "completed");
  if (tab === "cancelled")  return jobs.filter(j => j.status === "cancelled");
  return jobs;
}

function getActions(status: string) {
  if (status === "pending")    return [
    { label: "Accept",          next: "accepted",   style: "bg-blue-500 text-white hover:bg-blue-600" },
    { label: "Reject",          next: "cancelled",  style: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" },
  ];
  if (status === "accepted")   return [
    { label: "Start Job",       next: "on_the_way", style: "bg-purple-500 text-white hover:bg-purple-600" },
    { label: "Cancel",          next: "cancelled",  style: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" },
  ];
  if (status === "on_the_way") return [
    { label: "Mark Arrived",    next: "arrived",    style: "bg-indigo-500 text-white hover:bg-indigo-600" },
  ];
  if (status === "arrived")    return [
    { label: "Mark Completed",  next: "completed",  style: "bg-emerald-500 text-white hover:bg-emerald-600" },
  ];
  return [];
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function JobCard({ job, services, onAction, isUpdating }: { job: any; services: any[]; onAction: (id: number, next: string) => void; isUpdating: boolean }) {
  const service = services.find(s => s.id === job.serviceId);
  const Icon = CAT_ICONS[service?.category] || Wrench;
  const actions = getActions(job.status);

  const formatDate = (d: string) => {
    try { return format(new Date(d), "MMM dd, yyyy"); } catch { return d; }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      data-testid={`card-job-${job.id}`}
      className="glass rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-200"
    >
      <div className="p-4 sm:p-5">

        {/* Header Row */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="font-bold leading-tight">{service?.nameEn || `Booking #${job.id}`}</p>
                {job.totalAmountSar && (
                  <p className="text-primary font-bold text-sm">{job.totalAmountSar} SAR</p>
                )}
              </div>
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${STATUS_BADGE[job.status] || 'bg-muted text-muted-foreground border border-border'}`}>
                {STATUS_LABEL[job.status] || job.status}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin size={13} className="text-primary shrink-0" />
            <span className="truncate">{job.district}, {job.city || "Jeddah"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-primary shrink-0" />
            <span>{formatDate(job.bookingDate)} · {job.bookingTime}</span>
          </div>
          {job.address && (
            <div className="flex items-center gap-2 sm:col-span-2">
              <MapPin size={13} className="shrink-0" />
              <span className="truncate">{job.address}</span>
            </div>
          )}
          {job.notes && (
            <div className="flex items-start gap-2 sm:col-span-2 italic">
              <Wrench size={13} className="shrink-0 mt-0.5" />
              <span>{job.notes}</span>
            </div>
          )}
        </div>

        {/* Customer */}
        <div className="rounded-xl bg-muted/40 border border-border p-3 mb-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <User size={10} /> Customer
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
              <span className="text-xs text-muted-foreground">No phone on file</span>
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

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex gap-2.5">
            {actions.map(a => (
              <button
                key={a.next}
                data-testid={`button-${a.next === "cancelled" ? "reject" : "action"}-${job.id}`}
                onClick={() => onAction(job.id, a.next)}
                disabled={isUpdating}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${a.style}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
        {job.status === "completed" && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
            <CheckCircle size={14} /> Completed successfully
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: string }) {
  const msgs: Record<string, { icon: any; title: string; sub: string }> = {
    all:        { icon: Briefcase,   title: "No orders yet",          sub: "Your assigned orders will appear here" },
    pending:    { icon: Clock,       title: "No pending orders",      sub: "New assignments will appear here" },
    accepted:   { icon: Briefcase,   title: "No accepted orders",     sub: "Accept a pending order to see it here" },
    inprogress: { icon: Zap,         title: "No jobs in progress",    sub: "Start an accepted job to see it here" },
    completed:  { icon: CheckCircle, title: "No completed jobs yet",  sub: "Completed jobs will appear here" },
    cancelled:  { icon: AlertCircle, title: "No cancelled orders",    sub: "Cancelled orders will appear here" },
  };
  const m = msgs[tab] || msgs["all"];
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

export function TechnicianJobs() {
  const { t } = useLanguage();
  const { data: jobs = [], isLoading } = useMyJobs();
  const { data: services = [] } = useServices();
  const updateJob = useUpdateJob();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");

  const tabJobs = filterJobs(jobs as any[], activeTab);

  const handleAction = async (id: number, status: string) => {
    try {
      await updateJob.mutateAsync({ id, status });
      const labels: Record<string, string> = {
        accepted: "Job accepted!", on_the_way: "On the way!", arrived: "Arrived!",
        completed: "Job completed!", cancelled: "Cancelled",
      };
      toast({ title: labels[status] || "Updated", description: `Booking #${id} → ${STATUS_LABEL[status] || status}` });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5 pb-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center">
          <Briefcase className="text-blue-500" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("my_jobs")}</h1>
          <p className="text-muted-foreground text-sm">{(jobs as any[]).length} total orders</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-none border-b border-border bg-muted/30">
          {TABS.map(tab => {
            const count = filterJobs(jobs as any[], tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                data-testid={`tab-jobs-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold shrink-0 border-b-2 transition-all ${
                  isActive
                    ? "border-primary text-primary bg-background"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
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

        {/* Job list */}
        <div className="p-4 sm:p-5">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : tabJobs.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {tabJobs.map(job => (
                  <JobCard
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
    </div>
  );
}
