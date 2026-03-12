import { useLanguage } from "@/hooks/use-language";
import { useAuth, useMyJobs, useMyEarnings } from "@/hooks/use-api";
import { Link } from "wouter";
import { Briefcase, TrendingUp, CheckCircle, Clock, DollarSign, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const statusColor: any = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  accepted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  on_the_way: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export function TechnicianDashboard() {
  const { t } = useLanguage();
  const { data: user } = useAuth();
  const { data: jobs = [], isLoading: jobsLoading } = useMyJobs();
  const { data: earnings } = useMyEarnings();

  const activeJobs = jobs.filter((j: any) => !['completed', 'cancelled'].includes(j.status));

  return (
    <div className="space-y-6 py-4">
      {/* Welcome */}
      <div className="glass rounded-2xl p-5 gradient-primary text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.fullName?.charAt(0) || 'T'}
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('welcome')}, {user?.fullName || 'Technician'}</h1>
            <p className="text-white/80 text-sm">{t('technician_dashboard')}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: DollarSign, label: t('total_earnings'), value: `${earnings?.total || 0} SAR`, color: "text-green-500 bg-green-500/10" },
          { icon: TrendingUp, label: t('monthly_earnings'), value: `${earnings?.monthly || 0} SAR`, color: "text-blue-500 bg-blue-500/10" },
          { icon: CheckCircle, label: t('jobs_completed'), value: earnings?.jobs || 0, color: "text-purple-500 bg-purple-500/10" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-2xl p-4 text-center"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${stat.color.split(' ')[1]}`}>
              <stat.icon className={stat.color.split(' ')[0]} size={18} />
            </div>
            <div className="font-bold text-lg">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Active Jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Active Jobs ({activeJobs.length})</h2>
          <Link href="/technician/jobs">
            <span className="text-primary text-sm font-medium cursor-pointer flex items-center gap-1">
              View All <ArrowRight size={14} />
            </span>
          </Link>
        </div>
        {jobsLoading && <div className="glass rounded-2xl p-6 animate-pulse h-20" />}
        {activeJobs.length === 0 && !jobsLoading && (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
            <Briefcase size={32} className="mx-auto mb-2 opacity-30" />
            <p>No active jobs right now</p>
          </div>
        )}
        <div className="space-y-3">
          {activeJobs.slice(0, 3).map((job: any) => (
            <div key={job.id} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Booking #{job.id}</p>
                  <p className="text-xs text-muted-foreground">📍 {job.district} • {job.bookingDate} at {job.bookingTime}</p>
                  <p className="text-xs text-muted-foreground">{job.address}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor[job.status] || 'bg-muted text-muted-foreground'}`}>
                  {job.status?.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/technician/jobs">
          <div className="glass rounded-2xl p-5 text-center cursor-pointer hover-elevate border border-blue-500/20">
            <Briefcase size={28} className="mx-auto mb-2 text-blue-500" />
            <p className="font-semibold text-sm">{t('my_jobs')}</p>
          </div>
        </Link>
        <Link href="/technician/earnings">
          <div className="glass rounded-2xl p-5 text-center cursor-pointer hover-elevate border border-green-500/20">
            <TrendingUp size={28} className="mx-auto mb-2 text-green-500" />
            <p className="font-semibold text-sm">{t('my_earnings')}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
