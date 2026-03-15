import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useServices } from "@/hooks/use-api";
import { Link } from "wouter";
import {
  Wrench, Star, Shield, Zap, Droplets, Wifi, RefrigeratorIcon,
  Search, SlidersHorizontal, Clock, ArrowRight, Flame, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

// ── category config ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",        label: "All",       labelBn: "সব",        labelAr: "الكل",      emoji: "🏠" },
  { id: "AC",         label: "AC",        labelBn: "এসি",       labelAr: "مكيف",       emoji: "❄️" },
  { id: "Electric",   label: "Electrical",labelBn: "বৈদ্যুতিক", labelAr: "كهرباء",    emoji: "⚡" },
  { id: "Plumbing",   label: "Plumbing",  labelBn: "প্লাম্বিং", labelAr: "سباكة",     emoji: "🔧" },
  { id: "Security",   label: "Security",  labelBn: "নিরাপত্তা", labelAr: "أمن",       emoji: "📷" },
  { id: "Smart Home", label: "Smart Home",labelBn: "স্মার্ট হোম",labelAr: "منزل ذكي", emoji: "🏡" },
  { id: "Appliance",  label: "Appliance", labelBn: "যন্ত্রপাতি",labelAr: "أجهزة",    emoji: "🔌" },
];

const CAT_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  AC:           { bg: "bg-blue-500/10",    text: "text-blue-600",    border: "border-blue-500/30" },
  Electric:     { bg: "bg-yellow-500/10",  text: "text-yellow-600",  border: "border-yellow-500/30" },
  Plumbing:     { bg: "bg-cyan-500/10",    text: "text-cyan-600",    border: "border-cyan-500/30" },
  Security:     { bg: "bg-slate-500/10",   text: "text-slate-600",   border: "border-slate-500/30" },
  "Smart Home": { bg: "bg-purple-500/10",  text: "text-purple-600",  border: "border-purple-500/30" },
  Appliance:    { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/30" },
};
const defaultStyle = { bg: "bg-primary/10", text: "text-primary", border: "border-primary/30" };

function getCatStyle(cat: string) { return CAT_STYLE[cat] || defaultStyle; }

const CAT_EMOJIS: Record<string, string> = {
  AC: "❄️", Electric: "⚡", Plumbing: "🔧",
  "Smart Home": "🏡", Security: "📷", Appliance: "🔌",
};

export function Services() {
  const { language, isRtl } = useLanguage();
  const { data: services = [], isLoading } = useServices();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const T = (en: string, bn: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const getLocalizedName = (s: any) =>
    language === 'bn' ? s.nameBn : language === 'ar' ? s.nameAr : s.nameEn;

  const allServices = (services as any[]).filter(s => s.isActive);

  const filtered = allServices
    .filter(s => activeCategory === "all" || s.category === activeCategory)
    .filter(s =>
      !search ||
      s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      s.nameBn.includes(search) ||
      s.nameAr.includes(search) ||
      (s.descriptionEn || "").toLowerCase().includes(search.toLowerCase())
    );

  const featured = allServices.slice(0, 3);

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* ── HERO ── */}
      <div className="rounded-3xl overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, hsl(221 83% 38%), hsl(221 83% 26%))" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/5 rounded-full" />
        </div>
        <div className="relative p-6 md:p-10 text-white">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 text-xs font-bold mb-3">
            <Flame size={12} className="text-amber-300" />
            {T("Jeddah's #1 Home Services", "জেদ্দার #১ হোম সার্ভিস", "خدمات المنازل رقم 1 في جدة")}
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">
            {T("Our Services", "আমাদের সার্ভিস", "خدماتنا")}
          </h1>
          <p className="text-blue-100 text-sm md:text-base max-w-lg mb-5">
            {T(
              "Professional home maintenance across Jeddah. Book certified technicians in minutes.",
              "জেদ্দা জুড়ে পেশাদার হোম মেইনটেন্যান্স। মিনিটেই সার্টিফাইড টেকনিশিয়ান বুক করুন।",
              "صيانة منزلية احترافية في جدة. احجز فنيين معتمدين في دقائق."
            )}
          </p>
          {/* Search */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20 max-w-lg">
            <Search size={16} className="text-white/70 shrink-0" />
            <input
              data-testid="input-service-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={T("Search services…", "সার্ভিস খুঁজুন…", "ابحث عن الخدمات…")}
              className="flex-1 bg-transparent text-white placeholder:text-white/50 outline-none text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-white/70 hover:text-white">✕</button>
            )}
          </div>
          <div className="flex gap-4 mt-5 flex-wrap">
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 text-xs font-medium">
              <Star size={12} className="fill-amber-400 text-amber-400" /> 4.8/5 · 2,400+ {T("customers", "গ্রাহক", "عميل")}
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 text-xs font-medium">
              <Shield size={12} /> {T("Certified & Insured", "সার্টিফাইড ও বীমাকৃত", "معتمد ومؤمن")}
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 text-xs font-medium">
              <Clock size={12} /> {T("Same Day Service", "একই দিনে সার্ভিস", "خدمة في نفس اليوم")}
            </div>
          </div>
        </div>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {CATEGORIES.map(cat => {
          const active = activeCategory === cat.id;
          const label = language === 'bn' ? cat.labelBn : language === 'ar' ? cat.labelAr : cat.label;
          return (
            <button
              key={cat.id}
              data-testid={`filter-category-${cat.id}`}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shrink-0 border ${
                active
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'glass border-border hover:border-primary/40 text-muted-foreground'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── FEATURED / MOST POPULAR (only when "all" and no search) ── */}
      {activeCategory === "all" && !search && featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black flex items-center gap-2">
              <Flame size={18} className="text-amber-500" />
              {T("Most Popular", "সর্বাধিক জনপ্রিয়", "الأكثر شعبية")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map((svc: any, i: number) => {
              const style = getCatStyle(svc.category);
              const emoji = CAT_EMOJIS[svc.category] || "🔨";
              return (
                <Link key={svc.id} href={`/services/${svc.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    data-testid={`card-featured-service-${svc.id}`}
                    className="glass rounded-2xl overflow-hidden hover:border-primary/40 hover:-translate-y-1 transition-all cursor-pointer group"
                  >
                    <div className="relative h-36 overflow-hidden">
                      {svc.imageUrl ? (
                        <img src={svc.imageUrl} alt={svc.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-5xl ${style.bg}`}>
                          {emoji}
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                          {svc.category}
                        </span>
                      </div>
                      {i === 0 && (
                        <div className="absolute top-2 right-2 bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full">
                          ⭐ TOP
                        </div>
                      )}
                    </div>
                    <div className="p-3.5">
                      <h3 className="font-bold text-sm">{getLocalizedName(svc)}</h3>
                      {svc.descriptionEn && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{svc.descriptionEn}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-black text-primary">{svc.priceSar} SAR</p>
                        <div className="flex items-center gap-0.5">
                          <Star size={11} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs font-medium">4.8</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── ALL SERVICES GRID ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black">
            {search
              ? `${T("Results for", "ফলাফল", "نتائج")} "${search}"`
              : activeCategory === "all"
                ? T("All Services", "সব সার্ভিস", "جميع الخدمات")
                : CATEGORIES.find(c => c.id === activeCategory)?.label || activeCategory
            }
            <span className="ml-2 text-sm font-normal text-muted-foreground">({filtered.length})</span>
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal size={13} />
            {filtered.length} {T("services", "সার্ভিস", "خدمة")}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 glass rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl">
            <Wrench className="mx-auto w-12 h-12 opacity-30 mb-3" />
            <p className="font-semibold text-muted-foreground">
              {T("No services found", "কোনো সার্ভিস পাওয়া যায়নি", "لا توجد خدمات")}
            </p>
            <button onClick={() => { setSearch(""); setActiveCategory("all"); }} className="text-primary text-sm mt-2 hover:underline font-medium">
              {T("Clear filters", "ফিল্টার সাফ করুন", "مسح الفلاتر")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((svc: any, index: number) => {
              const style = getCatStyle(svc.category);
              const emoji = CAT_EMOJIS[svc.category] || "🔨";
              return (
                <motion.div
                  key={svc.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.3) }}
                  data-testid={`card-service-${svc.id}`}
                  className="glass rounded-2xl overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all group"
                >
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden">
                    {svc.imageUrl ? (
                      <img src={svc.imageUrl} alt={svc.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-6xl ${style.bg}`}>
                        {emoji}
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                        {svc.category}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-base">{getLocalizedName(svc)}</h3>
                    {svc.descriptionEn && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">{svc.descriptionEn}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{T("Starting from", "শুরু থেকে", "يبدأ من")}</p>
                        <p className="text-xl font-black text-primary">{svc.priceSar} <span className="text-xs font-normal text-muted-foreground">SAR</span></p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-0.5 justify-end">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold">4.8</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock size={10} />1-2h
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/services/${svc.id}`}
                        data-testid={`button-view-service-${svc.id}`}
                        className="flex-1 py-2.5 border-2 border-primary text-primary font-bold rounded-xl text-sm flex items-center justify-center hover:bg-primary/8 transition-colors"
                      >
                        {T("Details", "বিস্তারিত", "التفاصيل")}
                      </Link>
                      <Link
                        href={`/booking?serviceId=${svc.id}`}
                        data-testid={`button-book-service-${svc.id}`}
                        className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm flex items-center justify-center gap-1 hover:opacity-90 transition-opacity"
                      >
                        {T("Book Now", "বুক করুন", "احجز")}
                        <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── CTA BANNER ── */}
      <div className="glass rounded-2xl p-6 text-center border-2 border-primary/20 bg-primary/5">
        <h3 className="font-black text-lg mb-1">
          {T("Can't find what you need?", "আপনার প্রয়োজনীয় সার্ভিস খুঁজে পাচ্ছেন না?", "لا تجد ما تحتاجه؟")}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {T("Contact us and we'll arrange a custom service for you.", "আমাদের সাথে যোগাযোগ করুন।", "تواصل معنا وسنرتب خدمة مخصصة لك.")}
        </p>
        <a
          href="https://wa.me/966542418449"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 py-2.5 px-6 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors text-sm"
        >
          💬 {T("WhatsApp Us", "হোয়াটসঅ্যাপ করুন", "واتساب")}
        </a>
      </div>
    </div>
  );
}
