import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/use-api";
import {
  Home, LayoutDashboard, Wrench, ShoppingBag, UserCircle,
  PhoneCall, Settings, Users, Calendar, Briefcase, TrendingUp, Globe
} from "lucide-react";
import { motion } from "framer-motion";

export function Layout({ children }: { children: ReactNode }) {
  const { t, isRtl } = useLanguage();
  const [location] = useLocation();
  const { data: user } = useAuth();

  const role = user?.role || 'customer';

  const customerNav = [
    { href: "/", icon: Home, label: t('home') },
    { href: "/dashboard", icon: LayoutDashboard, label: t('dashboard') },
    { href: "/services", icon: Wrench, label: t('services') },
    { href: "/products", icon: ShoppingBag, label: t('products') },
    { href: "/profile", icon: UserCircle, label: t('profile') },
  ];

  const technicianNav = [
    { href: "/technician/dashboard", icon: LayoutDashboard, label: t('dashboard') },
    { href: "/technician/jobs", icon: Briefcase, label: t('my_jobs') },
    { href: "/technician/earnings", icon: TrendingUp, label: t('my_earnings') },
    { href: "/profile", icon: UserCircle, label: t('profile') },
  ];

  const adminNav = [
    { href: "/admin", icon: LayoutDashboard, label: t('admin_dashboard') },
    { href: "/admin/users", icon: Users, label: t('manage_users') },
    { href: "/admin/bookings", icon: Calendar, label: t('manage_bookings') },
    { href: "/admin/services", icon: Wrench, label: t('manage_services') },
    { href: "/admin/products", icon: ShoppingBag, label: t('manage_products') },
  ];

  const navItems = role === 'admin' ? adminNav : role === 'technician' ? technicianNav : customerNav;
  const isAdminOrTech = role === 'admin' || role === 'technician';

  return (
    <div className={`min-h-screen pb-20 md:pb-0 md:pt-16 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Desktop Nav */}
      <header className="fixed top-0 left-0 right-0 h-16 glass-panel z-40 hidden md:flex items-center justify-between px-8">
        <Link href={role === 'admin' ? '/admin' : role === 'technician' ? '/technician/dashboard' : '/'}>
          <span className="text-2xl font-bold text-primary flex items-center gap-2 cursor-pointer">
            <Wrench className="w-6 h-6" /> FixoSmart
            {role !== 'customer' && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ml-1 ${
                role === 'admin' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
              }`}>{role}</span>
            )}
          </span>
        </Link>
        <nav className="flex items-center gap-5">
          {navItems.map((item) => {
            const active = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <span className={`text-sm font-medium transition-colors cursor-pointer ${
                  active ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-16 glass-panel z-40 flex md:hidden items-center justify-between px-4">
        <Link href={role === 'admin' ? '/admin' : role === 'technician' ? '/technician/dashboard' : '/'}>
          <span className="text-lg font-bold text-primary flex items-center gap-1 cursor-pointer">
            <Wrench className="w-5 h-5" /> FixoSmart
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      </main>

      {/* SOS FAB — only for customers */}
      {role === 'customer' && (
        <Link href="/booking?type=emergency">
          <div className="fixed bottom-24 md:bottom-8 right-6 z-50 flex items-center justify-center w-16 h-16 bg-destructive text-destructive-foreground rounded-full shadow-2xl sos-pulse cursor-pointer hover:scale-105 transition-transform select-none">
            <PhoneCall size={26} />
          </div>
        </Link>
      )}

      {/* Bottom Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 glass-panel z-40 flex md:hidden items-end justify-around px-2 pb-safe">
        {navItems.slice(0, 5).map((item) => {
          const active = location === item.href || (item.href !== '/' && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl cursor-pointer transition-all ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <item.icon size={active ? 24 : 22} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
