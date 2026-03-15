import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import {
  useServices, useTechnicians, useServiceAddons,
  useServiceReviews, useAuth
} from "@/hooks/use-api";
import {
  ArrowLeft, Star, Clock, MapPin, Shield, Zap, Droplets, Wifi,
  Phone, MessageCircle, CheckCircle, Plus, Minus, ChevronRight,
  Wrench, RefrigeratorIcon, Users, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// ── helpers ───────────────────────────────────────────────────────────────────
const CAT_ICONS: Record<string, any> = {
  AC: Zap, Electric: Zap, Plumbing: Droplets,
  "Smart Home": Wifi, Security: Shield, Appliance: RefrigeratorIcon,
};
const CAT_EMOJIS: Record<string, string> = {
  AC: "❄️", Electric: "⚡", Plumbing: "🔧",
  "Smart Home": "🏠", Security: "📷", Appliance: "🔌",
};

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size} className={s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground"} />
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ServiceDetail() {
  const [, params] = useRoute("/services/:id");
  const id = Number(params?.id);
  const { language, isRtl } = useLanguage();
  const { data: user } = useAuth();
  const { data: services = [] } = useServices();
  const { data: technicians = [] } = useTechnicians();
  const { data: addons = [] } = useServiceAddons(id);
  const { data: serviceReviews = [] } = useServiceReviews(id);
  const { toast } = useToast();

  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);

  const service = (services as any[]).find(s => s.id === id);

  const T = (en: string, bn: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  if (!service) {
    return (
      <div className="text-center py-20">
        <Wrench className="mx-auto w-12 h-12 opacity-30 mb-4" />
        <p className="text-muted-foreground">Service not found.</p>
        <Link href="/services" className="text-primary mt-3 inline-flex items-center gap-1 font-medium hover:underline">
          <ArrowLeft size={16} /> Back to Services
        </Link>
      </div>
    );
  }

  const name = language === 'bn' ? service.nameBn : language === 'ar' ? service.nameAr : service.nameEn;
  const Icon = CAT_ICONS[service.category] || Wrench;
  const emoji = CAT_EMOJIS[service.category] || "🔨";
  const basePrice = parseFloat(service.priceSar);
  const addonTotal = selectedAddons.reduce((sum, addonId) => {
    const a = (addons as any[]).find(x => x.id === addonId);
    return sum + (a ? parseFloat(a.priceSar) : 0);
  }, 0);
  const totalPrice = basePrice + addonTotal;

  const toggleAddon = (addonId: number) => {
    setSelectedAddons(prev =>
      prev.includes(addonId) ? prev.filter(x => x !== addonId) : [...prev, addonId]
    );
  };

  // Filter available technicians matching service category
  const relevantTechs = (technicians as any[]).filter(t =>
    t.isAvailable && (
      t.specialization === service.category ||
      t.specialization === "General"
    )
  );

  const avgRating = (serviceReviews as any[]).length > 0
    ? (serviceReviews as any[]).reduce((s: number, r: any) => s + r.rating, 0) / (serviceReviews as any[]).length
    : 0;

  const whatsappMsg = encodeURIComponent(
    `Hi, I want to book ${service.nameEn} service. Total: ${totalPrice} SAR`
  );
  const bookHref = `/booking?serviceId=${id}${selectedAddons.length ? `&addons=${selectedAddons.join(',')}` : ''}`;

  return (
    <div className="pb-28" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Back */}
      <Link href="/services" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm font-medium transition-colors">
        <ArrowLeft size={16} /> {T("Back to Services", "সার্ভিস তালিকায়", "العودة")}
      </Link>

      {/* Hero image / banner */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden mb-6 h-52 md:h-72"
      >
        {service.imageUrl ? (
          <img src={service.imageUrl} alt={service.nameEn} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl"
            style={{ background: "linear-gradient(135deg, hsl(221 83% 38%), hsl(221 83% 26%))" }}>
            {emoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-5 text-white">
          <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
            {service.category}
          </span>
          <h1 className="text-2xl md:text-3xl font-black mt-2">{name}</h1>
          {avgRating > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRow rating={avgRating} />
              <span className="text-xs text-white/80">({(serviceReviews as any[]).length} reviews)</span>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN ── */}
        <div className="md:col-span-2 space-y-6">

          {/* Price + stats */}
          <div className="glass rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{T("Starting from", "শুরু থেকে", "يبدأ من")}</p>
              <p className="text-3xl font-black text-primary">{basePrice} <span className="text-base font-normal text-muted-foreground">SAR</span></p>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="text-center">
                <Clock size={18} className="mx-auto mb-0.5 text-primary" />
                <span>1-2 {T("hrs", "ঘন্টা", "ساعة")}</span>
              </div>
              <div className="text-center">
                <Shield size={18} className="mx-auto mb-0.5 text-green-500" />
                <span>{T("Certified", "সার্টিফাইড", "معتمد")}</span>
              </div>
              <div className="text-center">
                <MapPin size={18} className="mx-auto mb-0.5 text-amber-500" />
                <span>Jeddah</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {service.descriptionEn && (
            <div className="glass rounded-2xl p-5">
              <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                {T("About This Service", "এই সার্ভিস সম্পর্কে", "عن هذه الخدمة")}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{service.descriptionEn}</p>
            </div>
          )}

          {/* What's included */}
          <div className="glass rounded-2xl p-5">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <CheckCircle size={18} className="text-green-500" />
              {T("What's Included", "যা অন্তর্ভুক্ত", "ما يشمله")}
            </h2>
            <div className="space-y-2">
              {[
                T("Full inspection and diagnosis", "সম্পূর্ণ পরীক্ষা ও রোগ নির্ণয়", "فحص وتشخيص كامل"),
                T("Skilled certified technician", "দক্ষ সার্টিফাইড টেকনিশিয়ান", "فني ماهر معتمد"),
                T("Warranty on all repairs", "সমস্ত মেরামতে ওয়ারেন্টি", "ضمان على جميع الإصلاحات"),
                T("Free follow-up within 48 hours", "৪৮ ঘন্টার মধ্যে বিনামূল্যে ফলো-আপ", "متابعة مجانية خلال 48 ساعة"),
                T("Genuine parts guaranteed", "খাঁটি যন্ত্রাংশ নিশ্চিত", "قطع غيار أصلية مضمونة"),
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle size={15} className="text-green-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          {(addons as any[]).length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Plus size={18} className="text-primary" />
                {T("Service Add-ons", "অতিরিক্ত সার্ভিস", "إضافات الخدمة")}
              </h2>
              <div className="space-y-2.5">
                {(addons as any[]).filter(a => a.isActive).map((addon: any) => {
                  const selected = selectedAddons.includes(addon.id);
                  const addonName = language === 'bn' ? addon.nameBn : language === 'ar' ? addon.nameAr : addon.nameEn;
                  return (
                    <motion.button
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      whileTap={{ scale: 0.98 }}
                      data-testid={`addon-${addon.id}`}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-sm ${
                        selected
                          ? 'border-primary bg-primary/8 text-primary'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                          {selected && <CheckCircle size={12} className="text-white" />}
                        </div>
                        <span className="font-medium">{addonName}</span>
                      </div>
                      <span className="font-bold text-primary">+{addon.priceSar} SAR</span>
                    </motion.button>
                  );
                })}
              </div>
              {selectedAddons.length > 0 && (
                <div className="mt-3 p-3 bg-primary/5 rounded-xl flex justify-between text-sm font-bold">
                  <span>{T("Add-ons total", "অ্যাড-অন মোট", "مجموع الإضافات")}</span>
                  <span className="text-primary">+{addonTotal} SAR</span>
                </div>
              )}
            </div>
          )}

          {/* Available Technicians */}
          <div className="glass rounded-2xl p-5">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Users size={18} className="text-primary" />
              {T("Available Technicians", "উপলব্ধ টেকনিশিয়ান", "الفنيون المتاحون")}
            </h2>
            {relevantTechs.length === 0 ? (
              <p className="text-muted-foreground text-sm">{T("Checking availability…", "পরীক্ষা করা হচ্ছে…", "جاري التحقق…")}</p>
            ) : (
              <div className="space-y-3">
                {relevantTechs.slice(0, 3).map((tech: any) => (
                  <div key={tech.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold shrink-0">
                      {tech.user?.fullName?.charAt(0) || "T"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{tech.user?.fullName || "Technician"}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StarRow rating={parseFloat(tech.rating) || 0} size={11} />
                        <span className="text-xs text-muted-foreground">{tech.rating || "0"}</span>
                        <span className="text-xs text-muted-foreground">· {tech.totalJobs} {T("jobs", "কাজ", "وظيفة")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{tech.specialization}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {tech.user?.phone && (
                        <>
                          <a href={`tel:${tech.user.phone}`} className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center hover:bg-primary/20 transition-colors">
                            <Phone size={13} />
                          </a>
                          <a href={`https://wa.me/${tech.user.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="w-8 h-8 bg-green-500/10 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-500/20 transition-colors">
                            <MessageCircle size={13} />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Star size={18} className="text-amber-400" />
                {T("Customer Reviews", "গ্রাহক পর্যালোচনা", "تقييمات العملاء")}
              </h2>
              {avgRating > 0 && (
                <div className="text-right">
                  <p className="text-2xl font-black text-primary">{avgRating.toFixed(1)}</p>
                  <StarRow rating={avgRating} />
                </div>
              )}
            </div>
            {(serviceReviews as any[]).length === 0 ? (
              <p className="text-muted-foreground text-sm py-2">
                {T("No reviews yet. Be the first!", "কোনো রিভিউ নেই। প্রথম হন!", "لا توجد تقييمات بعد. كن الأول!")}
              </p>
            ) : (
              <div className="space-y-3">
                {(serviceReviews as any[]).slice(0, 5).map((r: any) => (
                  <div key={r.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StarRow rating={r.rating} size={12} />
                      <span className="text-xs text-muted-foreground font-medium">#{r.userId}</span>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR (desktop) ── */}
        <div className="hidden md:block space-y-4">
          <div className="glass rounded-2xl p-5 sticky top-24">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">{T("Total Price", "মোট মূল্য", "السعر الإجمالي")}</p>
              <p className="text-4xl font-black text-primary mt-1">{totalPrice}</p>
              <p className="text-base text-muted-foreground font-medium">SAR</p>
              {selectedAddons.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {basePrice} + {addonTotal} SAR {T("add-ons", "অ্যাড-অন", "إضافات")}
                </p>
              )}
            </div>
            <Link
              href={user ? bookHref : "/profile"}
              data-testid="button-book-now-sidebar"
              className="w-full py-3.5 bg-primary text-primary-foreground font-black rounded-xl flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all shadow-lg"
              onClick={() => {
                if (!user) toast({ title: "Please log in first", variant: "destructive" });
              }}
            >
              {T("Book Technician", "বুক করুন", "احجز الفني")}
              <ChevronRight size={18} />
            </Link>
            <a
              href={`https://wa.me/966542418449?text=${whatsappMsg}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 w-full py-3 bg-green-500/10 text-green-700 dark:text-green-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-500/20 transition-colors"
            >
              <MessageCircle size={16} />
              {T("WhatsApp Enquiry", "হোয়াটসঅ্যাপ করুন", "استفسر واتساب")}
            </a>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Shield size={13} className="text-green-500" />{T("Certified & insured", "সার্টিফাইড", "معتمد ومؤمن")}</div>
              <div className="flex items-center gap-2"><Clock size={13} className="text-primary" />{T("1-2 hour service", "১-২ ঘন্টা সার্ভিস", "خدمة 1-2 ساعة")}</div>
              <div className="flex items-center gap-2"><MapPin size={13} className="text-amber-500" />{T("Jeddah coverage", "জেদ্দা কভারেজ", "تغطية جدة")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY BOOK BUTTON (mobile) ── */}
      <div className="fixed bottom-16 left-0 right-0 z-40 p-4 md:hidden bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{T("Total", "মোট", "المجموع")}</p>
            <p className="font-black text-xl text-primary">{totalPrice} SAR</p>
          </div>
          <Link
            href={user ? bookHref : "/profile"}
            data-testid="button-book-now-sticky"
            className="flex-1 py-3.5 bg-primary text-primary-foreground font-black rounded-xl flex items-center justify-center gap-1.5 shadow-xl"
          >
            {T("Book Now", "বুক করুন", "احجز الآن")}
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
