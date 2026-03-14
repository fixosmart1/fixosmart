import { useRoute, Link } from "wouter";
import { useTechnicianProfile } from "@/hooks/use-api";
import { Star, Wrench, Phone, CheckCircle, Clock, MapPin, ArrowLeft, Zap, Droplets, Wifi, Shield, Home } from "lucide-react";
import { motion } from "framer-motion";

const SPEC_ICONS: Record<string, any> = {
  AC: Zap,
  Electric: Zap,
  Plumbing: Droplets,
  "Smart Home": Wifi,
  Security: Shield,
  Appliance: Wrench,
};

const SPEC_COLORS: Record<string, string> = {
  AC: "from-blue-500 to-cyan-400",
  Electric: "from-yellow-500 to-amber-400",
  Plumbing: "from-blue-600 to-blue-400",
  "Smart Home": "from-purple-500 to-violet-400",
  Security: "from-slate-600 to-slate-400",
  Appliance: "from-emerald-500 to-green-400",
};

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={16}
          className={s <= Math.round(rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}
        />
      ))}
      <span className="font-bold text-sm">{Number(rating).toFixed(1)}</span>
      {count !== undefined && <span className="text-muted-foreground text-sm">({count} reviews)</span>}
    </div>
  );
}

export function TechnicianProfile() {
  const [, params] = useRoute("/technician/:id");
  const id = params?.id ? Number(params.id) : undefined;
  const { data: tech, isLoading, isError } = useTechnicianProfile(id);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-48 glass rounded-3xl animate-pulse" />
        <div className="h-32 glass rounded-2xl animate-pulse" />
        <div className="h-64 glass rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (isError || !tech) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Wrench className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-40" />
        <h2 className="text-2xl font-bold mb-2">Technician not found</h2>
        <Link href="/services" className="text-primary hover:underline">Browse services</Link>
      </div>
    );
  }

  const SpecIcon = SPEC_ICONS[tech.specialization] || Wrench;
  const gradientClass = SPEC_COLORS[tech.specialization] || "from-primary to-primary/60";
  const displayName = tech.user?.fullName || "Technician";
  const reviews: any[] = tech.reviews || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <Link href="/services" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
        <ArrowLeft size={16} /> Back to Services
      </Link>

      {/* Hero Card */}
      <div className={`rounded-3xl bg-gradient-to-br ${gradientClass} p-8 text-white relative overflow-hidden`}>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white shrink-0">
            {tech.user?.profilePhoto ? (
              <img src={tech.user.profilePhoto} alt={displayName} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <span className="text-3xl font-bold">{displayName.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <div className="flex items-center gap-2 mt-1 opacity-90">
              <SpecIcon size={14} />
              <span className="text-sm font-medium">{tech.specialization} Specialist</span>
            </div>
            <div className="mt-3">
              <StarRating rating={Number(tech.rating) || 0} count={reviews.length} />
            </div>
          </div>
          {tech.isAvailable && (
            <div className="shrink-0 px-3 py-1.5 bg-white/20 backdrop-blur rounded-full text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Available
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Jobs", value: tech.totalJobs || 0, icon: CheckCircle, color: "text-emerald-500" },
          { label: "Hourly Rate", value: `${tech.hourlyRate || 0} SAR`, icon: Clock, color: "text-blue-500" },
          { label: "Rating", value: `${Number(tech.rating || 0).toFixed(1)} ★`, icon: Star, color: "text-yellow-500" },
        ].map(stat => (
          <div key={stat.label} className="glass p-4 rounded-2xl text-center">
            <stat.icon size={20} className={`${stat.color} mx-auto mb-2`} />
            <div className="text-xl font-bold" data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* About */}
      {tech.bio && (
        <div className="glass p-6 rounded-2xl">
          <h2 className="font-semibold text-lg mb-3">About</h2>
          <p className="text-muted-foreground leading-relaxed">{tech.bio}</p>
        </div>
      )}

      {/* Reviews */}
      <div className="glass p-6 rounded-2xl">
        <h2 className="font-semibold text-lg mb-4">
          Customer Reviews
          {reviews.length > 0 && <span className="text-muted-foreground font-normal text-sm ml-2">({reviews.length})</span>}
        </h2>
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.slice(0, 5).map((review: any) => (
              <div key={review.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <StarRating rating={review.rating} />
                    {review.comment && <p className="text-sm mt-2 text-muted-foreground">{review.comment}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`/booking`}
        data-testid="button-book-technician"
        className="block w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl text-center hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20 text-lg"
      >
        Book This Technician
      </Link>
    </motion.div>
  );
}
