import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useServices, useProducts, useTechnicians } from "@/hooks/use-api";
import { Link } from "wouter";
import {
  ArrowRight, Wrench, Zap, Droplet, Cpu, ShieldCheck, Wind,
  Star, ChevronLeft, ChevronRight, MapPin, Users, CheckCircle,
  Clock, Sparkles, BadgeCheck, Briefcase, PhoneCall, Search,
  CalendarCheck, ThumbsUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Static config ────────────────────────────────────────────────────────────

const PRAYER_TIMES = [
  { name: "fajr",    time: "05:12" },
  { name: "dhuhr",   time: "12:24" },
  { name: "asr",     time: "15:45" },
  { name: "maghrib", time: "18:31" },
  { name: "isha",    time: "19:51" },
];

const SERVICE_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/30",     icon: "text-blue-600 dark:text-blue-400",     glow: "shadow-blue-200 dark:shadow-blue-900"     },
  { bg: "bg-emerald-100 dark:bg-emerald-900/30", icon: "text-emerald-600 dark:text-emerald-400", glow: "shadow-emerald-200 dark:shadow-emerald-900" },
  { bg: "bg-amber-100 dark:bg-amber-900/30",   icon: "text-amber-600 dark:text-amber-400",   glow: "shadow-amber-200 dark:shadow-amber-900"   },
  { bg: "bg-purple-100 dark:bg-purple-900/30", icon: "text-purple-600 dark:text-purple-400", glow: "shadow-purple-200 dark:shadow-purple-900" },
  { bg: "bg-rose-100 dark:bg-rose-900/30",     icon: "text-rose-600 dark:text-rose-400",     glow: "shadow-rose-200 dark:shadow-rose-900"     },
  { bg: "bg-cyan-100 dark:bg-cyan-900/30",     icon: "text-cyan-600 dark:text-cyan-400",     glow: "shadow-cyan-200 dark:shadow-cyan-900"     },
  { bg: "bg-orange-100 dark:bg-orange-900/30", icon: "text-orange-600 dark:text-orange-400", glow: "shadow-orange-200 dark:shadow-orange-900" },
  { bg: "bg-teal-100 dark:bg-teal-900/30",     icon: "text-teal-600 dark:text-teal-400",     glow: "shadow-teal-200 dark:shadow-teal-900"     },
];

const CAT_ICONS: Record<string, any> = {
  AC: Wind, Electric: Zap, Plumbing: Droplet,
  "Smart Home": Cpu, Security: ShieldCheck, Appliance: Wrench,
};

const TESTIMONIALS = [
  { name: "Abdullah K.",     avatar: "A", color: "#2563eb", rating: 5, lang: "EN", comment: "Excellent AC repair! Mohammed fixed everything in under an hour. Punctual, clean, and professional. Highly recommended to every expat in Jeddah." },
  { name: "Rakib H.",        avatar: "R", color: "#059669", rating: 5, lang: "BN", comment: "ফিক্সোস্মার্ট অসাধারণ সেবা দেয়। স্মার্ট লক ইনস্টল করেছে একদম পারফেক্টভাবে। বাংলাদেশি ভাইদের জন্য সেরা অ্যাপ।" },
  { name: "Fatima Al-Qahtani", avatar: "F", color: "#d97706", rating: 5, lang: "AR", comment: "سريعون ومحترفون للغاية. ركبوا كاميرات CCTV بشكل ممتاز وبسعر معقول جداً. سأتعامل معهم مرة أخرى بكل تأكيد." },
  { name: "Hasan M.",        avatar: "H", color: "#7c3aed", rating: 4, lang: "EN", comment: "Very responsive team. Booked a plumbing job at 9 PM and a technician arrived next morning at 8. Clean work, fair pricing." },
  { name: "Sumaiya B.",      avatar: "S", color: "#db2777", rating: 5, lang: "BN", comment: "ইকামা ট্র্যাকার ফিচারটা দারুণ! আর স্মার্ট হোম সেটআপও খুব সুন্দরভাবে করেছে। সব মিলিয়ে অনেক সন্তুষ্ট।" },
];

const HOW_IT_WORKS = [
  { step: "01", icon: Search,        title: "Choose a Service",  desc: "Browse AC repair, plumbing, electrical, smart home setup and more — all in one place." },
  { step: "02", icon: CalendarCheck, title: "Pick Your Slot",    desc: "Select a convenient date, time and district. Add special notes for your technician." },
  { step: "03", icon: ThumbsUp,      title: "Sit Back & Relax",  desc: "A certified technician arrives on time. Pay securely and leave a review when done." },
];

const HERO_LANGS = [
  { lang: "en", title: "Your Home,\nPerfectly Maintained.", sub: "Professional smart-home services for Jeddah residents — in English, বাংলা, and العربية." },
  { lang: "bn", title: "আপনার বাড়ি,\nসেরা যত্নে।",        sub: "জেদ্দায় পেশাদার স্মার্ট হোম সার্ভিস — বাংলা, ইংরেজি ও আরবিতে।" },
  { lang: "ar", title: "منزلك،\nبأفضل صيانة.",             sub: "خدمات المنزل الذكي الاحترافية لسكان جدة — بالعربية والبنغالية والإنجليزية." },
];

const PLANS = [
  { name: "Basic",  price: 49,  badge: null,         highlight: false,  features: ["2 service visits / month", "Priority support", "10% off all services"] },
  { name: "Pro",    price: 99,  badge: "Most Popular", highlight: true, features: ["5 service visits / month", "24/7 support", "20% off all services", "Free smart bulb"] },
  { name: "Elite",  price: 199, badge: "Best Value",  highlight: false,  features: ["Unlimited visits", "Dedicated technician", "30% off everything", "Free product installation", "Iqama renewal help"] },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-primary font-semibold text-xs tracking-widest uppercase mb-3">
      <span className="w-5 h-px bg-primary" />
      {children}
      <span className="w-5 h-px bg-primary" />
    </span>
  );
}

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < n ? "fill-amber-400 text-amber-400" : "text-muted"} />
      ))}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Home() {
  const { t, language, isRtl } = useLanguage();
  const { data: services = [] } = useServices();
  const { data: products = []  } = useProducts();
  const { data: technicians = [] } = useTechnicians();

  const [heroIdx, setHeroIdx] = useState(0);
  const [reviewIdx, setReviewIdx] = useState(0);
  const reviewTimer = useRef<ReturnType<typeof setInterval>>();

  // Rotate hero headline
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_LANGS.length), 3800);
    return () => clearInterval(t);
  }, []);

  // Auto-advance testimonials
  useEffect(() => {
    reviewTimer.current = setInterval(() => setReviewIdx(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(reviewTimer.current);
  }, []);

  const prevReview = () => { clearInterval(reviewTimer.current); setReviewIdx(i => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length); };
  const nextReview = () => { clearInterval(reviewTimer.current); setReviewIdx(i => (i + 1) % TESTIMONIALS.length); };

  const hero = HERO_LANGS[heroIdx];

  return (
    <div className="space-y-24 py-4 sm:py-6">

      {/* ══════════════════════════════════════════════════════════════════════
          1. HERO — split layout
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[520px]">

        {/* ── Left: content ── */}
        <div className="order-2 lg:order-1 flex flex-col justify-center">
          {/* Location chip */}
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-5 w-fit border border-primary/20">
            <MapPin size={11} /> Jeddah, Saudi Arabia
          </div>

          {/* Animated headline */}
          <div className="min-h-[120px] sm:min-h-[140px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroIdx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45 }}
              >
                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight"
                  dir={hero.lang === "ar" ? "rtl" : "ltr"}
                >
                  {hero.title.split("\n").map((line, i) => (
                    <span key={i}>
                      {i === 0
                        ? <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">{line}</span>
                        : <><br /><span className="text-foreground">{line}</span></>
                      }
                    </span>
                  ))}
                </h1>
                <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg" dir={hero.lang === "ar" ? "rtl" : "ltr"}>
                  {hero.sub}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/booking">
              <button data-testid="button-hero-book" className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold bg-primary text-white shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-sm sm:text-base cursor-pointer">
                {t("book_now")} <ArrowRight size={16} className={isRtl ? "rotate-180" : ""} />
              </button>
            </Link>
            <Link href="/services">
              <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm sm:text-base cursor-pointer border border-border">
                {t("explore_services")}
              </button>
            </Link>
            <Link href="/booking?type=emergency">
              <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold bg-destructive text-white shadow-xl shadow-destructive/25 hover:-translate-y-0.5 transition-all text-sm sm:text-base cursor-pointer">
                <PhoneCall size={15} /> {t("sos")}
              </button>
            </Link>
          </div>

          {/* Rating badge + trust pills */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 glass px-4 py-2.5 rounded-2xl shadow-sm">
              <div className="flex -space-x-2">
                {["#2563eb","#059669","#d97706","#7c3aed"].map((c, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-white text-[10px] font-bold" style={{ background: c }}>
                    {["A","R","F","H"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <Stars n={5} size={12} />
                  <span className="font-bold text-sm ml-0.5">4.9</span>
                </div>
                <p className="text-[10px] text-muted-foreground">500+ happy customers</p>
              </div>
            </div>
            {[
              { icon: BadgeCheck, label: "Certified techs" },
              { icon: Clock,      label: "Same-day service" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Icon size={13} className="text-primary" /> {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: visual ── */}
        <div className="order-1 lg:order-2 relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md lg:max-w-none">
            {/* Main image */}
            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 aspect-[4/3] lg:aspect-[3/4] max-h-[480px] lg:max-h-none">
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=900&fit=crop"
                alt="Technician at work"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-gray-950/40 via-transparent to-transparent" />
            </div>

            {/* Floating stat cards */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute -left-4 top-6 glass rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3"
            >
              <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
                <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-sm leading-none">500+</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Jobs Completed</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -right-4 bottom-10 glass rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3"
            >
              <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center">
                <Star size={18} className="fill-amber-500 text-amber-500" />
              </div>
              <div>
                <p className="font-bold text-sm leading-none">4.9 / 5</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Average Rating</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute left-1/2 -translate-x-1/2 -bottom-4 glass rounded-2xl px-5 py-3 shadow-xl flex items-center gap-3 whitespace-nowrap"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-semibold">Technicians Available Now</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Prayer times ticker */}
      <div className="glass rounded-2xl px-4 py-3 flex items-center gap-2 sm:gap-6 overflow-x-auto scrollbar-none -mt-12">
        <div className="flex items-center gap-1.5 text-primary text-xs shrink-0 font-medium">
          <Sparkles size={12} /> <span className="hidden sm:inline">Prayer Times · Jeddah</span>
        </div>
        <div className="w-px h-4 bg-border shrink-0 hidden sm:block" />
        {PRAYER_TIMES.map(p => (
          <div key={p.name} className="flex items-center gap-2 shrink-0">
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground capitalize">{t(p.name as any)}</div>
              <div className="font-bold text-xs sm:text-sm">{p.time}</div>
            </div>
            <div className="w-px h-6 bg-border last:hidden shrink-0" />
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. SERVICES
         ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="text-center mb-10">
          <SectionLabel>What we do</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold">{t("our_services")}</h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto text-sm sm:text-base">
            Everything your home needs — booked in minutes, delivered by certified professionals.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {services.slice(0, 6).map((s: any, i: number) => {
            const Icon = CAT_ICONS[s.category] || Wrench;
            const names: any = { en: s.nameEn, bn: s.nameBn, ar: s.nameAr };
            const c = SERVICE_COLORS[i % SERVICE_COLORS.length];
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <Link href={`/booking?serviceId=${s.id}`}>
                  <div data-testid={`card-service-${s.id}`} className="group glass p-4 sm:p-5 rounded-2xl text-center cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-200 border border-transparent hover:border-primary/20">
                    <div className={`w-12 h-12 ${c.bg} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:shadow-md transition-shadow`}>
                      <Icon size={22} className={c.icon} />
                    </div>
                    <p className="text-xs sm:text-sm font-bold leading-snug">{names[language] || s.nameEn}</p>
                    <div className="flex items-center justify-center gap-1 mt-1.5">
                      <Stars n={5} size={10} />
                    </div>
                    <p className="text-[10px] sm:text-xs text-primary font-semibold mt-1">{s.priceSar} SAR</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link href="/services">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-border hover:bg-muted transition-colors text-sm font-semibold cursor-pointer">
              View All Services <ArrowRight size={15} />
            </button>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. HOW IT WORKS
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative">
        <div className="text-center mb-12">
          <SectionLabel>Simple process</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold">How It Works</h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Book a service in under 2 minutes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-10 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-px bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40" />

          {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="glass rounded-3xl p-7 text-center hover:shadow-lg transition-shadow relative"
            >
              {/* Step number */}
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Icon size={26} className="text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border-2 border-primary text-primary text-[10px] font-extrabold flex items-center justify-center">
                  {step.replace("0", "")}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. FEATURED TECHNICIANS
         ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-end justify-between mb-10">
          <div>
            <SectionLabel>Our team</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold">Featured Technicians</h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Certified, background-checked, and highly rated.</p>
          </div>
        </div>

        {/* Real technicians first, padded with static fallbacks */}
        {(() => {
          const staticTechs = [
            { id: "s1", name: "Mohammed Al-Harbi", specialization: "AC & HVAC", rating: "4.9", totalJobs: 127, color: "#2563eb", initials: "M" },
            { id: "s2", name: "Karim Ahmed",       specialization: "Electrical",  rating: "4.8", totalJobs: 89,  color: "#059669", initials: "K" },
            { id: "s3", name: "Tariq Hassan",      specialization: "Plumbing",    rating: "4.7", totalJobs: 64,  color: "#d97706", initials: "T" },
          ];
          const items = technicians.length
            ? technicians.slice(0, 3).map((tech: any) => ({
                id: String(tech.id),
                name: tech.user?.fullName || "Technician",
                specialization: tech.specialization,
                rating: tech.rating || "4.8",
                totalJobs: tech.totalJobs || 0,
                color: SERVICE_COLORS[Number(tech.id) % SERVICE_COLORS.length].icon.includes("blue") ? "#2563eb" : "#059669",
                initials: (tech.user?.fullName || "T").charAt(0).toUpperCase(),
              }))
            : staticTechs;

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((tech, i) => (
                <motion.div
                  key={tech.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
                >
                  {/* Avatar + badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg"
                        style={{ background: tech.color }}
                      >
                        {tech.initials}
                      </div>
                      <div>
                        <p className="font-bold text-base leading-tight">{tech.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{tech.specialization}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 px-2 py-1 rounded-xl">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{tech.rating}</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 py-3 border-y border-border mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Briefcase size={13} className="text-primary" />
                      <span><strong className="text-foreground">{tech.totalJobs}</strong> jobs done</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BadgeCheck size={13} className="text-emerald-500" />
                      <span>Verified</span>
                    </div>
                  </div>

                  {/* Stars full */}
                  <Stars n={Math.round(parseFloat(String(tech.rating)))} />

                  <Link href="/booking">
                    <button data-testid={`button-book-tech-${tech.id}`} className="mt-4 w-full py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all cursor-pointer border border-primary/20 hover:shadow-lg hover:shadow-primary/20">
                      Book This Technician
                    </button>
                  </Link>
                </motion.div>
              ))}
            </div>
          );
        })()}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. SMART GADGETS
         ══════════════════════════════════════════════════════════════════════ */}
      {products.length > 0 && (
        <section>
          <div className="text-center mb-10">
            <SectionLabel>Smart living</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold">{t("smart_gadgets")}</h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Top smart-home products with professional installation included.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {products.slice(0, 3).map((p: any, i: number) => {
              const names: any = { en: p.nameEn, bn: p.nameBn, ar: p.nameAr };
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.09 }}
                  className="glass rounded-3xl overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
                >
                  <div className="h-48 overflow-hidden bg-muted">
                    <img src={p.imageUrl} alt={p.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5">
                    <p className="font-bold text-base">{names[language] || p.nameEn}</p>
                    <p className="text-xs text-muted-foreground mt-1">+{p.installationFeeSar} SAR installation</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-primary font-extrabold text-xl">{p.priceSar} <span className="text-sm font-semibold">SAR</span></span>
                      <Link href={`/booking?productId=${p.id}`}>
                        <button className="px-4 py-2 bg-primary text-white text-sm rounded-xl font-bold cursor-pointer hover:shadow-lg hover:shadow-primary/30 transition-all">
                          {t("book_now")}
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

      {/* ══════════════════════════════════════════════════════════════════════
          6. TESTIMONIALS CAROUSEL
         ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="text-center mb-10">
          <SectionLabel>Reviews</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold">What Customers Say</h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Trusted by expats across Jeddah.</p>
        </div>

        <div className="relative">
          {/* Prev / Next */}
          <button onClick={prevReview} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 z-10 w-10 h-10 rounded-full glass border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextReview} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 z-10 w-10 h-10 rounded-full glass border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer">
            <ChevronRight size={18} />
          </button>

          <div className="overflow-hidden px-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={reviewIdx}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4 }}
                className="glass rounded-3xl p-8 sm:p-10 max-w-2xl mx-auto text-center shadow-xl"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-5 shadow-lg"
                  style={{ background: TESTIMONIALS[reviewIdx].color }}
                >
                  {TESTIMONIALS[reviewIdx].avatar}
                </div>
                <Stars n={TESTIMONIALS[reviewIdx].rating} size={18} />
                <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed italic">
                  "{TESTIMONIALS[reviewIdx].comment}"
                </p>
                <div className="mt-5 flex items-center justify-center gap-2">
                  <p className="font-bold">{TESTIMONIALS[reviewIdx].name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{TESTIMONIALS[reviewIdx].lang}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setReviewIdx(i)} className={`w-2 h-2 rounded-full transition-all cursor-pointer ${i === reviewIdx ? "w-6 bg-primary" : "bg-muted-foreground/30"}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. SUBSCRIPTION PLANS
         ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="text-center mb-12">
          <SectionLabel>Save more</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold">{t("plans")}</h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Flexible monthly plans for every household.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col transition-all ${
                plan.highlight
                  ? "gradient-primary text-white shadow-2xl shadow-primary/30 scale-[1.03]"
                  : "glass border border-border hover:shadow-lg"
              }`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold shadow-lg ${
                  plan.highlight ? "bg-white text-primary" : "bg-amber-500 text-white"
                }`}>{plan.badge}</div>
              )}
              <h3 className={`text-xl font-extrabold mt-2 ${plan.highlight ? "text-white" : ""}`}>{plan.name}</h3>
              <div className="my-5">
                <span className={`text-5xl font-extrabold ${plan.highlight ? "text-white" : ""}`}>{plan.price}</span>
                <span className={`ml-1.5 text-sm ${plan.highlight ? "text-white/70" : "text-muted-foreground"}`}>SAR / month</span>
              </div>
              <ul className="space-y-2.5 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle size={15} className={plan.highlight ? "text-white/80 shrink-0" : "text-emerald-500 shrink-0"} />
                    <span className={plan.highlight ? "text-white/90" : ""}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/profile">
                <button className={`w-full mt-6 py-3 rounded-2xl font-bold cursor-pointer transition-all text-sm ${
                  plan.highlight
                    ? "bg-white text-primary hover:bg-white/90 shadow-lg"
                    : plan.name === "Elite"
                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50"
                    : "border border-border hover:bg-muted"
                }`}>{t("subscribe")}</button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          8. EXPAT TOOLS BANNER
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="glass rounded-3xl p-7 sm:p-10 bg-gradient-to-r from-primary/5 via-primary/10 to-blue-400/10 border border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
              <Users size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold">Expat Tools for Bangladeshi Community</h2>
              <p className="text-muted-foreground mt-1 text-sm">Iqama tracking · Currency converter (SAR→BDT) · Prayer times</p>
            </div>
          </div>
          <Link href="/expat-tools">
            <button className="px-6 py-3 gradient-primary text-white font-bold rounded-2xl cursor-pointer hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all whitespace-nowrap text-sm shrink-0">
              Open Expat Tools <ArrowRight className="inline ml-1" size={14} />
            </button>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          9. FINAL CTA
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative rounded-3xl overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&h=500&fit=crop"
          alt="Book a service"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/95 via-gray-950/80 to-gray-950/50" />
        <div className="relative z-10 py-16 sm:py-20 px-6 sm:px-12 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight">
              Ready for a Better Home<br />
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Experience?
              </span>
            </h2>
            <p className="mt-4 text-white/70 text-base sm:text-lg max-w-xl mx-auto">
              Book your first service today. Same-day appointments available across Jeddah.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Link href="/booking">
                <button data-testid="button-cta-book" className="px-8 py-4 rounded-2xl font-extrabold bg-primary text-white shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:-translate-y-1 transition-all text-base cursor-pointer flex items-center gap-2">
                  {t("book_now")} <ArrowRight size={18} />
                </button>
              </Link>
              <Link href="/services">
                <button className="px-8 py-4 rounded-2xl font-bold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors text-base cursor-pointer backdrop-blur-sm">
                  Browse Services
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
