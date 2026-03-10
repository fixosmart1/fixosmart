import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { Home, LayoutDashboard, Wrench, ShoppingBag, Settings, UserCircle, PhoneCall } from "lucide-react";
import { motion } from "framer-motion";

export function Layout({ children }: { children: ReactNode }) {
  const { t, isRtl } = useLanguage();
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: t('home') },
    { href: "/dashboard", icon: LayoutDashboard, label: t('dashboard') },
    { href: "/services", icon: Wrench, label: t('services') },
    { href: "/products", icon: ShoppingBag, label: t('products') },
    { href: "/profile", icon: UserCircle, label: t('profile') },
  ];

  return (
    <div className={`min-h-screen pb-20 md:pb-0 md:pt-20 ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Top Desktop Nav */}
      <header className="fixed top-0 left-0 right-0 h-16 glass-panel z-40 hidden md:flex items-center justify-between px-8">
        <Link href="/" className="text-2xl font-display font-bold text-primary flex items-center gap-2">
          <Wrench className="w-6 h-6" /> FixoSmart
        </Link>
        <nav className="flex items-center gap-6">
          {navItems.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`font-medium transition-colors hover:text-primary ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-16 glass-panel z-40 flex md:hidden items-center justify-between px-4">
        <Link href="/" className="text-xl font-display font-bold text-primary flex items-center gap-1">
          <Wrench className="w-5 h-5" /> FixoSmart
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-8 pb-8 min-h-[calc(100vh-4rem)]">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* SOS FAB */}
      <Link 
        href="/booking?type=emergency" 
        className="fixed bottom-24 md:bottom-8 right-6 z-50 flex items-center justify-center w-16 h-16 bg-destructive text-destructive-foreground rounded-full shadow-2xl sos-pulse hover:scale-110 transition-transform"
      >
        <PhoneCall size={28} />
      </Link>

      {/* Bottom Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 glass-panel z-40 flex md:hidden items-center justify-around px-2 pb-safe">
        {navItems.map((item) => {
          const active = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center w-16 gap-1">
              <item.icon className={`w-6 h-6 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-medium truncate w-full text-center ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
