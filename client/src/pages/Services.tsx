import { useLanguage } from "@/hooks/use-language";
import { useServices } from "@/hooks/use-api";
import { Link } from "wouter";
import { Wrench, ArrowRight, Zap, Droplets, Wifi, Shield, RefrigeratorIcon, Star } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  AC:          { icon: Zap,              color: "text-blue-600",    bg: "bg-blue-100 dark:bg-blue-900/30" },
  Electric:    { icon: Zap,              color: "text-yellow-600",  bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  Plumbing:    { icon: Droplets,         color: "text-blue-500",    bg: "bg-cyan-100 dark:bg-cyan-900/30" },
  "Smart Home":{ icon: Wifi,             color: "text-purple-600",  bg: "bg-purple-100 dark:bg-purple-900/30" },
  Security:    { icon: Shield,           color: "text-slate-600",   bg: "bg-slate-100 dark:bg-slate-900/30" },
  Appliance:   { icon: RefrigeratorIcon, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
};

function getConfig(category: string) {
  return CATEGORY_CONFIG[category] || { icon: Wrench, color: "text-primary", bg: "bg-primary/10" };
}

export function Services() {
  const { t, language, isRtl } = useLanguage();
  const { data: services = [], isLoading } = useServices();

  const getLocalizedName = (service: any) => {
    if (language === 'bn') return service.nameBn;
    if (language === 'ar') return service.nameAr;
    return service.nameEn;
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground p-8 md:p-12 rounded-3xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold">{t('services')}</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-xl">
            Professional maintenance and repair services across Jeddah. Book certified technicians instantly.
          </p>
          <div className="flex gap-4 mt-6 flex-wrap">
            <div className="flex items-center gap-2 bg-white/15 rounded-full px-4 py-2 text-sm font-medium">
              <Star size={14} className="fill-yellow-400 text-yellow-400" /> Rated 4.8/5 by 2,400+ customers
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-full px-4 py-2 text-sm font-medium">
              <Shield size={14} /> Certified Technicians
            </div>
          </div>
        </div>
        <Wrench className="absolute -right-10 -bottom-10 w-64 h-64 text-white/10 rotate-12" />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-52 glass rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service: any, index: number) => {
            const cfg = getConfig(service.category);
            const Icon = cfg.icon;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                data-testid={`card-service-${service.id}`}
                className="glass p-6 rounded-2xl flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className="flex-1">
                  <div className={`w-12 h-12 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center mb-4`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="inline-block px-2 py-0.5 bg-muted text-muted-foreground text-xs font-bold rounded">
                      {service.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{getLocalizedName(service)}</h3>
                  {service.descriptionEn && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.descriptionEn}</p>
                  )}
                  <p className="text-2xl font-display font-bold text-primary">
                    {service.priceSar} <span className="text-base">SAR</span>
                    <span className="text-sm font-normal text-muted-foreground"> / service</span>
                  </p>
                </div>
                <Link
                  href={`/booking?serviceId=${service.id}`}
                  data-testid={`button-book-service-${service.id}`}
                  className="mt-5 w-full py-3 bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  {t('book_now')} <ArrowRight size={18} className={isRtl ? 'rotate-180' : ''} />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
