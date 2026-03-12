import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useServices, useProducts, useReviews } from "@/hooks/use-api";
import { Link } from "wouter";
import {
  ArrowRight, Wrench, Zap, Droplet, Cpu, ShieldCheck, Clock, Star,
  ChevronLeft, ChevronRight, MapPin, Users, CheckCircle, Wind
} from "lucide-react";
import { motion } from "framer-motion";

const PRAYER_TIMES = [
  { name: 'fajr', time: '05:12' },
  { name: 'dhuhr', time: '12:24' },
  { name: 'asr', time: '15:45' },
  { name: 'maghrib', time: '18:31' },
  { name: 'isha', time: '19:51' },
];

const SAMPLE_REVIEWS = [
  { name: "Abdullah K.", rating: 5, comment: "Excellent AC repair service! Mohammed fixed my AC in under an hour. Highly recommended.", avatar: "A" },
  { name: "Rakib H.", rating: 5, comment: "ফিক্সোস্মার্ট অসাধারণ সেবা দেয়। স্মার্ট লক ইনস্টল করেছে একদম পারফেক্টভাবে।", avatar: "R" },
  { name: "Fatima Al-Q.", rating: 4, comment: "سريعون ومحترفون. ركبوا كاميرات CCTV بشكل ممتاز.", avatar: "F" },
];

const PLANS = [
  { name: "Basic", price: 49, features: ["2 service visits/month", "Priority support", "10% discount on services"], color: "border-border" },
  { name: "Pro", price: 99, features: ["5 service visits/month", "24/7 support", "20% discount on services", "Free smart bulb"], color: "border-primary", badge: "Popular" },
  { name: "Elite", price: 199, features: ["Unlimited visits", "Dedicated technician", "30% discount on all", "Free installation on products", "Iqama renewal help"], color: "border-amber-400", badge: "Best Value" },
];

export function Home() {
  const { t, language, isRtl } = useLanguage();
  const { data: services = [] } = useServices();
  const { data: products = [] } = useProducts();
  const [carousel, setCarousel] = useState(0);
  const [heroLang, setHeroLang] = useState<'en'|'bn'|'ar'>('en');

  // Rotating hero text
  useEffect(() => {
    const langs: ('en'|'bn'|'ar')[] = ['en', 'bn', 'ar'];
    const timer = setInterval(() => {
      setHeroLang(l => langs[(langs.indexOf(l) + 1) % 3]);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const heroTexts = {
    en: { title: "Smart Home & Maintenance, Simplified.", sub: "Professional services for Jeddah residents" },
    bn: { title: "স্মার্ট হোম মেইনটেন্যান্স, এখন সহজ।", sub: "জেদ্দায় পেশাদার হোম সার্ভিস" },
    ar: { title: "المنزل الذكي والصيانة، بكل سهولة.", sub: "خدمات احترافية لسكان جدة" },
  };

  const catIcons: any = { AC: Wind, Electric: Zap, Plumbing: Droplet, "Smart Home": Cpu, Security: ShieldCheck, Appliance: Wrench };

  const nextCarousel = () => setCarousel(c => (c + 1) % Math.max(1, products.length - 2));
  const prevCarousel = () => setCarousel(c => (c - 1 + Math.max(1, products.length - 2)) % Math.max(1, products.length - 2));

  return (
    <div className="space-y-20 py-6">
      {/* HERO */}
      <section className="relative rounded-3xl overflow-hidden min-h-[520px] flex flex-col justify-center">
        <img
          src="https://images.unsplash.com/photo-1558002038-1055907df827?w=1920&h=800&fit=crop"
          alt="Smart Home"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/70 to-gray-950/20" />

        <div className="relative z-10 px-8 md:px-16 max-w-3xl">
          <motion.div key={heroLang} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-primary/30">
              <MapPin size={12} /> Jeddah, Saudi Arabia
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              {heroTexts[heroLang].title}
            </h1>
            <p className="mt-4 text-lg text-white/70">{heroTexts[heroLang].sub}</p>
          </motion.div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/booking">
              <button className="px-7 py-3.5 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer">
                {t('book_now')} <ArrowRight size={18} className={isRtl ? 'rotate-180' : ''} />
              </button>
            </Link>
            <Link href="/services">
              <button className="px-7 py-3.5 rounded-xl font-bold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
                {t('explore_services')}
              </button>
            </Link>
            <Link href="/booking?type=emergency">
              <button className="px-7 py-3.5 rounded-xl font-bold bg-destructive text-white shadow-lg shadow-destructive/30 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer">
                {t('sos')}
              </button>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-6">
            {[
              { icon: Users, label: "500+ Happy Customers" },
              { icon: CheckCircle, label: "Certified Technicians" },
              { icon: Clock, label: "Same Day Service" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-white/80 text-sm">
                <Icon size={16} className="text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prayer Times overlay */}
        <div className="absolute bottom-4 right-4 hidden md:flex items-center gap-4 bg-black/40 backdrop-blur text-white text-xs rounded-2xl px-4 py-3">
          {PRAYER_TIMES.map(p => (
            <div key={p.name} className="text-center">
              <div className="text-white/60 capitalize">{t(p.name as any)}</div>
              <div className="font-bold">{p.time}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES GRID */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">{t('our_services')}</h2>
          <Link href="/services">
            <span className="text-primary text-sm font-semibold cursor-pointer hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {services.slice(0, 6).map((s: any, i: number) => {
            const Icon = catIcons[s.category] || Wrench;
            const names: any = { en: s.nameEn, bn: s.nameBn, ar: s.nameAr };
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link href={`/booking?serviceId=${s.id}`}>
                  <div className="glass p-5 rounded-2xl text-center cursor-pointer hover-elevate group">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                      <Icon size={22} className="text-primary" />
                    </div>
                    <p className="text-sm font-semibold">{names[language] || s.nameEn}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.priceSar} SAR</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* SMART GADGETS CAROUSEL */}
      {products.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">{t('smart_gadgets')}</h2>
            <div className="flex gap-2">
              <button onClick={prevCarousel} className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={nextCarousel} className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
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
                  <div className="h-44 overflow-hidden">
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

      {/* SUBSCRIPTION PLANS */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">{t('plans')}</h2>
          <p className="text-muted-foreground mt-2">Choose the plan that works best for you</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`glass rounded-2xl p-6 border-2 ${plan.color} relative flex flex-col`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white ${
                  plan.badge === 'Popular' ? 'bg-primary' : 'bg-amber-500'
                }`}>{plan.badge}</div>
              )}
              <h3 className="text-xl font-bold mt-2">{plan.name}</h3>
              <div className="my-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground ml-1">SAR{t('per_month')}</span>
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
                <button className={`w-full mt-6 py-3 rounded-xl font-bold cursor-pointer transition-all ${
                  plan.name === 'Pro' ? 'bg-primary text-white shadow-lg shadow-primary/30' :
                  plan.name === 'Elite' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' :
                  'border border-border hover:bg-muted'
                }`}>{t('subscribe')}</button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section>
        <h2 className="text-3xl font-bold mb-8">What Customers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                  {r.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{r.name}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <Star key={j} size={12} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* EXPAT TOOLS BANNER */}
      <section className="glass rounded-2xl p-8 gradient-primary text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold">Expat Tools for Bangladeshi Community</h2>
            <p className="text-white/80 mt-1">Iqama tracking, currency converter, prayer times & more</p>
          </div>
          <Link href="/expat-tools">
            <button className="px-6 py-3 bg-white text-primary font-bold rounded-xl cursor-pointer hover:bg-white/90 transition-colors whitespace-nowrap">
              Open Expat Tools
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
