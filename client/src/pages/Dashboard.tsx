import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth, useBookings, useIqamaTrackers, useServices, useProducts, useCreateReview } from "@/hooks/use-api";
import {
  Calendar, CloudSun, Compass, FileText, ArrowRight, Wrench,
  Star, X, CheckCircle, MapPin, Tag, Zap, Bell, Phone,
  MessageCircle, Navigation, RefreshCw, Clock, ShoppingBag,
  CreditCard, Shield, Flame, Repeat2, ChevronRight, Sparkles
} from "lucide-react";
import { Link } from "wouter";
import { format, differenceInDays, parseISO, isAfter } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; labelBn: string; labelAr: string; color: string }> = {
  pending:    { label: "Pending",    labelBn: "অপেক্ষমাণ",   labelAr: "قيد الانتظار",   color: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" },
  accepted:   { label: "Accepted",   labelBn: "গৃহীত",       labelAr: "مقبول",          color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  on_the_way: { label: "On the Way", labelBn: "আসছে",        labelAr: "في الطريق",       color: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400" },
  arrived:    { label: "Arrived",    labelBn: "পৌঁছেছে",    labelAr: "وصل",            color: "bg-purple-500/15 text-purple-700 dark:text-purple-400" },
  completed:  { label: "Completed",  labelBn: "সম্পন্ন",     labelAr: "مكتمل",          color: "bg-green-500/15 text-green-700 dark:text-green-400" },
  cancelled:  { label: "Cancelled",  labelBn: "বাতিল",       labelAr: "ملغى",           color: "bg-red-500/15 text-red-700 dark:text-red-400" },
};

function StatusBadge({ status, language }: { status: string; language: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, labelBn: status, labelAr: status, color: "bg-muted text-muted-foreground" };
  const label = language === 'bn' ? cfg.labelBn : language === 'ar' ? cfg.labelAr : cfg.label;
  return (
    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${cfg.color}`}>
      {label}
    </span>
  );
}

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ booking, serviceName, onClose }: { booking: any; serviceName: string; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const createReview = useCreateReview();
  const { toast } = useToast();

  const submit = async () => {
    if (rating === 0) { toast({ title: "Select a rating", variant: "destructive" }); return; }
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
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={18} /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">Booking #{booking.id} · {serviceName}</p>
        <div className="flex gap-2 justify-center mb-6">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} data-testid={`button-star-${s}`} onClick={() => setRating(s)} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)} className="transition-transform hover:scale-110">
              <Star size={32} className={(hovered || rating) >= s ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"} />
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
          {createReview.isPending ? "Submitting…" : <><CheckCircle size={16} /> Submit Review</>}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Section header helper ─────────────────────────────────────────────────────
function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold">{title}</h2>
      {href && (
        <Link href={href} className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
          {linkLabel || "View all"} <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

// ── Service icons map ─────────────────────────────────────────────────────────
const SERVICE_ICONS: Record<string, string> = {
  AC: "❄️", Electric: "⚡", Plumbing: "🔧", "Smart Home": "🏠", Appliance: "📷", default: "🔨",
};

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } },
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function Dashboard() {
  const { t, language, isRtl } = useLanguage();
  const { data: user } = useAuth();
  const { data: bookings = [], isLoading: loadingBookings } = useBookings();
  const { data: iqamas = [] } = useIqamaTrackers();
  const { data: services = [] } = useServices();
  const { data: products = [] } = useProducts();
  const [reviewBooking, setReviewBooking] = useState<any>(null);

  const dir = isRtl ? 'rtl' : 'ltr';
  const T = (en: string, bn: string, ar: string) => language === 'bn' ? bn : language === 'ar' ? ar : en;

  const getServiceName = (svc: any) => {
    if (!svc) return T("Service", "সার্ভিস", "خدمة");
    return language === 'bn' ? svc.nameBn : language === 'ar' ? svc.nameAr : svc.nameEn;
  };
  const getServiceNameById = (id: number | null) => {
    if (!id) return T("Service", "সার্ভিস", "خدمة");
    return getServiceName((services as any[]).find(s => s.id === id));
  };

  const iqamaDays = iqamas.length > 0 ? differenceInDays(parseISO(iqamas[0].expiryDate), new Date()) : null;
  const allBookings = bookings as any[];

  // Split bookings by category
  const activeBookings = allBookings.filter(b => ["pending", "accepted", "on_the_way", "arrived"].includes(b.status));
  const completedBookings = allBookings.filter(b => b.status === 'completed');
  const latestActive = activeBookings[0] || null;

  // Trigger SOS modal via global event
  const triggerSOS = () => window.dispatchEvent(new CustomEvent('fixo:sos'));

  // Jeddah prayer times (approximate for current date)
  const now = new Date();
  const prayers = [
    { name: T("Fajr", "ফজর", "الفجر"),   time: "05:12" },
    { name: T("Dhuhr", "যোহর", "الظهر"),  time: "12:24" },
    { name: T("Asr", "আসর", "العصر"),    time: "15:45" },
    { name: T("Maghrib", "মাগরিব", "المغرب"), time: "18:32" },
    { name: T("Isha", "ইশা", "العشاء"),  time: "19:51" },
  ];
  const currentHour = now.getHours() * 60 + now.getMinutes();
  const prayerTimes = [312, 744, 945, 1112, 1191];
  const nextPrayerIdx = prayerTimes.findIndex(m => m > currentHour);
  const nextPrayer = prayers[nextPrayerIdx >= 0 ? nextPrayerIdx : 0];

  return (
    <div className="space-y-7 pb-4" style={{ direction: dir }}>

      {/* ══ 1. HERO HEADER ══ */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, hsl(221 83% 38%), hsl(221 83% 28%))" }}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -bottom-12 -left-6 w-52 h-52 bg-white/5 rounded-full" />
          <div className="absolute top-4 right-20 w-16 h-16 bg-amber-400/10 rounded-full" />
        </div>

        <div className="relative p-5 text-white">
          <div className="flex items-start justify-between mb-4">
            {/* Left: avatar + greeting */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold border border-white/30 shrink-0">
                {(user?.fullName || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-blue-200">{T("Welcome back", "স্বাগত", "مرحباً بعودتك")}</p>
                <h1 className="text-lg font-bold leading-tight">{user?.fullName || T("Customer", "কাস্টমার", "العميل")}</h1>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={11} className="text-blue-200" />
                  <span className="text-xs text-blue-200">{user?.city || "Jeddah"}, Saudi Arabia</span>
                </div>
              </div>
            </div>
            {/* Right: notification + theme */}
            <div className="flex items-center gap-2">
              <button
                data-testid="button-notifications"
                className="relative w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center hover:bg-white/25 transition-colors"
              >
                <Bell size={16} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-[9px] font-bold text-black rounded-full flex items-center justify-center">2</span>
              </button>
            </div>
          </div>

          {/* Weather + date strip */}
          <div className="flex items-center justify-between bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
            <div className="flex items-center gap-3">
              <CloudSun size={28} className="text-amber-300" />
              <div>
                <p className="text-2xl font-bold">34°C</p>
                <p className="text-xs text-blue-200">{T("Sunny · Jeddah", "রৌদ্রজ্জ্বল · জেদ্দা", "مشمس · جدة")}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{format(now, "EEE, MMM d")}</p>
              <p className="text-xs text-blue-200">{format(now, "h:mm a")}</p>
              <p className="text-xs text-blue-200 mt-0.5">
                {nextPrayer.name}: {nextPrayer.time}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Discount / Wallet banners ── */}
      <AnimatePresence>
        {user?.discountAvailable && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Link href="/booking">
              <div className="glass border border-green-500/30 bg-green-50/50 dark:bg-green-900/10 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-green-500/60 transition-colors" data-testid="banner-dashboard-discount">
                <div className="w-10 h-10 bg-green-500/15 rounded-full flex items-center justify-center shrink-0"><Tag size={18} className="text-green-600" /></div>
                <div className="flex-1">
                  <p className="font-semibold text-green-700 dark:text-green-400">🎁 {T("10% Referral Discount Available!", "১০% রেফারেল ডিসকাউন্ট পাওয়া যাচ্ছে!", "خصم 10% من الإحالة متاح!")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{T("Auto-applied on your next booking.", "পরবর্তী বুকিংয়ে স্বয়ংক্রিয়ভাবে প্রযোজ্য।", "يُطبَّق تلقائياً على الحجز التالي.")}</p>
                </div>
                <ArrowRight size={16} className="text-green-600 shrink-0" />
              </div>
            </Link>
          </motion.div>
        )}
        {!user?.discountAvailable && parseFloat(user?.walletBalance || '0') > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Link href="/booking">
              <div className="glass border border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-amber-500/60 transition-colors" data-testid="banner-dashboard-wallet">
                <div className="w-10 h-10 bg-amber-500/15 rounded-full flex items-center justify-center shrink-0"><span className="text-xl">💰</span></div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-700 dark:text-amber-400">{parseFloat(user!.walletBalance!).toFixed(2)} SAR {T("Wallet Credit!", "ওয়ালেট ক্রেডিট!", "رصيد المحفظة!")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{T("Apply at checkout when booking.", "বুকিংয়ে প্রযোজ্য।", "طبّقه عند الحجز.")}</p>
                </div>
                <ArrowRight size={16} className="text-amber-600 shrink-0" />
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ QUICK STATS ══ */}
      <div className="grid grid-cols-3 gap-3">
        {/* Weather */}
        <div className="glass rounded-2xl p-3 bg-gradient-to-br from-sky-500/10 to-transparent border-sky-200/50 dark:border-sky-900/30 text-center">
          <CloudSun size={22} className="mx-auto text-amber-400 mb-1" />
          <p className="text-lg font-bold leading-none">34°</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{T("Sunny", "রৌদ্রজ্জ্বল", "مشمس")}</p>
        </div>
        {/* Prayer */}
        <div className="glass rounded-2xl p-3 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-200/50 dark:border-emerald-900/30 text-center">
          <Compass size={22} className="mx-auto text-emerald-500 mb-1" />
          <p className="text-[11px] font-bold leading-none">{nextPrayer.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{nextPrayer.time}</p>
        </div>
        {/* Iqama */}
        <Link href="/expat-tools">
          <div className={`glass rounded-2xl p-3 text-center cursor-pointer ${iqamaDays !== null && iqamaDays < 30 ? 'bg-destructive/10 border-destructive/30' : 'bg-gradient-to-br from-purple-500/10 to-transparent border-purple-200/50 dark:border-purple-900/30'}`}>
            <FileText size={22} className={`mx-auto mb-1 ${iqamaDays !== null && iqamaDays < 30 ? 'text-destructive' : 'text-purple-500'}`} />
            {iqamaDays !== null ? (
              <>
                <p className={`text-lg font-bold leading-none ${iqamaDays < 30 ? 'text-destructive' : ''}`}>{iqamaDays}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{T("days", "দিন", "يوم")}</p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-bold leading-none">Iqama</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{T("Add →", "যোগ করুন", "أضف")}</p>
              </>
            )}
          </div>
        </Link>
      </div>

      {/* ══ 2. ACTIVE SERVICE TRACKER ══ */}
      {latestActive && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl overflow-hidden border-2 border-primary/20"
        >
          <div className="bg-primary/8 px-4 py-2.5 border-b border-primary/15 flex items-center gap-2">
            <motion.div
              className="w-2 h-2 bg-primary rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <span className="text-sm font-bold text-primary">
              {T("Active Service", "সক্রিয় সার্ভিস", "الخدمة النشطة")}
            </span>
            <StatusBadge status={latestActive.status} language={language} />
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-2xl shrink-0">
                {SERVICE_ICONS[(services as any[]).find(s => s.id === latestActive.serviceId)?.category] || SERVICE_ICONS.default}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{getServiceNameById(latestActive.serviceId)}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin size={10} /> {latestActive.district || "Jeddah"}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock size={10} /> {format(parseISO(latestActive.bookingDate), "MMM d")} at {latestActive.bookingTime}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">{T("ETA", "আসার সময়", "وقت الوصول")}</p>
                <p className="font-bold text-primary text-sm">~15 min</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href="tel:+966500000000" className="flex-1 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary/20 transition-colors">
                <Phone size={13} />{T("Call", "কল", "اتصل")}
              </a>
              <a href="https://wa.me/966500000000" target="_blank" rel="noreferrer" className="flex-1 py-2 rounded-xl bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-green-500/20 transition-colors">
                <MessageCircle size={13} />WhatsApp
              </a>
              <button
                onClick={triggerSOS}
                className="flex-1 py-2 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-500/20 transition-colors"
              >
                <Navigation size={13} />{T("Track", "ট্র্যাক", "تتبع")}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ══ 3. QUICK SERVICES GRID ══ */}
      <section>
        <SectionHeader
          title={T("Quick Services", "দ্রুত সার্ভিস", "الخدمات السريعة")}
          href="/services"
          linkLabel={T("All Services", "সব সার্ভিস", "كل الخدمات")}
        />
        <motion.div
          className="grid grid-cols-3 gap-3"
          variants={stagger.container}
          initial="initial"
          animate="animate"
        >
          {(services as any[]).filter(s => s.isActive).slice(0, 6).map((svc: any) => {
            const icon = SERVICE_ICONS[svc.category] || SERVICE_ICONS.default;
            return (
              <motion.div key={svc.id} variants={stagger.item}>
                <Link href={`/booking?service=${svc.id}`}>
                  <div
                    data-testid={`card-service-${svc.id}`}
                    className="glass rounded-2xl p-3 text-center hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-95 cursor-pointer"
                  >
                    <div className="text-2xl mb-1.5">{icon}</div>
                    <p className="text-[11px] font-semibold leading-tight">{getServiceName(svc)}</p>
                    <p className="text-[10px] text-primary mt-1 font-bold">{svc.priceSar} SAR</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
          {/* Book custom */}
          <motion.div variants={stagger.item}>
            <Link href="/booking">
              <div className="glass rounded-2xl p-3 text-center hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-95 cursor-pointer border-dashed">
                <div className="text-2xl mb-1.5">➕</div>
                <p className="text-[11px] font-semibold">{T("More", "আরও", "المزيد")}</p>
                <p className="text-[10px] text-primary mt-1 font-bold">{T("Book", "বুক", "احجز")}</p>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ══ 4. EMERGENCY SOS SECTION ══ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl"
        style={{ background: "linear-gradient(135deg, hsl(0 84% 38%), hsl(0 84% 28%))" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 left-8 w-24 h-24 bg-white/5 rounded-full" />
        </div>
        <div className="relative p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base">{T("Emergency Home Help", "জরুরি হোম সাহায্য", "مساعدة منزلية طارئة")}</h3>
              <p className="text-xs text-red-200">{T("Technician in 15–25 minutes", "১৫-২৫ মিনিটে টেকনিশিয়ান", "فني في 15-25 دقيقة")}</p>
            </div>
          </div>
          <p className="text-sm text-red-100 mb-4 leading-relaxed">
            {T(
              "AC failure, water leaks, electrical issues, lockouts — get immediate help any time of day.",
              "এসি নষ্ট, পানির লিক, বিদ্যুৎ সমস্যা, তালা বন্ধ — যেকোনো সময় তাৎক্ষণিক সহায়তা পান।",
              "عطل المكيف، تسرب المياه، مشاكل الكهرباء — احصل على مساعدة فورية في أي وقت."
            )}
          </p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={triggerSOS}
            data-testid="button-dashboard-sos"
            className="w-full py-3.5 bg-white text-red-700 font-black text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-lg hover:bg-red-50 transition-colors"
          >
            <Zap size={18} />
            {T("SOS — Get Emergency Help", "SOS — জরুরি সাহায্য নিন", "SOS — احصل على مساعدة طارئة")}
          </motion.button>
        </div>
      </motion.div>

      {/* ══ 5. UPCOMING BOOKINGS ══ */}
      {activeBookings.length > 0 && (
        <section>
          <SectionHeader
            title={T("Upcoming Bookings", "আসন্ন বুকিং", "الحجوزات القادمة")}
            href="/booking"
            linkLabel={T("Book New", "নতুন বুকিং", "احجز جديد")}
          />
          {loadingBookings ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 glass rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {activeBookings.slice(0, 3).map((b: any) => (
                <div
                  key={b.id}
                  data-testid={`card-booking-${b.id}`}
                  className="glass p-4 rounded-2xl flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl shrink-0">
                    {SERVICE_ICONS[(services as any[]).find(s => s.id === b.serviceId)?.category] || SERVICE_ICONS.default}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{getServiceNameById(b.serviceId)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar size={10} /> {format(parseISO(b.bookingDate), "MMM dd")} · {b.bookingTime}
                    </p>
                    {b.district && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {b.district}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={b.status} language={language} />
                    <Link href="/booking" className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5">
                      <RefreshCw size={10} />{T("Reschedule", "পুনর্নির্ধারণ", "إعادة الجدولة")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ══ 6. SERVICE HISTORY ══ */}
      {completedBookings.length > 0 && (
        <section>
          <SectionHeader
            title={T("Service History", "সার্ভিস ইতিহাস", "سجل الخدمات")}
          />
          <div className="space-y-3">
            {completedBookings.slice(0, 3).map((b: any) => (
              <div
                key={b.id}
                data-testid={`card-history-${b.id}`}
                className="glass p-4 rounded-2xl flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-xl shrink-0">
                  {SERVICE_ICONS[(services as any[]).find(s => s.id === b.serviceId)?.category] || "✅"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{getServiceNameById(b.serviceId)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar size={10} /> {format(parseISO(b.bookingDate), "MMM dd, yyyy")}
                  </p>
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
                    ✓ {T("Completed", "সম্পন্ন", "مكتمل")}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Link href={`/booking?service=${b.serviceId}`} className="text-[10px] bg-primary/10 text-primary font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-primary/20 transition-colors">
                    <Repeat2 size={10} />{T("Rebook", "পুনরায় বুক", "احجز مجدداً")}
                  </Link>
                  <button
                    data-testid={`button-review-booking-${b.id}`}
                    onClick={() => setReviewBooking(b)}
                    className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5 hover:underline"
                  >
                    <Star size={10} />{T("Review", "রিভিউ", "تقييم")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state if no bookings */}
      {allBookings.length === 0 && !loadingBookings && (
        <div className="text-center py-10 glass rounded-2xl">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-muted-foreground">{T("No bookings yet", "কোনো বুকিং নেই", "لا توجد حجوزات بعد")}</p>
          <Link href="/booking" className="text-primary text-sm font-semibold mt-2 inline-flex items-center gap-1 hover:underline">
            {T("Book your first service", "প্রথম সার্ভিস বুক করুন", "احجز خدمتك الأولى")} <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ══ 7. SMART GADGET STORE ══ */}
      {(products as any[]).length > 0 && (
        <section>
          <SectionHeader
            title={T("Smart Gadget Store", "স্মার্ট গ্যাজেট স্টোর", "متجر الأجهزة الذكية")}
            href="/products"
            linkLabel={T("View All", "সব দেখুন", "عرض الكل")}
          />
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {(products as any[]).filter(p => p.isActive).slice(0, 6).map((p: any) => (
              <Link key={p.id} href="/products">
                <div
                  data-testid={`card-product-${p.id}`}
                  className="glass rounded-2xl p-3 w-40 shrink-0 hover:border-primary/30 transition-all cursor-pointer active:scale-95"
                >
                  <div className="w-full h-24 rounded-xl overflow-hidden bg-muted mb-2.5">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.nameEn} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                    )}
                  </div>
                  <p className="text-xs font-semibold truncate">
                    {language === 'bn' ? p.nameBn : language === 'ar' ? p.nameAr : p.nameEn}
                  </p>
                  <p className="text-sm font-bold text-primary mt-0.5">{p.priceSar} SAR</p>
                  <div className="mt-2 text-[10px] font-bold text-center py-1 bg-primary/10 text-primary rounded-lg">
                    {T("View", "দেখুন", "عرض")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ══ 8. EXPAT TOOLS ══ */}
      <section>
        <SectionHeader
          title={T("Expat Tools", "এক্সপ্যাট টুলস", "أدوات المغتربين")}
          href="/expat-tools"
          linkLabel={T("Open", "খুলুন", "افتح")}
        />
        <div className="grid grid-cols-3 gap-3">
          {/* Currency Converter */}
          <Link href="/expat-tools">
            <div className="glass rounded-2xl p-3.5 text-center hover:border-primary/40 active:scale-95 transition-all cursor-pointer">
              <div className="w-10 h-10 bg-green-500/15 rounded-xl flex items-center justify-center text-xl mx-auto mb-2">💱</div>
              <p className="text-[11px] font-bold leading-tight">{T("Currency", "মুদ্রা", "عملة")}</p>
              <p className="text-[10px] text-muted-foreground">SAR → BDT</p>
            </div>
          </Link>
          {/* Iqama Tracker */}
          <Link href="/expat-tools">
            <div className={`glass rounded-2xl p-3.5 text-center hover:border-primary/40 active:scale-95 transition-all cursor-pointer ${iqamaDays !== null && iqamaDays < 30 ? 'border-destructive/40 bg-destructive/5' : ''}`}>
              <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center text-xl mx-auto mb-2">🪪</div>
              <p className="text-[11px] font-bold leading-tight">{T("Iqama", "ইকামা", "الإقامة")}</p>
              <p className={`text-[10px] ${iqamaDays !== null && iqamaDays < 30 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                {iqamaDays !== null ? `${iqamaDays}d left` : T("Track", "ট্র্যাক", "تتبع")}
              </p>
            </div>
          </Link>
          {/* Prayer Times */}
          <Link href="/expat-tools">
            <div className="glass rounded-2xl p-3.5 text-center hover:border-primary/40 active:scale-95 transition-all cursor-pointer">
              <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center text-xl mx-auto mb-2">🕌</div>
              <p className="text-[11px] font-bold leading-tight">{T("Prayer", "নামাজ", "صلاة")}</p>
              <p className="text-[10px] text-muted-foreground">{nextPrayer.name}</p>
            </div>
          </Link>
        </div>
      </section>

      {/* ══ 9. PROMOTIONS / SPECIAL OFFERS ══ */}
      <section>
        <SectionHeader title={T("Special Offers", "বিশেষ অফার", "عروض خاصة")} />
        <div className="space-y-3">
          {/* Promo 1: AC Cleaning */}
          <div className="rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, hsl(217 91% 50%), hsl(217 91% 38%))" }}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
            </div>
            <div className="relative p-4 text-white flex items-center gap-4">
              <div className="text-4xl">❄️</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    {T("20% OFF", "২০% ছাড়", "خصم 20%")}
                  </span>
                </div>
                <p className="font-bold text-sm">{T("AC Deep Cleaning", "এসি ডিপ ক্লিনিং", "تنظيف عميق للمكيف")}</p>
                <p className="text-xs text-blue-200">{T("Limited time offer — Book before April 30", "সীমিত সময়ের অফার", "عرض محدود — احجز قبل 30 أبريل")}</p>
              </div>
              <Link href="/booking">
                <div className="bg-white/20 hover:bg-white/30 transition-colors text-white text-[10px] font-bold px-3 py-2 rounded-xl shrink-0">
                  {T("Book", "বুক", "احجز")}
                </div>
              </Link>
            </div>
          </div>

          {/* Promo 2: Seasonal Package */}
          <div className="rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, hsl(142 76% 30%), hsl(142 76% 22%))" }}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />
            </div>
            <div className="relative p-4 text-white flex items-center gap-4">
              <div className="text-4xl">🏠</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    {T("New", "নতুন", "جديد")}
                  </span>
                </div>
                <p className="font-bold text-sm">{T("Seasonal Home Package", "সিজনাল হোম প্যাকেজ", "باقة صيانة موسمية")}</p>
                <p className="text-xs text-green-200">{T("AC + Electrical + Plumbing — 399 SAR", "এসি + ইলেকট্রিক্যাল + প্লাম্বিং", "مكيف + كهرباء + سباكة — 399 ريال")}</p>
              </div>
              <Link href="/booking">
                <div className="bg-white/20 hover:bg-white/30 transition-colors text-white text-[10px] font-bold px-3 py-2 rounded-xl shrink-0">
                  {T("Book", "বুক", "احجز")}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Review Modal ── */}
      <AnimatePresence>
        {reviewBooking && (
          <ReviewModal
            booking={reviewBooking}
            serviceName={getServiceNameById(reviewBooking.serviceId)}
            onClose={() => setReviewBooking(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
