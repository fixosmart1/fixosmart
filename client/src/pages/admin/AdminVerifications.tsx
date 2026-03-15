import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck, Clock, Eye, XCircle, CheckCircle, User, MapPin,
  Briefcase, Star, FileText, Image, Video, MessageCircle,
  ChevronDown, ChevronUp, Phone, Mail, Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const STATUS_BADGE: Record<string, string> = {
  pending:      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800",
  under_review: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
  approved:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
  rejected:     "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", under_review: "Under Review", approved: "Approved", rejected: "Rejected",
};

function ScoreInput({ label, value, onChange }: { label: string; value: number | null; onChange: (n: number) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${
              value === n
                ? "bg-amber-500 text-white border-amber-500"
                : "border-border hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function VerificationCard({ v, onUpdate }: { v: any; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const [adminNotes, setAdminNotes] = useState(v.adminNotes || "");
  const [scoreExperience, setScoreExperience] = useState<number | null>(v.scoreExperience);
  const [scorePortfolio, setScorePortfolio] = useState<number | null>(v.scorePortfolio);
  const [scoreDocument, setScoreDocument] = useState<number | null>(v.scoreDocument);
  const [scoreCommunication, setScoreCommunication] = useState<number | null>(v.scoreCommunication);

  const totalScore = [scoreExperience, scorePortfolio, scoreDocument, scoreCommunication]
    .filter(Boolean).reduce((a, b) => (a || 0) + (b || 0), 0);
  const maxScore = [scoreExperience, scorePortfolio, scoreDocument, scoreCommunication].filter(Boolean).length * 5;

  const updateMut = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/admin/verifications/${v.id}`, data),
    onSuccess: () => {
      toast({ title: "Updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] });
      onUpdate();
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const handleAction = (status: string) => {
    updateMut.mutate({
      status,
      adminNotes,
      scoreExperience,
      scorePortfolio,
      scoreDocument,
      scoreCommunication,
    });
  };

  const formatDate = (d: string) => {
    try { return format(new Date(d), "MMM dd, yyyy"); } catch { return d; }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={`card-verif-${v.id}`}
      className="glass rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all"
    >
      {/* Summary row */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 justify-between flex-wrap">
          {/* Left info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {v.profilePhotoUrl ? (
              <img src={v.profilePhotoUrl} alt={v.fullName} className="w-12 h-12 rounded-xl object-cover border border-border shrink-0" onError={e => (e.currentTarget.style.display='none')} />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <User size={20} className="text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold">{v.fullName}</p>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[v.status] || 'bg-muted text-muted-foreground border border-border'}`}>
                  {STATUS_LABEL[v.status] || v.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Briefcase size={11} /> {v.specialization}</span>
                <span className="flex items-center gap-1"><Clock size={11} /> {v.yearsExperience}y exp</span>
                <span className="flex items-center gap-1"><MapPin size={11} /> {v.city || "Jeddah"}</span>
                {v.createdAt && <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(v.createdAt)}</span>}
              </div>
              {v.phone && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone size={11} /> {v.phone}</p>}
              {v.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail size={11} /> {v.email}</p>}
            </div>
          </div>

          {/* Score badge */}
          {totalScore > 0 && (
            <div className="shrink-0 text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center">
                <Star size={12} className="text-amber-500" />
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{totalScore}/{maxScore}</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick action row (for pending/under_review) */}
        {['pending', 'under_review'].includes(v.status) && !expanded && (
          <div className="flex gap-2 mt-3">
            <button
              data-testid={`button-review-${v.id}`}
              onClick={() => { handleAction('under_review'); }}
              disabled={updateMut.isPending || v.status === 'under_review'}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              Mark Under Review
            </button>
            <button
              data-testid={`button-expand-${v.id}`}
              onClick={() => setExpanded(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 flex items-center gap-1 transition-colors"
            >
              Full Details <ChevronDown size={13} />
            </button>
          </div>
        )}

        {['approved', 'rejected'].includes(v.status) && !expanded && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            {expanded ? <><ChevronUp size={12} /> Hide Details</> : <><ChevronDown size={12} /> View Details</>}
          </button>
        )}
      </div>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border p-5 space-y-5">

              {/* Bio */}
              {v.bio && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Bio</h3>
                  <p className="text-sm leading-relaxed">{v.bio}</p>
                </div>
              )}

              {/* Skills */}
              {v.skills && v.skills.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {v.skills.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Documents</h3>
                <div className="space-y-2">
                  {v.govIdUrl && (
                    <a href={v.govIdUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <FileText size={14} /> Government ID / Iqama
                    </a>
                  )}
                  {v.workCertUrl && (
                    <a href={v.workCertUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <ShieldCheck size={14} /> Work Certificate / License
                    </a>
                  )}
                  {v.videoUrl && (
                    <a href={v.videoUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Video size={14} /> Video Introduction
                    </a>
                  )}
                  {(!v.govIdUrl && !v.workCertUrl && !v.videoUrl) && (
                    <p className="text-sm text-muted-foreground">No document URLs provided</p>
                  )}
                </div>
              </div>

              {/* Portfolio */}
              {v.portfolioUrls && v.portfolioUrls.filter(Boolean).length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Portfolio</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {v.portfolioUrls.filter(Boolean).map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`Portfolio ${i + 1}`}
                          className="w-full aspect-square object-cover rounded-xl border border-border hover:opacity-80 transition-opacity"
                          onError={e => { (e.currentTarget as any).src = ''; (e.currentTarget.parentElement as any).innerHTML = `<div class="w-full aspect-square rounded-xl border border-border flex items-center justify-center text-xs text-muted-foreground bg-muted">Image ${i+1}</div>`; }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Scoring */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Quality Scoring</h3>
                <div className="grid grid-cols-2 gap-4">
                  <ScoreInput label="Experience" value={scoreExperience} onChange={setScoreExperience} />
                  <ScoreInput label="Portfolio Quality" value={scorePortfolio} onChange={setScorePortfolio} />
                  <ScoreInput label="Document Verification" value={scoreDocument} onChange={setScoreDocument} />
                  <ScoreInput label="Communication" value={scoreCommunication} onChange={setScoreCommunication} />
                </div>
                {totalScore > 0 && (
                  <p className="text-sm font-bold mt-3 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Star size={14} /> Total Score: {totalScore} / {maxScore}
                  </p>
                )}
              </div>

              {/* Admin Notes */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1">
                  <MessageCircle size={12} /> Admin Notes / Feedback
                </label>
                <textarea
                  data-testid={`input-notes-${v.id}`}
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Add notes for the technician (visible to them on rejection)..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 flex-wrap">
                <button
                  data-testid={`button-approve-${v.id}`}
                  onClick={() => handleAction('approved')}
                  disabled={updateMut.isPending}
                  className="flex-1 min-w-28 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={15} /> Approve
                </button>
                <button
                  data-testid={`button-request-more-${v.id}`}
                  onClick={() => handleAction('under_review')}
                  disabled={updateMut.isPending}
                  className="flex-1 min-w-28 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <Eye size={15} /> Request Info
                </button>
                <button
                  data-testid={`button-reject-${v.id}`}
                  onClick={() => handleAction('rejected')}
                  disabled={updateMut.isPending}
                  className="flex-1 min-w-28 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <XCircle size={15} /> Reject
                </button>
              </div>

              <button
                onClick={() => setExpanded(false)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronUp size={12} /> Collapse
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function AdminVerifications() {
  const { data: verifications = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['/api/admin/verifications'],
  });

  const [filter, setFilter] = useState("all");

  const filtered = (verifications as any[]).filter(v => {
    if (filter === "all") return true;
    if (filter === "pending") return ["pending", "under_review"].includes(v.status);
    return v.status === filter;
  });

  const counts = {
    all: verifications.length,
    pending: (verifications as any[]).filter(v => ["pending", "under_review"].includes(v.status)).length,
    approved: (verifications as any[]).filter(v => v.status === "approved").length,
    rejected: (verifications as any[]).filter(v => v.status === "rejected").length,
  };

  const FILTERS = [
    { key: "all",      label: "All",      count: counts.all },
    { key: "pending",  label: "Pending",  count: counts.pending },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
            <ShieldCheck className="text-primary" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Verification Center</h1>
            <p className="text-muted-foreground text-sm">{verifications.length} applications total</p>
          </div>
        </div>
        {counts.pending > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-semibold">
            <Clock size={14} /> {counts.pending} awaiting review
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex border-b border-border bg-muted/30 overflow-x-auto scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f.key}
              data-testid={`tab-verif-${f.key}`}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold shrink-0 border-b-2 transition-all ${
                filter === f.key
                  ? "border-primary text-primary bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={28} className="opacity-40" />
              </div>
              <p className="font-semibold text-foreground">No applications in this category</p>
              <p className="text-sm mt-1">Applications will appear here as technicians apply</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(v => (
                <VerificationCard key={v.id} v={v} onUpdate={refetch} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
