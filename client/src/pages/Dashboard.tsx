import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth, useBookings, useIqamaTrackers, useServices, useCreateReview } from "@/hooks/use-api";
import { Calendar, CloudSun, Compass, FileText, ArrowRight, Activity, Wrench, Star, X, CheckCircle, MapPin, Tag } from "lucide-react";
import { Link } from "wouter";
import { format, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:     { label: "Pending",     color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" },
  accepted:    { label: "Accepted",    color: "bg-blue-500/20 text-blue-700 dark:text-blue-400" },
  on_the_way:  { label: "On the Way", color: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400" },
  arrived:     { label: "Arrived",    color: "bg-purple-500/20 text-purple-700 dark:text-purple-400" },
  completed:   { label: "Completed",  color: "bg-green-500/20 text-green-700 dark:text-green-400" },
  cancelled:   { label: "Cancelled",  color: "bg-red-500/20 text-red-700 dark:text-red-400" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-muted text-muted-foreground" };
  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function ReviewModal({ booking, serviceName, onClose }: { booking: any; serviceName: string; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const createReview = useCreateReview();
  const { toast } = useToast();

  const submit = async () => {
    if (rating === 0) {
      toast({ title: "Select a rating", variant: "destructive" });
      return;
    }
    try {
      await createReview.mutateAsync({ bookingId: booking.id, rating, comment: comment || undefined });
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      onClose();
    } catch (err: any) {
      toast({ title: "Failed to submit", description: err.message, variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-background rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Rate your experience</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">Booking #{booking.id} · {serviceName}</p>
        <div className="flex gap-2 justify-center mb-6">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              data-testid={`button-star-${s}`}
              onClick={() => setRating(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={(hovered || rating) >= s ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}
              />
            </button>
          ))}
        </div>
        <textarea
          data-testid="textarea-review-comment"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share your experience (optional)..."
          className="w-full px-4 py-3 rounded-xl bg-muted border-2 border-border focus:border-primary outline-none transition-colors resize-none text-sm"
          rows={3}
        />
        <button
          data-testid="button-submit-review"
          onClick={submit}
          disabled={createReview.isPending || rating === 0}
          className="w-full mt-4 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          {createReview.isPending ? "Submitting..." : <><CheckCircle size={16} /> Submit Review</>}
        </button>
      </motion.div>
    </motion.div>
  );
}

export function Dashboard() {
  const { t, language } = useLanguage();
  const { data: user } = useAuth();
  const { data: bookings = [], isLoading: loadingBookings } = useBookings();
  const { data: iqamas = [] } = useIqamaTrackers();
  const { data: services = [] } = useServices();
  const [reviewBooking, setReviewBooking] = useState<any>(null);

  const getServiceName = (serviceId: number | null) => {
    if (!serviceId) return "Service";
    const svc = (services as any[]).find((s: any) => s.id === serviceId);
    if (!svc) return "Service";
    if (language === 'bn') return svc.nameBn;
    if (language === 'ar') return svc.nameAr;
    return svc.nameEn;
  };

  const iqamaDays = iqamas.length > 0 ? differenceInDays(new Date(iqamas[0].expiryDate), new Date()) : null;
  const activeBookings = (bookings as any[]).filter((b: any) => b.status !== 'cancelled');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-display font-bold">{t('dashboard')}</h1>
        <div className="text-sm bg-primary/10 text-primary px-4 py-2 rounded-full font-medium flex items-center gap-2">
          <Activity size={16} /> {t('welcome')}, {user?.fullName}
        </div>
      </div>

      {/* Referral Discount Banner */}
      {user?.discountAvailable && (
        <Link href="/booking">
          <div className="glass border border-green-500/30 bg-green-50/50 dark:bg-green-900/10 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-green-500/60 transition-colors" data-testid="banner-dashboard-discount">
            <div className="w-10 h-10 bg-green-500/15 rounded-full flex items-center justify-center shrink-0">
              <Tag size={18} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-700 dark:text-green-400">🎁 10% Referral Discount Available!</p>
              <p className="text-xs text-muted-foreground mt-0.5">Auto-applied on your next booking. Tap to book now!</p>
            </div>
            <ArrowRight size={16} className="text-green-600 shrink-0" />
          </div>
        </Link>
      )}

      {/* Stat Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weather Widget */}
        <div className="glass p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border-blue-200 dark:border-blue-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t('weather')}</p>
              <h3 className="text-3xl font-bold">34°C</h3>
              <p className="text-sm mt-1 text-muted-foreground">Sunny · Jeddah</p>
              <p className="text-xs text-muted-foreground mt-0.5">Humidity 45%</p>
            </div>
            <CloudSun className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        {/* Prayer Times Widget */}
        <div className="glass p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-200 dark:border-emerald-900">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t('prayer_times')}</p>
              <h3 className="text-xl font-bold">Asr — 3:45 PM</h3>
            </div>
            <Compass className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Fajr 5:12</span>
            <span>Dhuhr 12:24</span>
            <span className="font-bold text-emerald-600">Asr 3:45</span>
            <span>Isha 7:51</span>
          </div>
        </div>

        {/* Iqama Tracker Widget */}
        <div className={`glass p-6 rounded-2xl ${iqamaDays !== null && iqamaDays < 30 ? 'bg-destructive/10 border-destructive/30' : 'bg-gradient-to-br from-purple-500/10 to-transparent border-purple-200 dark:border-purple-900'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t('iqama_tracker')}</p>
              {iqamaDays !== null ? (
                <>
                  <h3 className={`text-3xl font-bold ${iqamaDays < 30 ? 'text-destructive' : ''}`}>{iqamaDays}</h3>
                  <p className="text-sm mt-1 text-muted-foreground">{t('days_left')}</p>
                  {iqamaDays < 30 && <p className="text-xs text-destructive mt-1 font-medium">⚠ Renew soon!</p>}
                </>
              ) : (
                <Link href="/expat-tools" className="text-primary hover:underline text-sm block mt-2">{t('add_iqama')}</Link>
              )}
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Bookings */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold">{t('active_bookings')}</h2>
          <Link href="/booking" className="text-primary font-medium hover:underline flex items-center gap-1 text-sm">
            Book a Service <ArrowRight size={16} />
          </Link>
        </div>

        {loadingBookings ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-24 glass rounded-2xl animate-pulse" />)}
          </div>
        ) : activeBookings.length === 0 ? (
          <div className="text-center p-10 glass rounded-2xl text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No bookings yet.</p>
            <Link href="/booking" className="text-primary font-medium mt-2 inline-block hover:underline">Book your first service</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeBookings.map((booking: any) => {
              const svcName = booking.serviceId ? getServiceName(booking.serviceId) : (booking.productId ? "Product Order" : "Service Booking");
              const isCompleted = booking.status === 'completed';
              return (
                <div
                  key={booking.id}
                  data-testid={`card-booking-${booking.id}`}
                  className="glass p-5 rounded-2xl flex items-center justify-between gap-4 hover:border-primary transition-colors flex-wrap"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Wrench size={22} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold truncate">{svcName}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                        <Calendar size={13} /> {format(new Date(booking.bookingDate), 'MMM dd, yyyy')} at {booking.bookingTime}
                      </p>
                      {booking.district && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {booking.district}, Jeddah
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={booking.status} />
                    {isCompleted && (
                      <button
                        data-testid={`button-review-booking-${booking.id}`}
                        onClick={() => setReviewBooking(booking)}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <Star size={13} /> Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewBooking && (
          <ReviewModal
            booking={reviewBooking}
            serviceName={getServiceName(reviewBooking.serviceId)}
            onClose={() => setReviewBooking(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
