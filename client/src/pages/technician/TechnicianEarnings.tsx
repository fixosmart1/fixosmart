import { useLanguage } from "@/hooks/use-language";
import { useMyJobs, useMyEarnings } from "@/hooks/use-api";
import { TrendingUp, DollarSign, CheckCircle, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export function TechnicianEarnings() {
  const { t } = useLanguage();
  const { data: jobs = [] } = useMyJobs();
  const { data: earnings } = useMyEarnings();

  const completedJobs = jobs.filter((j: any) => j.status === 'completed');

  // Group by month
  const monthlyData: Record<string, number> = {};
  completedJobs.forEach((j: any) => {
    const month = j.bookingDate?.slice(0, 7);
    if (month) monthlyData[month] = (monthlyData[month] || 0) + Number(j.totalAmountSar || 0);
  });
  const months = Object.entries(monthlyData).sort().reverse().slice(0, 6);

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
          <TrendingUp className="text-green-500" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('my_earnings')}</h1>
          <p className="text-muted-foreground text-sm">Your income overview</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: DollarSign, label: t('total_earnings'), value: `${earnings?.total || 0} SAR`, color: 'text-green-500', bg: 'bg-green-500/10' },
          { icon: Calendar, label: t('monthly_earnings'), value: `${earnings?.monthly || 0} SAR`, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: CheckCircle, label: t('jobs_completed'), value: earnings?.jobs || 0, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-2xl p-5"
          >
            <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className={stat.color} size={22} />
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
            <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Monthly Breakdown */}
      {months.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h2 className="font-bold mb-4">Monthly Breakdown</h2>
          <div className="space-y-3">
            {months.map(([month, amount]) => {
              const max = Math.max(...months.map(([, v]) => v)) || 1;
              return (
                <div key={month} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-20 shrink-0">{month}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(amount / max) * 100}%` }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                  <span className="text-sm font-semibold w-24 text-right shrink-0">{amount} SAR</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Jobs List */}
      <div>
        <h2 className="font-bold mb-4">Completed Jobs History</h2>
        <div className="space-y-3">
          {completedJobs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground glass rounded-2xl">
              <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
              <p>No completed jobs yet</p>
            </div>
          )}
          {completedJobs.map((job: any, i: number) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-sm">Booking #{job.id}</p>
                <p className="text-xs text-muted-foreground">📍 {job.district} • {job.bookingDate}</p>
              </div>
              <span className="font-bold text-green-500 text-sm">{job.totalAmountSar || 0} SAR</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
