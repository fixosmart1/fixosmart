import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useMyJobs, useUpdateJob } from "@/hooks/use-api";
import { Briefcase, Filter } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_FLOW: any = {
  pending: { next: 'accepted', label: 'Accept Job', color: 'bg-green-500 text-white' },
  accepted: { next: 'on_the_way', label: "I'm On The Way", color: 'bg-blue-500 text-white' },
  on_the_way: { next: 'arrived', label: "I've Arrived", color: 'bg-purple-500 text-white' },
  arrived: { next: 'completed', label: 'Mark Complete', color: 'bg-emerald-500 text-white' },
};

const statusColor: any = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  accepted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  on_the_way: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  arrived: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function TechnicianJobs() {
  const { t } = useLanguage();
  const { data: jobs = [], isLoading } = useMyJobs();
  const updateJob = useUpdateJob();
  const [filter, setFilter] = useState("active");

  const filtered = jobs.filter((j: any) => {
    if (filter === 'active') return !['completed', 'cancelled'].includes(j.status);
    if (filter === 'completed') return j.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Briefcase className="text-blue-500" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('my_jobs')}</h1>
            <p className="text-muted-foreground text-sm">{filtered.length} jobs</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'all', label: 'All' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === tab.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 animate-pulse h-36" />
        ))}
        {filtered.map((job: any, i: number) => {
          const nextAction = STATUS_FLOW[job.status];
          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Booking #{job.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor[job.status] || 'bg-muted text-muted-foreground'}`}>
                      {job.status?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">📍 {job.district}, {job.city || 'Jeddah'}</p>
                  <p className="text-sm text-muted-foreground">{job.address}</p>
                  <p className="text-sm text-muted-foreground">📅 {job.bookingDate} at {job.bookingTime}</p>
                  {job.totalAmountSar && <p className="text-sm font-bold text-primary mt-1">{job.totalAmountSar} SAR</p>}
                  {job.notes && <p className="text-xs text-muted-foreground mt-1 italic">Note: {job.notes}</p>}
                </div>
              </div>

              {nextAction && (
                <div className="flex gap-3">
                  <button
                    onClick={() => updateJob.mutate({ id: job.id, status: nextAction.next })}
                    disabled={updateJob.isPending}
                    className={`flex-1 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50 ${nextAction.color}`}
                  >
                    {nextAction.label}
                  </button>
                  {job.status === 'pending' && (
                    <button
                      onClick={() => updateJob.mutate({ id: job.id, status: 'cancelled' })}
                      className="px-4 py-2.5 rounded-xl font-medium text-sm bg-destructive/10 text-destructive"
                    >
                      Reject
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase size={40} className="mx-auto mb-2 opacity-30" />
            <p>No jobs in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
