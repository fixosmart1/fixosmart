import { useLanguage } from "@/hooks/use-language";
import { useAuth, useBookings, useIqamaTrackers } from "@/hooks/use-api";
import { Calendar, CloudSun, Compass, FileText, ArrowRight, Activity, Wrench } from "lucide-react";
import { Link } from "wouter";
import { format, differenceInDays } from "date-fns";

export function Dashboard() {
  const { t, language } = useLanguage();
  const { data: user } = useAuth();
  const { data: bookings = [], isLoading: loadingBookings } = useBookings();
  const { data: iqamas = [] } = useIqamaTrackers();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <UserIcon className="w-20 h-20 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">{t('login_required')}</h2>
        <Link href="/profile" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium mt-4">
          {t('login')}
        </Link>
      </div>
    );
  }

  const iqamaDays = iqamas.length > 0 ? differenceInDays(new Date(iqamas[0].expiryDate), new Date()) : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">{t('dashboard')}</h1>
        <div className="text-sm bg-primary/10 text-primary px-4 py-2 rounded-full font-medium flex items-center gap-2">
          <Activity size={16} /> {t('welcome')}, {user.fullName}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weather Widget (Mock) */}
        <div className="glass p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border-blue-200 dark:border-blue-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t('weather')}</p>
              <h3 className="text-3xl font-bold">34°C</h3>
              <p className="text-sm mt-1">Sunny, Humidity 45%</p>
            </div>
            <CloudSun className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        {/* Prayer Times Widget (Mock) */}
        <div className="glass p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-200 dark:border-emerald-900">
           <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t('prayer_times')}</p>
              <h3 className="text-xl font-bold">Asr - 3:45 PM</h3>
            </div>
            <Compass className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-4">
            <span>Fajr 4:30</span>
            <span>Dhuhr 12:15</span>
            <span className="font-bold text-emerald-600">Asr 3:45</span>
          </div>
        </div>

        {/* Iqama Tracker Widget */}
        <div className={`glass p-6 rounded-2xl ${iqamaDays && iqamaDays < 30 ? 'bg-destructive/10 border-destructive/30' : 'bg-gradient-to-br from-purple-500/10 to-transparent border-purple-200 dark:border-purple-900'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t('iqama_tracker')}</p>
              {iqamaDays !== null ? (
                <>
                  <h3 className={`text-3xl font-bold ${iqamaDays < 30 ? 'text-destructive' : ''}`}>{iqamaDays}</h3>
                  <p className="text-sm mt-1">{t('days_left')}</p>
                </>
              ) : (
                <Link href="/expat-tools" className="text-primary hover:underline text-sm block mt-2">{t('add_iqama')}</Link>
              )}
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Active Bookings */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold">{t('active_bookings')}</h2>
          <Link href="/profile" className="text-primary font-medium hover:underline flex items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        
        {loadingBookings ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-24 glass rounded-2xl animate-pulse"></div>)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center p-8 glass rounded-2xl text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active bookings found.</p>
            <Link href="/booking" className="text-primary font-medium mt-2 inline-block">Book a service</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.slice(0, 3).map(booking => (
              <div key={booking.id} className="glass p-5 rounded-2xl flex items-center justify-between hover:border-primary transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Wrench size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold">Service Booking #{booking.id}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Calendar size={14} /> {format(new Date(booking.bookingDate), 'MMM dd, yyyy')} at {booking.bookingTime}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider
                  ${booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' : 
                    booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' : 
                    'bg-green-500/20 text-green-700 dark:text-green-400'}
                `}>
                  {booking.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Separate UserIcon for cleaner code
function UserIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
