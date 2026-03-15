import { useLanguage } from "@/hooks/use-language";
import { useAdminAnalytics } from "@/hooks/use-api";
import { Link } from "wouter";
import {
  LayoutDashboard, Users, Calendar, Wrench, ShoppingBag, TrendingUp,
  CheckCircle, Clock, AlertCircle, DollarSign, Settings, ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";

export function AdminDashboard() {
  const { t } = useLanguage();
  const { data: analytics, isLoading } = useAdminAnalytics();

  const stats = [
    { label: t('total_bookings'), value: analytics?.totalBookings ?? 0, icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: t('total_revenue'), value: `${analytics?.totalRevenue ?? 0} SAR`, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
    { label: t('total_users'), value: analytics?.totalUsers ?? 0, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Technicians", value: analytics?.totalTechnicians ?? 0, icon: Wrench, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: t('pending_bookings'), value: analytics?.pendingBookings ?? 0, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: t('completed_bookings'), value: analytics?.completedBookings ?? 0, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Pending Verifications", value: analytics?.pendingVerifications ?? 0, icon: ShieldCheck, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  const quickLinks = [
    { href: "/admin/users", icon: Users, label: t('manage_users'), color: "bg-blue-500/10 border-blue-500/20" },
    { href: "/admin/bookings", icon: Calendar, label: t('manage_bookings'), color: "bg-purple-500/10 border-purple-500/20" },
    { href: "/admin/services", icon: Wrench, label: t('manage_services'), color: "bg-green-500/10 border-green-500/20" },
    { href: "/admin/products", icon: ShoppingBag, label: t('manage_products'), color: "bg-amber-500/10 border-amber-500/20" },
    { href: "/admin/verifications", icon: ShieldCheck, label: "Verification Center", color: "bg-rose-500/10 border-rose-500/20" },
    { href: "/admin/settings", icon: Settings, label: "Site Settings", color: "bg-slate-500/10 border-slate-500/20" },
  ];

  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
          <LayoutDashboard className="text-destructive" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('admin_dashboard')}</h1>
          <p className="text-muted-foreground text-sm">Platform overview and management</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5"
          >
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className={stat.color} size={20} />
            </div>
            <div className={`text-2xl font-bold ${isLoading ? 'animate-pulse bg-muted rounded-md h-8 w-16' : ''}`}>
              {!isLoading && stat.value}
            </div>
            <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="font-bold mb-4 text-lg">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <Link href={link.href}>
                <div className={`glass p-5 rounded-2xl cursor-pointer hover-elevate border ${link.color} text-center group`}>
                  <link.icon size={28} className="mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold text-sm">{link.label}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Platform Status */}
      <div className="glass p-5 rounded-2xl">
        <h2 className="font-bold mb-4">Platform Status</h2>
        <div className="space-y-3">
          {[
            { label: "API Server", status: "Online", ok: true },
            { label: "Database", status: "Connected", ok: true },
            { label: "Booking Service", status: "Active", ok: true },
            { label: "Payment Gateway", status: "Not configured", ok: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm font-medium">{item.label}</span>
              <span className={`flex items-center gap-1.5 text-xs font-semibold ${item.ok ? 'text-green-500' : 'text-amber-500'}`}>
                {item.ok ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
