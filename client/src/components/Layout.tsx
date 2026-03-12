import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/use-api";
import {
  Home, LayoutDashboard, Wrench, ShoppingBag, UserCircle,
  PhoneCall, Users, Calendar, Briefcase, TrendingUp,
  ChevronRight
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

  const isActive = (href: string) =>
    href === '/' ? location === '/' : location === href || location.startsWith(href + '/');

  const logoHref = role === 'admin' ? '/admin' : role === 'technician' ? '/technician/dashboard' : '/';

  return (
    <div
      className={`min-h-screen min-h-dvh flex flex-col ${isRtl ? 'rtl' : 'ltr'}`}
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ overflowX: 'hidden' }}
    >
      {/* ─── Fixed Header (both mobile + desktop) ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 glass-panel flex items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href={logoHref}>
          <span className="flex items-center gap-2 cursor-pointer select-none">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-primary">FixoSmart</span>
            {role !== 'customer' && (
              <span className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                role === 'admin'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-primary/10 text-primary'
              }`}>{role}</span>
            )}
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}>
                <item.icon size={15} />
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      {/* ─── Main Scroll Area ─── */}
      {/* pt-16 = header height; pb-24 = bottom nav on mobile; md:pb-0 = no bottom nav on desktop */}
      <div className="flex-1 pt-16 pb-24 md:pb-6 overflow-y-auto">
        <main
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
          style={{ minHeight: 'calc(100dvh - 4rem)' }}
        >
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* ─── SOS Floating Button (customers only) ─── */}
      {role === 'customer' && (
        <Link href="/booking?type=emergency">
          <div
            className="fixed z-50 flex items-center justify-center w-14 h-14 bg-destructive text-white rounded-full shadow-2xl sos-pulse cursor-pointer active:scale-95 transition-transform select-none"
            style={{
              bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px) + 0.5rem)',
              right: '1rem',
            }}
          >
            <PhoneCall size={22} />
          </div>
        </Link>
      )}

      {/* ─── Bottom Mobile Nav ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden bg-card/95 backdrop-blur border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex w-full items-stretch">
          {navItems.slice(0, 5).map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <div className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 cursor-pointer transition-all min-h-[56px] ${
                  active ? 'text-primary' : 'text-muted-foreground active:text-foreground'
                }`}>
                  <item.icon
                    size={20}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={active ? 'text-primary' : ''}
                  />
                  <span className={`text-[9px] font-medium leading-tight text-center ${active ? 'text-primary' : ''}`}>
                    {item.label}
                  </span>
                  {active && (
                    <div className="w-1 h-1 bg-primary rounded-full mt-0.5" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
