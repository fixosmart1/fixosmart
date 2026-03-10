import { useLanguage } from "@/hooks/use-language";
import { useServices } from "@/hooks/use-api";
import { Link } from "wouter";
import { Wrench, ArrowRight } from "lucide-react";

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
      <div className="bg-primary text-primary-foreground p-8 md:p-12 rounded-3xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold">{t('services')}</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-xl">
            Professional maintenance and repair services across Saudi Arabia. Book certified technicians instantly.
          </p>
        </div>
        <Wrench className="absolute -right-10 -bottom-10 w-64 h-64 text-white/10 rotate-12" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 glass rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.id} className="glass p-6 rounded-2xl flex flex-col hover:shadow-xl transition-all group">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center mb-4">
                  <Wrench size={24} />
                </div>
                <div className="inline-block px-2 py-1 bg-muted text-muted-foreground text-xs font-bold rounded mb-2">
                  {service.category}
                </div>
                <h3 className="text-xl font-bold mb-2">{getLocalizedName(service)}</h3>
                <p className="text-2xl font-display font-bold text-primary">{service.priceSar} SAR <span className="text-sm font-normal text-muted-foreground">/ hr</span></p>
              </div>
              <Link 
                href={`/booking?serviceId=${service.id}`}
                className="mt-6 w-full py-3 bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {t('book_now')} <ArrowRight size={18} className={isRtl ? 'rotate-180' : ''} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
