import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth, useLogin, useLogout } from "@/hooks/use-api";
import { useLocation } from "wouter";
import { User, Mail, Phone, Globe, Shield, Copy, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const { data: user } = useAuth();
  const login = useLogin();
  const logout = useLogout();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState({ fullName: "", email: "", role: "customer" });
  const [copied, setCopied] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return;
    await login.mutateAsync({ fullName: form.fullName, email: form.email || undefined, role: form.role });
    toast({ title: "Logged in!", description: `Welcome, ${form.fullName}` });
  };

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch (_) {}
    // Always redirect to profile/login after logout
    setLocation('/profile');
    window.location.href = '/profile';
  };

  const copyReferral = () => {
    const code = `FIXO${user?.id || ''}`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleBadgeColor: any = {
    customer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    technician: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-8 space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={36} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{t('login')}</h1>
          <p className="text-muted-foreground mt-1">Sign in to access FixoSmart services</p>
        </div>

        <form onSubmit={handleLogin} className="glass p-6 rounded-2xl space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('full_name')} *</label>
            <input
              data-testid="input-fullname"
              type="text"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary outline-none transition-colors"
              placeholder="Enter your full name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('email')}</label>
            <input
              data-testid="input-email"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary outline-none transition-colors"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('role')}</label>
            <select
              data-testid="select-role"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary outline-none transition-colors"
            >
              <option value="customer">Customer</option>
              <option value="technician">Technician</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            data-testid="button-login"
            type="submit"
            disabled={login.isPending}
            className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20"
          >
            {login.isPending ? "Signing in..." : t('login')}
          </button>
        </form>

        <div className="glass p-4 rounded-2xl text-sm text-center text-muted-foreground">
          Demo: Log in as <span className="text-primary font-medium">admin</span>, <span className="text-primary font-medium">technician</span>, or <span className="text-primary font-medium">customer</span> by selecting the role above.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        {/* Profile Card */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{user.fullName}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${roleBadgeColor[user.role || 'customer']}`}>
                  {user.role}
                </span>
              </div>
              {user.email && <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1.5"><Mail size={13} />{user.email}</p>}
              {user.phone && <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1.5"><Phone size={13} />{user.phone}</p>}
              <p className="text-muted-foreground text-xs mt-1">Member since {new Date(user.createdAt!).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Language Preference */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-primary" />
            <h3 className="font-semibold">Language Preference</h3>
          </div>
          <div className="flex gap-3 flex-wrap">
            {(['en', 'bn', 'ar'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                  language === lang ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                }`}
              >
                {lang === 'en' ? '🇬🇧 English' : lang === 'bn' ? '🇧🇩 বাংলা' : '🇸🇦 العربية'}
              </button>
            ))}
          </div>
        </div>

        {/* Referral Code */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold mb-3">{t('invite_friend')}</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 px-4 py-2.5 bg-muted rounded-xl font-mono font-bold tracking-widest text-primary">
              FIXO{user.id}
            </div>
            <button
              onClick={copyReferral}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm flex items-center gap-2"
            >
              {copied ? <><CheckCircle size={14} />{t('copied')}</> : <><Copy size={14} />{t('copy')}</>}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Share this code — your friend gets 10% off their first booking!</p>
        </div>

        {user.role === 'admin' && (
          <a href="/admin" className="block">
            <div className="glass p-4 rounded-2xl border border-destructive/30 hover:bg-destructive/5 transition-colors">
              <p className="font-medium flex items-center gap-2 text-destructive"><Shield size={16} /> Open Admin Dashboard &rarr;</p>
            </div>
          </a>
        )}

        {user.role === 'technician' && (
          <a href="/technician/dashboard" className="block">
            <div className="glass p-4 rounded-2xl border border-primary/30 hover:bg-primary/5 transition-colors">
              <p className="font-medium flex items-center gap-2 text-primary">Open Technician Dashboard &rarr;</p>
            </div>
          </a>
        )}

        <button
          data-testid="button-logout"
          onClick={handleLogout}
          className="w-full py-3.5 bg-destructive/10 text-destructive font-bold rounded-xl hover:bg-destructive/20 transition-colors border border-destructive/20"
        >
          {t('logout')}
        </button>
      </motion.div>
    </div>
  );
}
