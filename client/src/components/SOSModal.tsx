import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";
import { useAuth, useCreateBooking, useTechnicians } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import {
  X, Zap, Droplets, Wind, Lock, Camera, MapPin,
  ChevronRight, Star, Phone, MessageCircle, Clock,
  CheckCircle, Navigation, AlertTriangle, Loader2
} from "lucide-react";

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

const DISTRICTS = ["Al-Safa", "Al-Hamra", "Al-Rawdah", "Obhur", "Al-Nazlah", "Al-Basateen", "Al-Marwah", "Al-Sharafiyah", "Al-Balad"];

const MOCK_TECHNICIANS = [
  { name: "Ahmed Al-Rashidi", rating: 4.9, distance: "1.8 km", specialty: "Electrical", eta: 12, avatar: "A" },
  { name: "Mohammed Al-Harbi", rating: 4.8, distance: "2.3 km", specialty: "AC & HVAC", eta: 18, avatar: "M" },
  { name: "Karim Hassan", rating: 4.7, distance: "3.1 km", specialty: "Plumbing", eta: 22, avatar: "K" },
];

const slideUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { type: "spring", stiffness: 300, damping: 30 },
};

const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
const cardVariant = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
};

export function SOSModal({ isOpen, onClose }: SOSModalProps) {
  const { language, isRtl } = useLanguage();
  const { data: user } = useAuth();
  const { data: technicians = [] } = useTechnicians();
  const createBooking = useCreateBooking();
  const { toast } = useToast();

  const [step, setStep] = useState(1); // 1=select 2=location 3=confirm 4=searching 5=found 6=tracking
  const [selectedType, setSelectedType] = useState<typeof EMERGENCY_TYPES[0] | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [foundTech, setFoundTech] = useState<typeof MOCK_TECHNICIANS[0] | null>(null);
  const [etaCountdown, setEtaCountdown] = useState(0);
  const [techPos, setTechPos] = useState({ x: 80, y: 15 });
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const techAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedType(null);
      setSelectedDistrict("");
      setAddress("");
      setFoundTech(null);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (techAnimRef.current) clearInterval(techAnimRef.current);
    }
  }, [isOpen]);

  // Auto-progress step 4 → 5
  useEffect(() => {
    if (step === 4) {
      const t = setTimeout(() => {
        const tech = MOCK_TECHNICIANS[0];
        setFoundTech(tech);
        setEtaCountdown(tech.eta * 60);
        setStep(5);
      }, 3200);
      return () => clearTimeout(t);
    }
  }, [step]);

  // ETA countdown on step 6
  useEffect(() => {
    if (step === 6) {
      countdownRef.current = setInterval(() => {
        setEtaCountdown(s => (s > 0 ? s - 1 : 0));
      }, 1000);
      // Animate technician marker toward center
      techAnimRef.current = setInterval(() => {
        setTechPos(p => ({
          x: p.x + (45 - p.x) * 0.04,
          y: p.y + (48 - p.y) * 0.04,
        }));
      }, 100);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (techAnimRef.current) clearInterval(techAnimRef.current);
    };
  }, [step]);

  const getTitle = (item: typeof EMERGENCY_TYPES[0]) =>
    language === 'bn' ? item.titleBn : language === 'ar' ? item.titleAr : item.titleEn;
  const getDesc = (item: typeof EMERGENCY_TYPES[0]) =>
    language === 'bn' ? item.descBn : language === 'ar' ? item.descAr : item.descEn;

  const fmtEta = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  const handleConfirm = async () => {
    if (!user || !selectedType || !selectedDistrict) return;
    setStep(4);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate());
      await createBooking.mutateAsync({
        userId: user.id,
        serviceId: null,
        productId: null,
        district: selectedDistrict,
        address: address || selectedDistrict,
        notes: `EMERGENCY: ${selectedType.titleEn}`,
        bookingDate: new Date().toISOString().split('T')[0],
        bookingTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        languagePreference: language,
        totalAmountSar: "185",
        promoCode: null,
        discountSar: "0",
      });
    } catch (_) {
      // Continue the UX flow even if booking fails
    }
  };

  const handleGoToTracking = () => {
    setStep(6);
    setTechPos({ x: 80, y: 15 });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="sos-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          key="sos-panel"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="w-full max-w-lg bg-card rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: "96vh", minHeight: "70vh", direction: isRtl ? 'rtl' : 'ltr' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                SOS
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">
                  {language === 'ar' ? 'مساعدة منزلية طارئة' : language === 'bn' ? 'জরুরি হোম সাহায্য' : 'Emergency Home Help'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'خدمة طوارئ FixoSmart' : language === 'bn' ? 'FixoSmart জরুরি সেবা' : 'FixoSmart Emergency Service'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Step progress */}
          <div className="flex gap-1 px-5 pb-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className={`h-1 rounded-full flex-1 transition-all duration-500 ${step >= i ? 'bg-destructive' : 'bg-muted'}`} />
            ))}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            <AnimatePresence mode="wait">

              {/* ── STEP 1: Emergency Type ── */}
              {step === 1 && (
                <motion.div key="step1" {...slideUp}>
                  <p className="text-sm text-muted-foreground mb-4">
                    {language === 'ar' ? 'حدد نوع الطارئ' : language === 'bn' ? 'জরুরি সমস্যা বাছাই করুন' : 'Select your emergency type'}
                  </p>
                  <motion.div className="space-y-3" variants={stagger} initial="initial" animate="animate">
                    {EMERGENCY_TYPES.map(et => (
                      <motion.button
                        key={et.id}
                        variants={cardVariant}
                        onClick={() => { setSelectedType(et); setStep(2); }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 bg-gradient-to-r ${et.color} ${et.border} hover:scale-[1.02] active:scale-[0.98] transition-all text-${isRtl ? 'right' : 'left'}`}
                      >
                        <div className={`w-12 h-12 ${et.iconBg} rounded-2xl flex items-center justify-center text-2xl shrink-0`}>
                          {et.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight">{getTitle(et)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{getDesc(et)}</p>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* ── STEP 2: Location ── */}
              {step === 2 && (
                <motion.div key="step2" {...slideUp} className="space-y-5">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                    <MapPin size={20} className="text-primary shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">
                        {language === 'ar' ? 'موقعك' : language === 'bn' ? 'আপনার অবস্থান' : 'Your Location'}
                      </p>
                      <p className="text-xs text-muted-foreground">Jeddah, Saudi Arabia ✓</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {language === 'ar' ? 'اختر الحي' : language === 'bn' ? 'এলাকা বেছে নিন' : 'Select District'}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {DISTRICTS.map(d => (
                        <button
                          key={d}
                          onClick={() => setSelectedDistrict(d)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-medium border-2 transition-all ${
                            selectedDistrict === d
                              ? 'bg-destructive text-white border-destructive scale-[1.03]'
                              : 'border-border hover:border-destructive/50 hover:bg-destructive/5'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {language === 'ar' ? 'أدخل العنوان' : language === 'bn' ? 'ঠিকানা লিখুন' : 'Manual Address (optional)'}
                    </p>
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder={language === 'ar' ? 'مثال: شقة 4، برج النور، الصفا' : 'e.g. Apt 4, Al-Nour Tower, Al-Safa'}
                      className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-destructive outline-none text-sm transition-colors"
                    />
                  </div>

                  <button
                    onClick={() => selectedDistrict && setStep(3)}
                    disabled={!selectedDistrict}
                    className="w-full py-4 bg-destructive text-white font-bold rounded-2xl disabled:opacity-40 hover:bg-destructive/90 active:scale-[0.98] transition-all shadow-lg shadow-destructive/30"
                  >
                    {language === 'ar' ? 'التالي' : language === 'bn' ? 'পরবর্তী' : 'Continue →'}
                  </button>
                </motion.div>
              )}

              {/* ── STEP 3: Confirmation ── */}
              {step === 3 && selectedType && (
                <motion.div key="step3" {...slideUp} className="space-y-4">
                  {/* Summary card */}
                  <div className="rounded-2xl bg-muted/50 border border-border overflow-hidden">
                    <div className="px-4 py-3 bg-destructive/10 border-b border-border flex items-center gap-2">
                      <AlertTriangle size={16} className="text-destructive" />
                      <span className="text-sm font-bold text-destructive">
                        {language === 'ar' ? 'أولوية الطوارئ' : language === 'bn' ? 'জরুরি অগ্রাধিকার' : 'Emergency Priority'}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {language === 'ar' ? 'المشكلة' : language === 'bn' ? 'সমস্যা' : 'Problem'}
                        </span>
                        <span className="text-sm font-semibold flex items-center gap-1.5">
                          <span>{selectedType.icon}</span>
                          <span className="truncate max-w-[160px]">{getTitle(selectedType)}</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {language === 'ar' ? 'المنطقة' : language === 'bn' ? 'এলাকা' : 'Location'}
                        </span>
                        <span className="text-sm font-semibold flex items-center gap-1"><MapPin size={12} />{selectedDistrict}</span>
                      </div>
                      {address && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">
                            {language === 'ar' ? 'العنوان' : language === 'bn' ? 'ঠিকানা' : 'Address'}
                          </span>
                          <span className="text-sm font-semibold text-right max-w-[160px]">{address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ETA + Price */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-center">
                      <Clock size={20} className="mx-auto mb-1.5 text-primary" />
                      <p className="text-lg font-bold">15–25</p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'ar' ? 'دقائق للوصول' : language === 'bn' ? 'মিনিটে পৌঁছাবে' : 'min arrival'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
                      <span className="text-xl font-bold block mb-1">💰</span>
                      <p className="text-lg font-bold">120–250</p>
                      <p className="text-xs text-muted-foreground">SAR estimated</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    {language === 'ar' ? 'سيتصل بك الفني عند التأكيد' : language === 'bn' ? 'নিশ্চিত করার পর টেকনিশিয়ান যোগাযোগ করবে' : 'Technician will contact you upon confirmation'}
                  </p>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleConfirm}
                    disabled={createBooking.isPending}
                    className="w-full py-4 bg-destructive text-white font-bold text-base rounded-2xl shadow-lg shadow-destructive/40 hover:bg-destructive/90 transition-all flex items-center justify-center gap-2"
                  >
                    {createBooking.isPending ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Zap size={18} />
                        {language === 'ar' ? 'طلب فني طارئ' : language === 'bn' ? 'জরুরি টেকনিশিয়ান অনুরোধ' : 'Request Emergency Technician'}
                      </>
                    )}
                  </motion.button>

                  <button onClick={() => setStep(2)} className="w-full text-center text-sm text-muted-foreground py-2 hover:text-foreground transition-colors">
                    ← {language === 'ar' ? 'عدّل الموقع' : language === 'bn' ? 'পরিবর্তন করুন' : 'Change location'}
                  </button>
                </motion.div>
              )}

              {/* ── STEP 4: Searching (radar) ── */}
              {step === 4 && (
                <motion.div key="step4" {...slideUp} className="flex flex-col items-center justify-center py-8 space-y-6">
                  {/* Radar animation */}
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    {[1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        className="absolute rounded-full border-2 border-destructive/40"
                        initial={{ width: 40, height: 40, opacity: 0.8 }}
                        animate={{ width: 144, height: 144, opacity: 0 }}
                        transition={{ duration: 2, delay: i * 0.65, repeat: Infinity, ease: "easeOut" }}
                      />
                    ))}
                    <div className="w-14 h-14 bg-destructive rounded-full flex items-center justify-center shadow-lg shadow-destructive/50 z-10">
                      <Navigation size={26} className="text-white" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-bold">
                      {language === 'ar' ? 'جارٍ البحث عن أقرب فني...' : language === 'bn' ? 'নিকটতম টেকনিশিয়ান খোঁজা হচ্ছে...' : 'Finding nearest technician...'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? `بناءً على موقعك في ${selectedDistrict}` : language === 'bn' ? `${selectedDistrict} এলাকায় খোঁজা হচ্ছে` : `Searching in ${selectedDistrict} area`}
                    </p>
                    <div className="flex justify-center gap-1.5 mt-3">
                      {[0,1,2].map(i => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-destructive rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.7, delay: i * 0.2, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 5: Technician Found ── */}
              {step === 5 && foundTech && (
                <motion.div key="step5" {...slideUp} className="space-y-5">
                  {/* Success badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-green-500/10 border border-green-500/30 rounded-2xl mx-auto w-fit"
                  >
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      {language === 'ar' ? 'تم العثور على فني!' : language === 'bn' ? 'টেকনিশিয়ান পাওয়া গেছে!' : 'Technician Found!'}
                    </span>
                  </motion.div>

                  {/* Technician card */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 28 }}
                    className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground text-2xl font-bold shrink-0">
                        {foundTech.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-base">{foundTech.name}</p>
                        <p className="text-sm text-muted-foreground">{foundTech.specialty}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-0.5 text-sm font-semibold">
                            <Star size={13} className="fill-amber-400 text-amber-400" /> {foundTech.rating}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <MapPin size={11} /> {foundTech.distance}
                          </span>
                          <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                            <Clock size={11} /> ~{foundTech.eta} min
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4">
                      <a href={`tel:+966500000000`} className="flex-1 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center gap-2 text-sm font-semibold text-primary transition-colors">
                        <Phone size={15} /> {language === 'ar' ? 'اتصل' : language === 'bn' ? 'কল' : 'Call'}
                      </a>
                      <a href={`https://wa.me/966500000000`} target="_blank" rel="noreferrer" className="flex-1 py-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400 transition-colors">
                        <MessageCircle size={15} /> WhatsApp
                      </a>
                    </div>
                  </motion.div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleGoToTracking}
                    className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/30 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Navigation size={18} />
                    {language === 'ar' ? 'تتبع الفني' : language === 'bn' ? 'লাইভ ট্র্যাক করুন' : 'Track Technician Live'}
                  </motion.button>
                </motion.div>
              )}

              {/* ── STEP 6: Live Tracking ── */}
              {step === 6 && foundTech && (
                <motion.div key="step6" {...slideUp} className="space-y-4">
                  {/* Simulated map */}
                  <div className="relative h-52 rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-slate-100 to-blue-50 dark:from-slate-800 dark:to-blue-950">
                    {/* Map grid lines */}
                    <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                    {/* Road lines */}
                    <div className="absolute inset-0 opacity-30">
                      <div className="absolute bg-slate-400 dark:bg-slate-500" style={{top:'30%',left:0,right:0,height:2}} />
                      <div className="absolute bg-slate-400 dark:bg-slate-500" style={{top:'60%',left:0,right:0,height:2}} />
                      <div className="absolute bg-slate-400 dark:bg-slate-500" style={{top:0,bottom:0,left:'35%',width:2}} />
                      <div className="absolute bg-slate-400 dark:bg-slate-500" style={{top:0,bottom:0,left:'65%',width:2}} />
                    </div>
                    {/* Customer pin (center) */}
                    <div className="absolute" style={{left:'45%',top:'45%',transform:'translate(-50%,-50%)'}}>
                      <div className="relative">
                        <div className="w-5 h-5 bg-primary rounded-full border-3 border-white shadow-lg z-10 relative" />
                        <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping" />
                      </div>
                    </div>
                    {/* Technician marker */}
                    <motion.div
                      className="absolute"
                      animate={{ left: `${techPos.x}%`, top: `${techPos.y}%` }}
                      transition={{ duration: 0.5, ease: "linear" }}
                      style={{ transform: 'translate(-50%,-50%)' }}
                    >
                      <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center shadow-lg shadow-destructive/40 border-2 border-white">
                        <Zap size={14} className="text-white" />
                      </div>
                    </motion.div>
                    {/* ETA badge */}
                    <div className="absolute top-3 left-3 bg-card/90 backdrop-blur rounded-xl px-3 py-1.5 shadow-sm border border-border flex items-center gap-1.5">
                      <Clock size={13} className="text-primary" />
                      <span className="font-mono font-bold text-sm">{fmtEta(etaCountdown)}</span>
                      <span className="text-xs text-muted-foreground">{language === 'ar' ? 'متبقي' : language === 'bn' ? 'বাকি' : 'ETA'}</span>
                    </div>
                  </div>

                  {/* Technician mini card */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold shrink-0">
                      {foundTech.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{foundTech.name}</p>
                      <div className="flex items-center gap-2">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs">{foundTech.rating}</span>
                        <span className="text-xs text-muted-foreground">· {foundTech.specialty}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href="tel:+966500000000" className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
                        <Phone size={15} />
                      </a>
                      <a href="https://wa.me/966500000000" target="_blank" rel="noreferrer" className="w-9 h-9 bg-green-500/10 rounded-xl flex items-center justify-center text-green-700 dark:text-green-400 hover:bg-green-500/20 transition-colors">
                        <MessageCircle size={15} />
                      </a>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 py-2.5 px-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <motion.div
                      className="w-2.5 h-2.5 bg-green-500 rounded-full shrink-0"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      {language === 'ar' ? 'الفني في طريقه إليك' : language === 'bn' ? 'টেকনিশিয়ান আসছেন...' : 'Technician is on the way to you'}
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl border-2 border-border text-sm font-medium hover:bg-muted transition-colors text-muted-foreground"
                  >
                    {language === 'ar' ? 'إغلاق وإبقائه في الخلفية' : language === 'bn' ? 'বন্ধ করুন (ব্যাকগ্রাউন্ডে চলবে)' : 'Close & track in background'}
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
