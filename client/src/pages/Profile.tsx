import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth, useLogin, useBookings } from "@/hooks/use-api";
import { User, LogOut, Settings, Calendar, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";

export function Profile() {
  const { t } = useLanguage();
  const { data: user, isLoading } = useAuth();
  const login = useLogin();
  const { data: bookings = [] } = useBookings();
  const [loginName, setLoginName] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginName.trim()) {
      login.mutate(loginName.trim());
    }
  };

  const handleLogout = () => {
    // Basic mock logout: clear query cache and reload
    queryClient.clear();
    window.location.href = "/";
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 glass p-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <User size={40} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Login to FixoSmart</h1>
        <p className="text-center text-muted-foreground mb-8">Enter your full name to continue</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('full_name')}</label>
            <input 
              type="text" 
              className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              placeholder="e.g. John Doe"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={login.isPending}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
          >
            {login.isPending ? "Logging in..." : t('login')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Profile Header */}
      <div className="glass p-8 rounded-3xl flex flex-col md:flex-row items-center gap-6 md:gap-8">
        <div className="w-24 h-24 bg-gradient-to-tr from-primary to-accent rounded-full flex items-center justify-center text-white text-3xl font-display font-bold shadow-xl">
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-foreground">{user.fullName}</h1>
          <p className="text-muted-foreground mt-1 flex items-center justify-center md:justify-start gap-2">
            <Settings size={16} /> User Settings
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="px-6 py-3 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          <LogOut size={18} /> {t('logout')}
        </button>
      </div>

      {/* Booking History */}
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-bold">Booking History</h2>
        
        {bookings.length === 0 ? (
          <div className="text-center p-12 glass rounded-3xl text-muted-foreground">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No bookings yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((b) => (
              <div key={b.id} className="glass p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-lg">Booking #{b.id}</span>
                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                      b.status === 'completed' ? 'bg-success/20 text-success' : 'bg-yellow-500/20 text-yellow-600'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-4">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(b.bookingDate), 'PP')}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {b.bookingTime}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-xl text-primary">{b.totalAmountSar} SAR</div>
                  <div className="text-xs text-muted-foreground">{b.district}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
