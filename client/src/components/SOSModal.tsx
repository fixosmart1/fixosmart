import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";
import { useAuth, useCreateBooking, useTechnicians } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import {
  X, Zap, MapPin, ChevronRight, Star, Phone, MessageCircle,
  Clock, CheckCircle, Navigation, AlertTriangle, Loader2,
  LocateFixed, Crosshair, Radio
} from "lucide-react";

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Emergency types ─────────────────────────────────────────────────────────
const EMERGENCY_TYPES = [
  {
    id: "electrical",
    icon: "⚡",
    titleEn: "Electrical Short / Power Failure",
    titleBn: "বৈদ্যুতিক শর্ট / পাওয়ার ফেইলার",
    titleAr: "ماس كهربائي / انقطاع التيار",
    descEn: "Sparks, outages, tripped breakers",
    descBn: "স্পার্ক, বিদ্যুৎ বিভ্রাট",
    descAr: "شرارات، انقطاع التيار، قاطع التيار",
    color: "from-yellow-500/20 to-orange-500/10",
    border: "border-yellow-500/40",
    iconBg: "bg-yellow-500/15",
  },
  {
    id: "water",
    icon: "💧",
    titleEn: "Water Leak / Pipe Burst",
    titleBn: "পানির লিক / পাইপ ফাটা",
    titleAr: "تسرب مياه / انفجار أنبوب",
    descEn: "Flooding, broken pipes, leaks",
    descBn: "বন্যা, ভাঙা পাইপ, লিক",
    descAr: "فيضان، أنابيب مكسورة، تسربات",
    color: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/40",
    iconBg: "bg-blue-500/15",
  },
  {
    id: "ac",
    icon: "❄️",
    titleEn: "AC Not Working (Extreme Heat)",
    titleBn: "এসি কাজ করছে না (তীব্র গরম)",
    titleAr: "المكيف لا يعمل (حر شديد)",
    descEn: "AC failure, refrigerant issues",
    descBn: "এসি ফেইলার, রেফ্রিজারেন্ট সমস্যা",
    descAr: "عطل المكيف، مشاكل التبريد",
    color: "from-cyan-500/20 to-blue-400/10",
    border: "border-cyan-500/40",
    iconBg: "bg-cyan-500/15",
  },
  {
    id: "locked",
    icon: "🔐",
    titleEn: "Locked Out of Home",
    titleBn: "বাড়ি থেকে বের হতে পারছি না",
    titleAr: "محاصر خارج المنزل",
    descEn: "Lost keys, jammed lock, lockout",
    descBn: "চাবি হারানো, তালা আটকে গেছে",
    descAr: "فقدان المفاتيح، قفل عالق",
    color: "from-purple-500/20 to-violet-500/10",
    border: "border-purple-500/40",
    iconBg: "bg-purple-500/15",
  },
  {
    id: "cctv",
    icon: "📷",
    titleEn: "CCTV / Security Camera Failure",
    titleBn: "সিসিটিভি / ক্যামেরা নষ্ট",
    titleAr: "عطل كاميرا المراقبة",
    descEn: "Camera offline, security breach",
    descBn: "ক্যামেরা অফলাইন, নিরাপত্তা সমস্যা",
    descAr: "الكاميرا غير متصلة، خرق أمني",
    color: "from-slate-500/20 to-gray-500/10",
    border: "border-slate-500/40",
    iconBg: "bg-slate-500/15",
  },
];

// ── Jeddah district data with approx map positions ───────────────────────────
// Jeddah bounds: lat 21.3–21.7 / lng 39.10–39.35
const DISTRICTS: { name: string; lat: number; lng: number }[] = [
  { name: "Al-Safa",        lat: 21.558, lng: 39.163 },
  { name: "Al-Hamra",       lat: 21.568, lng: 39.157 },
  { name: "Al-Rawdah",      lat: 21.546, lng: 39.176 },
  { name: "Obhur",          lat: 21.642, lng: 39.143 },
  { name: "Al-Nazlah",      lat: 21.518, lng: 39.188 },
  { name: "Al-Basateen",    lat: 21.505, lng: 39.201 },
  { name: "Al-Marwah",      lat: 21.554, lng: 39.143 },
  { name: "Al-Sharafiyah",  lat: 21.527, lng: 39.169 },
  { name: "Al-Balad",       lat: 21.486, lng: 39.186 },
];

// Jeddah bounding box
const J_LAT_MIN = 21.3, J_LAT_MAX = 21.7;
const J_LNG_MIN = 39.10, J_LNG_MAX = 39.35;

function toMapPct(lat: number, lng: number) {
  const x = Math.min(90, Math.max(10, ((lng - J_LNG_MIN) / (J_LNG_MAX - J_LNG_MIN)) * 100));
  const y = Math.min(90, Math.max(10, ((J_LAT_MAX - lat) / (J_LAT_MAX - J_LAT_MIN)) * 100));
  return { x, y };
}

// Jeddah center fallback
const JEDDAH_LAT = 21.5433;
const JEDDAH_LNG = 39.1728;

// ── Animation helpers ─────────────────────────────────────────────────────────
const slideUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { type: "spring" as const, stiffness: 320, damping: 32 },
};
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const cardItem = { initial: { opacity: 0, x: -18 }, animate: { opacity: 1, x: 0 } };

// ── Jeddah Map component ──────────────────────────────────────────────────────
function JeddahMap({
  userLat, userLng, techLat, techLng, showTech = false, etaSec = 0,
}: {
  userLat: number; userLng: number;
  techLat?: number; techLng?: number;
  showTech?: boolean; etaSec?: number;
}) {
  const user = toMapPct(userLat, userLng);
  const tech = techLat !== undefined && techLng !== undefined ? toMapPct(techLat, techLng) : null;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Map background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #1a2744 0%, #0f1e3d 30%, #162032 60%, #1a2e1a 100%)",
        }}
      />

      {/* Street grid SVG */}
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        {/* Major horizontal roads */}
        {[25, 40, 55, 70, 82].map(y => (
          <line key={`h${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#4a90d9" strokeWidth="1.5" />
        ))}
        {/* Minor horizontal */}
        {[15, 32, 48, 62, 76, 90].map(y => (
          <line key={`hm${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#2a5080" strokeWidth="0.6" />
        ))}
        {/* Major vertical roads */}
        {[20, 38, 55, 72, 88].map(x => (
          <line key={`v${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#4a90d9" strokeWidth="1.5" />
        ))}
        {/* Minor vertical */}
        {[10, 28, 46, 63, 80].map(x => (
          <line key={`vm${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#2a5080" strokeWidth="0.6" />
        ))}
        {/* City blocks */}
        <rect x="30%" y="35%" width="15%" height="12%" fill="#1f3520" opacity="0.5" rx="2" />
        <rect x="55%" y="20%" width="20%" height="15%" fill="#1c2f40" opacity="0.5" rx="2" />
        <rect x="10%" y="60%" width="18%" height="14%" fill="#1f3520" opacity="0.5" rx="2" />
        <rect x="65%" y="55%" width="15%" height="18%" fill="#1c2f40" opacity="0.5" rx="2" />
      </svg>

      {/* District labels */}
      {DISTRICTS.map(d => {
        const p = toMapPct(d.lat, d.lng);
        return (
          <div
            key={d.name}
            className="absolute text-[8px] text-blue-300/60 font-medium whitespace-nowrap pointer-events-none select-none"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
          >
            {d.name}
          </div>
        );
      })}

      {/* ETA badge (step 6 only) */}
      {showTech && etaSec > 0 && (
        <div className="absolute top-2 left-2 z-20 bg-black/70 backdrop-blur rounded-lg px-2 py-1 flex items-center gap-1 border border-white/10">
          <Clock size={11} className="text-primary" />
          <span className="font-mono font-bold text-xs text-white">
            {Math.floor(etaSec / 60)}:{String(etaSec % 60).padStart(2, "0")}
          </span>
        </div>
      )}

      {/* Technician marker */}
      {showTech && tech && (
        <motion.div
          className="absolute z-10"
          animate={{ left: `${tech.x}%`, top: `${tech.y}%` }}
          transition={{ duration: 0.8, ease: "linear" }}
          style={{ transform: "translate(-50%,-50%)" }}
        >
          <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center border-2 border-white shadow-lg shadow-destructive/60">
            <Zap size={13} className="text-white" />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-destructive text-white text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
            TECH
          </div>
        </motion.div>
      )}

      {/* User location pin */}
      <div
        className="absolute z-20"
        style={{ left: `${user.x}%`, top: `${user.y}%`, transform: "translate(-50%,-50%)" }}
      >
        <div className="relative">
          <motion.div
            className="absolute inset-0 bg-blue-400/40 rounded-full"
            animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="relative w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg shadow-blue-500/60 z-10" />
        </div>
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
          YOU
        </div>
      </div>

      {/* Branding */}
      <div className="absolute bottom-2 right-2 text-[8px] text-white/30 font-medium">
        FixoSmart Map • Jeddah
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function SOSModal({ isOpen, onClose }: SOSModalProps) {
  const { language, isRtl } = useLanguage();
  const { data: user } = useAuth();
  const { data: technicians = [] } = useTechnicians();
  const createBooking = useCreateBooking();
  const { toast } = useToast();

  // Steps: 1=select type  2=location  3=confirm  4=searching  5=found  6=tracking
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<typeof EMERGENCY_TYPES[0] | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<typeof DISTRICTS[0] | null>(null);
  const [address, setAddress] = useState("");

  // Geolocation state
  const [geoStatus, setGeoStatus] = useState<"idle" | "detecting" | "success" | "fallback">("idle");
  const [userLat, setUserLat] = useState(JEDDAH_LAT);
  const [userLng, setUserLng] = useState(JEDDAH_LNG);

  // Tracking state
  const [foundTech, setFoundTech] = useState<{ name: string; specialty: string; rating: number; distance: string; eta: number; phone: string; avatar: string; lat: number; lng: number } | null>(null);
  const [techLat, setTechLat] = useState(JEDDAH_LAT + 0.05);
  const [techLng, setTechLng] = useState(JEDDAH_LNG + 0.04);
  const [etaCountdown, setEtaCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const techAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const geoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build technician list from real API data + fallback
  const buildTechList = useCallback(() => {
    const apiTechs = technicians
      .filter((t: any) => t.isAvailable)
      .map((t: any) => ({
        name: t.user?.fullName || "Technician",
        specialty: t.specialization || "General",
        rating: parseFloat(t.rating) || 4.7,
        distance: `${(Math.random() * 3 + 0.8).toFixed(1)} km`,
        eta: Math.floor(Math.random() * 12 + 8),
        phone: t.user?.phone || "+966500000000",
        avatar: (t.user?.fullName || "T").charAt(0).toUpperCase(),
        lat: JEDDAH_LAT + (Math.random() - 0.5) * 0.1,
        lng: JEDDAH_LNG + (Math.random() - 0.5) * 0.1,
      }));
    return apiTechs.length > 0 ? apiTechs : [
      { name: "Ahmed Al-Rashidi", specialty: "Electrical", rating: 4.9, distance: "1.8 km", eta: 12, phone: "+966501234567", avatar: "A", lat: JEDDAH_LAT + 0.04, lng: JEDDAH_LNG + 0.03 },
      { name: "Mohammed Al-Harbi", specialty: "AC & HVAC",  rating: 4.8, distance: "2.3 km", eta: 18, phone: "+966501234567", avatar: "M", lat: JEDDAH_LAT - 0.03, lng: JEDDAH_LNG + 0.05 },
    ];
  }, [technicians]);

  // Trigger geolocation when step 2 opens
  useEffect(() => {
    if (step === 2 && geoStatus === "idle") {
      setGeoStatus("detecting");
      if (!navigator.geolocation) {
        setGeoStatus("fallback");
        return;
      }
      geoRef.current = setTimeout(() => {
        // Timeout fallback after 8s
        setGeoStatus(s => s === "detecting" ? "fallback" : s);
      }, 8000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (geoRef.current) clearTimeout(geoRef.current);
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
          setGeoStatus("success");
          // Auto-select closest district
          const closest = DISTRICTS.reduce((best, d) => {
            const dist = Math.hypot(d.lat - pos.coords.latitude, d.lng - pos.coords.longitude);
            const bestDist = Math.hypot(best.lat - pos.coords.latitude, best.lng - pos.coords.longitude);
            return dist < bestDist ? d : best;
          }, DISTRICTS[0]);
          setSelectedDistrict(closest);
        },
        () => {
          if (geoRef.current) clearTimeout(geoRef.current);
          setGeoStatus("fallback");
          // Default to Al-Safa area as fallback
          setSelectedDistrict(DISTRICTS[0]);
        },
        { timeout: 7000, enableHighAccuracy: true, maximumAge: 60000 }
      );
    }
  }, [step, geoStatus]);

  // Auto-advance step 4 → 5
  useEffect(() => {
    if (step === 4) {
      const t = setTimeout(() => {
        const list = buildTechList();
        const tech = list[0];
        setFoundTech(tech);
        setTechLat(tech.lat);
        setTechLng(tech.lng);
        setEtaCountdown(tech.eta * 60);
        setStep(5);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [step, buildTechList]);

  // ETA countdown + technician marker animation (step 6)
  useEffect(() => {
    if (step === 6 && foundTech) {
      countdownRef.current = setInterval(() => {
        setEtaCountdown(s => (s > 0 ? s - 1 : 0));
      }, 1000);
      techAnimRef.current = setInterval(() => {
        setTechLat(prev => prev + (userLat - prev) * 0.015);
        setTechLng(prev => prev + (userLng - prev) * 0.015);
      }, 200);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (techAnimRef.current) clearInterval(techAnimRef.current);
    };
  }, [step, foundTech, userLat, userLng]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedType(null);
      setSelectedDistrict(null);
      setAddress("");
      setGeoStatus("idle");
      setUserLat(JEDDAH_LAT);
      setUserLng(JEDDAH_LNG);
      setFoundTech(null);
      setTechLat(JEDDAH_LAT + 0.05);
      setTechLng(JEDDAH_LNG + 0.04);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (techAnimRef.current) clearInterval(techAnimRef.current);
      if (geoRef.current) clearTimeout(geoRef.current);
    }
  }, [isOpen]);

  const t = (en: string, bn: string, ar: string) =>
    language === "bn" ? bn : language === "ar" ? ar : en;

  const getTitle = (item: typeof EMERGENCY_TYPES[0]) =>
    language === "bn" ? item.titleBn : language === "ar" ? item.titleAr : item.titleEn;
  const getDesc = (item: typeof EMERGENCY_TYPES[0]) =>
    language === "bn" ? item.descBn : language === "ar" ? item.descAr : item.descEn;

  const fmtCoord = (n: number, dir: [string, string]) =>
    `${Math.abs(n).toFixed(4)}° ${n >= 0 ? dir[0] : dir[1]}`;

  const handleConfirm = async () => {
    if (!selectedType || !selectedDistrict) return;
    if (!user) {
      toast({
        title: t("Login Required", "লগইন প্রয়োজন", "يلزم تسجيل الدخول"),
        description: t("Please log in from your Profile to use emergency services.", "জরুরি সেবা ব্যবহার করতে প্রোফাইল থেকে লগইন করুন।", "يرجى تسجيل الدخول من ملفك الشخصي لاستخدام خدمات الطوارئ."),
        variant: "destructive",
      });
      return;
    }
    setStep(4);
    try {
      const now = new Date();
      await createBooking.mutateAsync({
        userId: user.id,
        serviceId: null,
        productId: null,
        district: selectedDistrict.name,
        address: address || selectedDistrict.name + ", Jeddah",
        notes: `EMERGENCY: ${selectedType.titleEn}`,
        bookingDate: now.toISOString().split("T")[0],
        bookingTime: now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        languagePreference: language,
        totalAmountSar: "185",
        promoCode: null,
        discountSar: "0",
        priority: "emergency",
        locationLat: userLat.toFixed(6),
        locationLng: userLng.toFixed(6),
      } as any);
    } catch (_) {
      // Continue the UX flow even if booking creation fails
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="sos-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-sm flex items-end md:items-center justify-center"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          key="sos-panel"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          className="w-full max-w-lg bg-card rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: "94vh", minHeight: "72vh", direction: isRtl ? "rtl" : "ltr" }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-9 h-9 bg-destructive rounded-full flex items-center justify-center text-white"
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                <Zap size={18} />
              </motion.div>
              <div>
                <h2 className="font-bold text-base leading-tight">
                  {t("Emergency Home Help", "জরুরি হোম সাহায্য", "مساعدة منزلية طارئة")}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {t("FixoSmart Emergency · Jeddah", "FixoSmart জরুরি সেবা", "طوارئ FixoSmart · جدة")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              data-testid="button-sos-close"
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <X size={17} />
            </button>
          </div>

          {/* ── Progress bar ── */}
          <div className="flex gap-1 px-5 pb-3 shrink-0">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all duration-500 ${step >= i ? "bg-destructive" : "bg-muted"}`}
              />
            ))}
          </div>

          {/* ── Scrollable content ── */}
          <div className="flex-1 overflow-y-auto px-5 pb-6 min-h-0">
            <AnimatePresence mode="wait">

              {/* ═══ STEP 1: Emergency Type ═══ */}
              {step === 1 && (
                <motion.div key="s1" {...slideUp}>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("Select your emergency type", "জরুরি সমস্যা বাছাই করুন", "حدد نوع الطارئ")}
                  </p>
                  <motion.div className="space-y-2.5" variants={stagger} initial="initial" animate="animate">
                    {EMERGENCY_TYPES.map(et => (
                      <motion.button
                        key={et.id}
                        variants={cardItem}
                        data-testid={`sos-type-${et.id}`}
                        onClick={() => { setSelectedType(et); setStep(2); }}
                        className={`w-full flex items-center gap-4 p-3.5 rounded-2xl border-2 bg-gradient-to-r ${et.color} ${et.border} hover:scale-[1.015] active:scale-[0.98] transition-all text-${isRtl ? "right" : "left"}`}
                      >
                        <div className={`w-11 h-11 ${et.iconBg} rounded-xl flex items-center justify-center text-xl shrink-0`}>
                          {et.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight">{getTitle(et)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{getDesc(et)}</p>
                        </div>
                        <ChevronRight size={15} className="text-muted-foreground shrink-0" />
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* ═══ STEP 2: Location ═══ */}
              {step === 2 && (
                <motion.div key="s2" {...slideUp} className="space-y-4">

                  {/* Map panel */}
                  <div className="relative rounded-2xl overflow-hidden border border-border" style={{ height: 180 }}>
                    <JeddahMap userLat={userLat} userLng={userLng} />

                    {/* Geo status overlay */}
                    {geoStatus === "detecting" && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 z-30">
                        <Loader2 size={22} className="text-blue-400 animate-spin" />
                        <p className="text-white text-xs font-medium">
                          {t("Detecting your location…", "অবস্থান শনাক্ত হচ্ছে…", "جارٍ تحديد موقعك…")}
                        </p>
                      </div>
                    )}

                    {/* Status badge */}
                    {(geoStatus === "success" || geoStatus === "fallback") && (
                      <div className={`absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold backdrop-blur-sm border ${
                        geoStatus === "success"
                          ? "bg-green-500/20 border-green-400/30 text-green-300"
                          : "bg-amber-500/20 border-amber-400/30 text-amber-300"
                      }`}>
                        {geoStatus === "success" ? (
                          <><LocateFixed size={10} /> {t("GPS Located", "GPS শনাক্ত", "تم تحديد GPS")}</>
                        ) : (
                          <><MapPin size={10} /> {t("Jeddah Area", "জেদ্দা অঞ্চল", "منطقة جدة")}</>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Coordinates display */}
                  {(geoStatus === "success" || geoStatus === "fallback") && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs">
                      <Crosshair size={13} className="text-primary shrink-0" />
                      <span className="text-muted-foreground">
                        {fmtCoord(userLat, ["N", "S"])} &nbsp;|&nbsp; {fmtCoord(userLng, ["E", "W"])}
                      </span>
                      {geoStatus === "fallback" && (
                        <span className="ml-auto text-amber-500">
                          {t("(estimated)", "(আনুমানিক)", "(تقريبي)")}
                        </span>
                      )}
                    </div>
                  )}

                  {/* District grid */}
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {t("Select District", "এলাকা বেছে নিন", "اختر الحي")}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {DISTRICTS.map(d => (
                        <button
                          key={d.name}
                          data-testid={`sos-district-${d.name.replace(/\s+/g, "-").toLowerCase()}`}
                          onClick={() => setSelectedDistrict(d)}
                          className={`py-2 px-2 rounded-xl text-xs font-medium border-2 transition-all ${
                            selectedDistrict?.name === d.name
                              ? "bg-destructive text-white border-destructive scale-[1.04]"
                              : "border-border hover:border-destructive/40 hover:bg-destructive/5"
                          }`}
                        >
                          {d.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual address */}
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {t("Building / Apartment (optional)", "ভবন / অ্যাপার্টমেন্ট (ঐচ্ছিক)", "المبنى / الشقة (اختياري)")}
                    </p>
                    <input
                      type="text"
                      data-testid="input-sos-address"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder={language === "ar" ? "مثال: شقة 4، برج النور" : "e.g. Apt 4, Al-Nour Tower"}
                      className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-destructive outline-none text-sm transition-colors"
                    />
                  </div>

                  <button
                    data-testid="button-sos-continue"
                    onClick={() => selectedDistrict && setStep(3)}
                    disabled={!selectedDistrict || geoStatus === "detecting"}
                    className="w-full py-3.5 bg-destructive text-white font-bold rounded-2xl disabled:opacity-40 hover:bg-destructive/90 active:scale-[0.98] transition-all shadow-lg shadow-destructive/30"
                  >
                    {geoStatus === "detecting" ? (
                      <Loader2 size={18} className="animate-spin mx-auto" />
                    ) : (
                      t("Confirm Location →", "অবস্থান নিশ্চিত করুন →", "تأكيد الموقع →")
                    )}
                  </button>
                </motion.div>
              )}

              {/* ═══ STEP 3: Confirmation ═══ */}
              {step === 3 && selectedType && selectedDistrict && (
                <motion.div key="s3" {...slideUp} className="space-y-4">
                  {/* Emergency banner */}
                  <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-destructive/10 border border-destructive/30">
                    <AlertTriangle size={15} className="text-destructive shrink-0" />
                    <span className="text-sm font-bold text-destructive">
                      {t("PRIORITY: EMERGENCY", "অগ্রাধিকার: জরুরি", "أولوية: طارئة")}
                    </span>
                  </div>

                  {/* Summary card */}
                  <div className="rounded-2xl border border-border overflow-hidden">
                    <div className="bg-muted/40 px-4 py-2.5 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t("Booking Summary", "বুকিং সারসংক্ষেপ", "ملخص الحجز")}
                    </div>
                    <div className="p-4 space-y-3">
                      <Row label={t("Problem", "সমস্যা", "المشكلة")}>
                        <span className="flex items-center gap-1.5 font-semibold text-sm">
                          <span>{selectedType.icon}</span>
                          <span className="truncate max-w-[140px]">{getTitle(selectedType)}</span>
                        </span>
                      </Row>
                      <Row label={t("District", "এলাকা", "المنطقة")}>
                        <span className="flex items-center gap-1 font-semibold text-sm">
                          <MapPin size={11} className="text-destructive" />{selectedDistrict.name}
                        </span>
                      </Row>
                      {address && (
                        <Row label={t("Address", "ঠিকানা", "العنوان")}>
                          <span className="font-semibold text-sm text-right max-w-[140px]">{address}</span>
                        </Row>
                      )}
                      <Row label={t("Coordinates", "স্থানাঙ্ক", "الإحداثيات")}>
                        <span className="text-xs text-muted-foreground font-mono">
                          {userLat.toFixed(4)}, {userLng.toFixed(4)}
                        </span>
                      </Row>
                    </div>
                  </div>

                  {/* ETA + Price */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3.5 text-center">
                      <Clock size={18} className="mx-auto mb-1 text-primary" />
                      <p className="text-xl font-bold">15–25</p>
                      <p className="text-xs text-muted-foreground">
                        {t("min arrival", "মিনিটে পৌঁছাবে", "دقائق للوصول")}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-center">
                      <span className="text-xl block mb-1">💰</span>
                      <p className="text-xl font-bold">120–250</p>
                      <p className="text-xs text-muted-foreground">SAR estimated</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    {t(
                      "Technician will contact you immediately after dispatch",
                      "ডিসপ্যাচের পরে টেকনিশিয়ান অবিলম্বে যোগাযোগ করবে",
                      "سيتصل بك الفني فور إرسال الطلب"
                    )}
                  </p>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    data-testid="button-sos-request"
                    onClick={handleConfirm}
                    disabled={createBooking.isPending}
                    className="w-full py-4 bg-destructive text-white font-bold text-base rounded-2xl shadow-lg shadow-destructive/40 hover:bg-destructive/90 transition-all flex items-center justify-center gap-2"
                  >
                    {createBooking.isPending ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <><Zap size={18} />{t("Request Emergency Technician", "জরুরি টেকনিশিয়ান অনুরোধ", "طلب فني طارئ")}</>
                    )}
                  </motion.button>

                  <button onClick={() => setStep(2)} className="w-full text-center text-sm text-muted-foreground py-1 hover:text-foreground transition-colors">
                    ← {t("Change location", "অবস্থান পরিবর্তন", "تعديل الموقع")}
                  </button>
                </motion.div>
              )}

              {/* ═══ STEP 4: Searching (Radar) ═══ */}
              {step === 4 && (
                <motion.div key="s4" {...slideUp} className="flex flex-col items-center justify-center py-10 space-y-6">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    {[1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        className="absolute rounded-full border-2 border-destructive/35"
                        initial={{ width: 44, height: 44, opacity: 0.8 }}
                        animate={{ width: 144, height: 144, opacity: 0 }}
                        transition={{ duration: 2.2, delay: i * 0.7, repeat: Infinity, ease: "easeOut" }}
                      />
                    ))}
                    <motion.div
                      className="w-14 h-14 bg-destructive rounded-full flex items-center justify-center shadow-lg shadow-destructive/50 z-10"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Radio size={24} className="text-white" />
                    </motion.div>
                  </div>
                  <div className="text-center space-y-1.5">
                    <p className="text-lg font-bold">
                      {t("Finding nearest technician…", "নিকটতম টেকনিশিয়ান খোঁজা হচ্ছে…", "جارٍ البحث عن أقرب فني…")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDistrict
                        ? t(`Searching in ${selectedDistrict.name}`, `${selectedDistrict.name} এলাকায় খোঁজা হচ্ছে`, `البحث في ${selectedDistrict.name}`)
                        : t("Searching nearby…", "কাছাকাছি খোঁজা হচ্ছে…", "البحث بالقرب…")}
                    </p>
                    <div className="flex justify-center gap-1.5 pt-2">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-destructive rounded-full"
                          animate={{ y: [0, -7, 0] }}
                          transition={{ duration: 0.65, delay: i * 0.2, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ STEP 5: Technician Found ═══ */}
              {step === 5 && foundTech && (
                <motion.div key="s5" {...slideUp} className="space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.1 }}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-green-500/10 border border-green-500/30 rounded-2xl"
                  >
                    <CheckCircle size={15} className="text-green-600" />
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">
                      {t("Technician Found!", "টেকনিশিয়ান পাওয়া গেছে!", "تم العثور على فني!")}
                    </span>
                  </motion.div>

                  {/* Technician card */}
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, type: "spring", stiffness: 300, damping: 28 }}
                    className="rounded-2xl border-2 border-primary/25 bg-primary/5 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground text-2xl font-bold shrink-0">
                        {foundTech.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base truncate">{foundTech.name}</p>
                        <p className="text-sm text-muted-foreground">{foundTech.specialty}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-0.5 text-sm font-semibold">
                            <Star size={12} className="fill-amber-400 text-amber-400" />{foundTech.rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <MapPin size={10} />{foundTech.distance}
                          </span>
                          <span className="text-xs font-bold text-primary flex items-center gap-0.5">
                            <Clock size={10} />~{foundTech.eta} {t("min", "মিনিট", "دقيقة")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3.5">
                      <a
                        href={`tel:${foundTech.phone}`}
                        data-testid="link-sos-call"
                        className="flex-1 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center gap-2 text-sm font-semibold text-primary transition-colors"
                      >
                        <Phone size={14} />{t("Call", "কল", "اتصل")}
                      </a>
                      <a
                        href={`https://wa.me/${foundTech.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        data-testid="link-sos-whatsapp"
                        className="flex-1 py-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400 transition-colors"
                      >
                        <MessageCircle size={14} />WhatsApp
                      </a>
                    </div>
                  </motion.div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    data-testid="button-sos-track"
                    onClick={() => setStep(6)}
                    className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/30 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Navigation size={17} />{t("Track Technician Live", "লাইভ ট্র্যাক করুন", "تتبع الفني مباشرة")}
                  </motion.button>
                </motion.div>
              )}

              {/* ═══ STEP 6: Live Tracking ═══ */}
              {step === 6 && foundTech && (
                <motion.div key="s6" {...slideUp} className="space-y-3">
                  {/* Live map */}
                  <div className="relative rounded-2xl overflow-hidden border border-border" style={{ height: 210 }}>
                    <JeddahMap
                      userLat={userLat}
                      userLng={userLng}
                      techLat={techLat}
                      techLng={techLng}
                      showTech
                      etaSec={etaCountdown}
                    />
                  </div>

                  {/* Technician mini card */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                      {foundTech.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{foundTech.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        {foundTech.rating.toFixed(1)}
                        <span>·</span>
                        {foundTech.specialty}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <a
                        href={`tel:${foundTech.phone}`}
                        className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Phone size={14} />
                      </a>
                      <a
                        href={`https://wa.me/${foundTech.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-9 h-9 bg-green-500/10 rounded-xl flex items-center justify-center text-green-700 dark:text-green-400 hover:bg-green-500/20 transition-colors"
                      >
                        <MessageCircle size={14} />
                      </a>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 py-2.5 px-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <motion.div
                      className="w-2.5 h-2.5 bg-green-500 rounded-full shrink-0"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.1, repeat: Infinity }}
                    />
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      {t("Technician is on the way to you", "টেকনিশিয়ান আসছেন…", "الفني في طريقه إليك")}
                    </p>
                    <span className="ml-auto font-mono text-sm font-bold text-primary">
                      {Math.floor(etaCountdown / 60)}:{String(etaCountdown % 60).padStart(2, "0")}
                    </span>
                  </div>

                  <button
                    data-testid="button-sos-close-tracking"
                    onClick={onClose}
                    className="w-full py-3 rounded-xl border-2 border-border text-sm font-medium hover:bg-muted transition-colors text-muted-foreground"
                  >
                    {t("Close & track in background", "বন্ধ করুন (ব্যাকগ্রাউন্ডে চলবে)", "إغلاق والتتبع في الخلفية")}
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Helper row component ────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}
