import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAllBookings, useUpdateBookingStatus } from "@/hooks/use-api";
import { Calendar, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_OPTIONS = ["all", "pending", "accepted", "on_the_way", "arrived", "completed", "cancelled"];

const statusColor: any = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  accepted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  on_the_way: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  arrived: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function AdminBookings() {
  const { t } = useLanguage();
  const { data: bookings = [], isLoading } = useAllBookings();
  const updateStatus = useUpdateBookingStatus();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = bookings.filter((b: any) => {
    const matchSearch = b.district.toLowerCase().includes(search.toLowerCase()) || String(b.id).includes(search);
    const matchStatus = filter === 'all' || b.status === filter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
          <Calendar className="text-purple-500" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('manage_bookings')}</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} bookings</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by district or booking ID..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary outline-none transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="pl-9 pr-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary outline-none appearance-none cursor-pointer"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 animate-pulse h-24" />
        ))}
        {filtered.map((b: any, i: number) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">Booking #{b.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor[b.status] || 'bg-muted text-muted-foreground'}`}>
                    {b.status?.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  📍 {b.district} • 📅 {b.bookingDate} at {b.bookingTime}
                </p>
                <p className="text-sm text-muted-foreground">{b.address}</p>
                {b.totalAmountSar && <p className="text-sm font-semibold text-primary mt-1">{b.totalAmountSar} SAR</p>}
              </div>
              <select
                value={b.status}
                onChange={e => updateStatus.mutate({ id: b.id, status: e.target.value })}
                className="text-xs px-2 py-1.5 rounded-lg bg-background border border-border outline-none cursor-pointer shrink-0"
              >
                {STATUS_OPTIONS.filter(s => s !== 'all').map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </motion.div>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar size={40} className="mx-auto mb-2 opacity-30" />
            <p>No bookings found</p>
          </div>
        )}
      </div>
    </div>
  );
}
