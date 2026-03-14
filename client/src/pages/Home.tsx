import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useServices, useProducts } from "@/hooks/use-api";
import { Link } from "wouter";
import {
  ArrowRight, Wrench, Zap, Droplet, Cpu, ShieldCheck, Clock, Star,
  ChevronLeft, ChevronRight, MapPin, Users, CheckCircle, Wind, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Static Data ─────────────────────────────────────────────────────────────

const PRAYER_TIMES = [
  { name: 'fajr',    time: '05:12' },
  { name: 'dhuhr',   time: '12:24' },
  { name: 'asr',     time: '15:45' },
  { name: 'maghrib', time: '18:31' },
  { name: 'isha',    time: '19:51' },
];

const SAMPLE_REVIEWS = [
  { name: "Abdullah K.", rating: 5, comment: "Excellent AC repair service! Mohammed fixed my AC in under an hour. Highly recommended.", avatar: "A" },
  { name: "Rakib H.",    rating: 5, comment: "ফিক্সোস্মার্ট অসাধারণ সেবা দেয়। স্মার্ট লক ইনস্টল করেছে একদম পারফেক্টভাবে।", avatar: "R" },
  { name: "Fatima Al-Q.", rating: 4, comment: "سريعون ومحترفون. ركبوا كاميرات CCTV بشكل ممتاز.", avatar: "F" },
];

const PLANS = [
  { name: "Basic",  price: 49,  features: ["2 service visits/month", "Priority support", "10% discount on services"], color: "border-border" },
  { name: "Pro",    price: 99,  features: ["5 service visits/month", "24/7 support", "20% discount on services", "Free smart bulb"], color: "border-primary", badge: "Popular" },
  { name: "Elite",  price: 199, features: ["Unlimited visits", "Dedicated technician", "30% discount on all", "Free installation on products", "Iqama renewal help"], color: "border-amber-400", badge: "Best Value" },
];

// ─── Dynamic service icon colour palette ─────────────────────────────────────
// 8 distinct, accessible colour pairs (light bg + icon colour, dark-mode aware)
const SERVICE_COLORS = [
  { bg: "bg-blue-100   dark:bg-blue-900/30",   ring: "group-hover:ring-blue-300   dark:group-hover:ring-blue-600",   icon: "text-blue-600   dark:text-blue-400"   },
  { bg: "bg-emerald-100 dark:bg-emerald-900/30", ring: "group-hover:ring-emerald-300 dark:group-hover:ring-emerald-600", icon: "text-emerald-600 dark:text-emerald-400" },
  { bg: "bg-amber-100  dark:bg-amber-900/30",   ring: "group-hover:ring-amber-300  dark:group-hover:ring-amber-600",  icon: "text-amber-600  dark:text-amber-400"  },
  { bg: "bg-purple-100 dark:bg-purple-900/30",  ring: "group-hover:ring-purple-300 dark:group-hover:ring-purple-600", icon: "text-purple-600 dark:text-purple-400" },
  { bg: "bg-rose-100   dark:bg-rose-900/30",    ring: "group-hover:ring-rose-300   dark:group-hover:ring-rose-600",   icon: "text-rose-600   dark:text-rose-400"   },
  { bg: "bg-cyan-100   dark:bg-cyan-900/30",    ring: "group-hover:ring-cyan-300   dark:group-hover:ring-cyan-600",   icon: "text-cyan-600   dark:text-cyan-400"   },
  { bg: "bg-orange-100 dark:bg-orange-900/30",  ring: "group-hover:ring-orange-300 dark:group-hover:ring-orange-600", icon: "text-orange-600 dark:text-orange-400" },
  { bg: "bg-teal-100   dark:bg-teal-900/30",    ring: "group-hover:ring-teal-300   dark:group-hover:ring-teal-600",   icon: "text-teal-600   dark:text-teal-400"   },
];

const CAT_ICONS: Record<string, any> = {
  AC: Wind, Electric: Zap, Plumbing: Droplet,
  "Smart Home": Cpu, Security: ShieldCheck, Appliance: Wrench,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Home() {
  const { t, language, isRtl } = useLanguage();
  const { data: services = [] } = useServices();
  const { data: products = [] } = useProducts();
  const [carousel, setCarousel] = useState(0);
  const [heroLang, setHeroLang] = useState<'en' | 'bn' | 'ar'>('en');

  // Rotating trilingual hero headline
  useEffect(() => {
    const langs: ('en' | 'bn' | 'ar')[] = ['en', 'bn', 'ar'];
    const timer = setInterval(() => setHeroLang(l => langs[(langs.indexOf(l) + 1) % 3]), 3500);
    return () => clearInterval(timer);
  }, []);

  const heroTexts = {
    en: { title: "Smart Home & Maintenance, Simplified.", sub: "Professional services for Jeddah residents" },
    bn: { title: "স্মার্ট হোম মেইনটেন্যান্স, এখন সহজ।",  sub: "জেদ্দায় পেশাদার হোম সার্ভিস" },
    ar: { title: "المنزل الذكي والصيانة، بكل سهولة.",       sub: "خدمات احترافية لسكان جدة" },
  };

  const maxCarousel = Math.max(1, products.length - 2);
  const nextCarousel = () => setCarousel(c => (c + 1) % maxCarousel);
  const prevCarousel = () => setCarousel(c => (c - 1 + maxCarousel) % maxCarousel);

  return (
    <div className="space-y-16 sm:space-y-20 py-4 sm:py-6">

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
        {/* Background image — fills the section at every breakpoint */}
        <div className="relative w-full min-h-[420px] sm:min-h-[500px] md:min-h-[560px] flex items-center">
          <img
            src="https://images.unsplash.com/photo-1558002038-1055907df827?w=1920&h=800&fit=crop"
            alt="Smart Home"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
          />

          {/* Gradient overlay — stronger on mobile so text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/95 via-gray-950/75 to-gray-950/30 sm:from-gray-950/90 sm:via-gray-950/65 sm:to-gray-950/10" />

          {/* Content */}
          <div className="relative z-10 w-full px-5 sm:px-10 md:px-16 py-10 sm:py-14 md:py-16 max-w-2xl">
            {/* Location badge */}
            <div className="inline-flex items-center gap-1.5 bg-white/10 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-white/20 backdrop-blur-sm">
              <MapPin size={11} /> Jeddah, Saudi Arabia
            </div>

            {/* Animated headline */}
            <div className="min-h-[100px] sm:min-h-[120px] md:min-h-[140px] flex items-start">
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroLang}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45 }}
                >
                  <h1
                    className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
                    dir={heroLang === 'ar' ? 'rtl' : 'ltr'}
                  >
                    {heroTexts[heroLang].title}
                  </h1>
                  <p className="mt-3 text-sm sm:text-base md:text-lg text-white/70">
                    {heroTexts[heroLang].sub}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* CTA buttons */}
            <div className="mt-6 sm:mt-8 flex flex-wrap gap-2 sm:gap-3">
              <Link href="/booking">
                <button
                  data-testid="button-hero-book"
                  className="px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer text-sm sm:text-base"
                >
                  {t('book_now')} <ArrowRight size={16} className={isRtl ? 'rotate-180' : ''} />
                </button>
              </Link>
              <Link href="/services">
                <button className="px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl font-bold bg-white/10 text-white border border-white/25 hover:bg-white/20 transition-colors cursor-pointer text-sm sm:text-base backdrop-blur-sm">
                  {t('explore_services')}
                </button>
              </Link>
              <Link href="/booking?type=emergency">
                <button className="px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl font-bold bg-destructive text-white shadow-lg shadow-destructive/30 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer text-sm sm:text-base">
                  {t('sos')}
                </button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-6 sm:mt-8 flex flex-wrap gap-4 sm:gap-6">
              {[
                { icon: Users,       label: "500+ Happy Customers" },
                { icon: CheckCircle, label: "Certified Technicians" },
                { icon: Clock,       label: "Same Day Service" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-white/80 text-xs sm:text-sm">
                  <Icon size={14} className="text-primary shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Prayer times — scrollable on mobile, pill row on desktop */}
        <div className="relative z-10 bg-black/50 backdrop-blur-md border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 text-white/50 text-xs shrink-0">
              <Sparkles size={11} />
              <span className="hidden sm:inline">Prayer Times</span>
            </div>
            {PRAYER_TIMES.map(p => (
              <div key={p.name} className="text-center shrink-0 min-w-[48px]">
                <div className="text-white/55 text-[10px] sm:text-xs capitalize">{t(p.name as any)}</div>
                <div className="text-white font-bold text-xs sm:text-sm">{p.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES GRID ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">{t('our_services')}</h2>
          <Link href="/services">
            <span className="text-primary text-sm font-semibold cursor-pointer hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {services.slice(0, 6).map((s: any, i: number) => {
            const Icon = CAT_ICONS[s.category] || Wrench;
            const names: any = { en: s.nameEn, bn: s.nameBn, ar: s.nameAr };
            const colors = SERVICE_COLORS[i % SERVICE_COLORS.length];
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link href={`/booking?serviceId=${s.id}`}>
                  <div
                    data-testid={`card-service-${s.id}`}
                    className="glass p-4 sm:p-5 rounded-2xl text-center cursor-pointer hover-elevate group ring-1 ring-transparent transition-all"
                  >
                    {/* Dynamically coloured icon bubble */}
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 ${colors.bg} ${colors.ring} rounded-xl flex items-center justify-center mx-auto mb-3 transition-all ring-1 ring-transparent`}>
                      <Icon size={20} className={`${colors.icon} sm:text-[22px]`} />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold leading-snug">{names[language] || s.nameEn}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{s.priceSar} SAR</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── SMART GADGETS CAROUSEL ─────────────────────────────────────────── */}
      {products.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold">{t('smart_gadgets')}</h2>
            <div className="flex gap-2">
              <button onClick={prevCarousel} className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={nextCarousel} className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-hidden">
            {products.slice(carousel, carousel + 3).map((p: any, i: number) => {
              const names: any = { en: p.nameEn, bn: p.nameBn, ar: p.nameAr };
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass rounded-2xl overflow-hidden hover-elevate group"
                >
                  <div className="h-40 sm:h-44 overflow-hidden bg-muted">
                    <img src={p.imageUrl} alt={p.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <p className="font-bold">{names[language] || p.nameEn}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary font-bold text-lg">{p.priceSar} SAR</span>
                      <Link href={`/booking?productId=${p.id}`}>
                        <button className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg font-medium cursor-pointer">
                          {t('book_now')}
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── SUBSCRIPTION PLANS ─────────────────────────────────────────────── */}
      <section>
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold">{t('plans')}</h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Choose the plan that works best for you</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`glass rounded-2xl p-5 sm:p-6 border-2 ${plan.color} relative flex flex-col`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white ${
                  plan.badge === 'Popular' ? 'bg-primary' : 'bg-amber-500'
                }`}>{plan.badge}</div>
              )}
              <h3 className="text-xl font-bold mt-2">{plan.name}</h3>
              <div className="my-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground ml-1 text-sm">SAR{t('per_month')}</span>
              </div>
              <ul className="space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle size={15} className="text-green-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/profile">
                <button className={`w-full mt-6 py-3 rounded-xl font-bold cursor-pointer transition-all text-sm sm:text-base ${
                  plan.name === 'Pro'   ? 'bg-primary text-white shadow-lg shadow-primary/30' :
                  plan.name === 'Elite' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' :
                  'border border-border hover:bg-muted'
                }`}>{t('subscribe')}</button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── REVIEWS ────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">What Customers Say</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {SAMPLE_REVIEWS.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-5 rounded-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${SERVICE_COLORS[i % SERVICE_COLORS.length].bg.replace('dark:', 'dark:')} ${SERVICE_COLORS[i % SERVICE_COLORS.length].icon}`} 
                     style={{ background: ['#2563eb','#059669','#d97706'][i] }}>
                  {r.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{r.name}</p>
                  <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <Star key={j} size={11} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── EXPAT TOOLS BANNER ─────────────────────────────────────────────── */}
      <section className="glass rounded-2xl p-6 sm:p-8 gradient-primary text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Expat Tools for Bangladeshi Community</h2>
            <p className="text-white/80 mt-1 text-sm">Iqama tracking, currency converter, prayer times & more</p>
          </div>
          <Link href="/expat-tools">
            <button className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-primary font-bold rounded-xl cursor-pointer hover:bg-white/90 transition-colors whitespace-nowrap text-sm sm:text-base shrink-0">
              Open Expat Tools
            </button>
          </Link>
        </div>
      </section>

    </div>
  );
}
