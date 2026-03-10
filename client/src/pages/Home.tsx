import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { ArrowRight, Wrench, Zap, Droplet, Home as HomeIcon, ShieldCheck, Clock } from "lucide-react";
import { motion } from "framer-motion";

export function Home() {
  const { t, isRtl } = useLanguage();

  const features = [
    { icon: Clock, title: "24/7 Service", desc: "Always available when you need us." },
    { icon: ShieldCheck, title: "Certified Pros", desc: "Vetted and trained professionals." },
    { icon: Zap, title: "Fast Response", desc: "Quick dispatch to your location." }
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden glass p-8 md:p-16 flex flex-col items-start justify-center min-h-[500px]">
        {/* landing page hero modern smart home abstract */}
        <img 
          src="https://images.unsplash.com/photo-1558002038-1055907df827?w=1920&h=1080&fit=crop" 
          alt="Smart Home" 
          className="absolute inset-0 w-full h-full object-cover opacity-10 dark:opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent dark:from-background dark:via-background/90 z-0"></div>
        
        <div className="relative z-10 max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-display font-extrabold text-foreground leading-tight"
          >
            {t('hero_title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-xl text-muted-foreground"
          >
            {t('hero_subtitle')}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link href="/booking" className="px-8 py-4 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2">
              {t('book_now')} <ArrowRight size={20} className={isRtl ? 'rotate-180' : ''} />
            </Link>
            <Link href="/services" className="px-8 py-4 rounded-xl font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all flex items-center gap-2">
              {t('explore_services')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Quick Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div key={i} className="glass p-6 rounded-2xl flex items-start gap-4">
            <div className="p-3 bg-accent/20 text-accent-foreground rounded-xl">
              <f.icon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">{f.title}</h3>
              <p className="text-muted-foreground text-sm mt-1">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Services Preview */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-display font-bold">{t('our_services')}</h2>
          <Link href="/services" className="text-primary font-medium hover:underline">{t('explore_services')}</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { icon: Wrench, title: "AC Repair", color: "bg-blue-500" },
            { icon: Zap, title: "Electrical", color: "bg-yellow-500" },
            { icon: Droplet, title: "Plumbing", color: "bg-cyan-500" },
            { icon: HomeIcon, title: "Smart Home", color: "bg-purple-500" },
          ].map((s, i) => (
            <Link key={i} href={`/booking?service=${s.title}`} className="group relative overflow-hidden rounded-2xl glass p-6 aspect-square flex flex-col items-center justify-center text-center hover:border-primary transition-colors">
              <div className={`w-16 h-16 rounded-full ${s.color} text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <s.icon size={32} />
              </div>
              <h3 className="font-bold text-foreground">{s.title}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
