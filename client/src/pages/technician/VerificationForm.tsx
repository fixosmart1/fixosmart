import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-api";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  User, Phone, Mail, MapPin, Briefcase, Clock, FileText, Image,
  Video, ChevronRight, ChevronLeft, CheckCircle, Upload, Plus, X,
  ShieldCheck, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SPECIALIZATIONS = ["AC", "Electric", "Plumbing", "Smart Home", "Security", "Appliance", "General"];

const SKILL_OPTIONS = [
  "AC Installation", "AC Maintenance", "AC Repair",
  "Electrical Wiring", "Circuit Breaker", "Solar Panel",
  "Pipe Fitting", "Leak Repair", "Water Heater",
  "Smart Locks", "CCTV", "Home Automation",
  "Washing Machine", "Refrigerator", "Dishwasher",
];

type StepId = 1 | 2 | 3;

const STEPS = [
  { id: 1 as StepId, label: "Personal Info", icon: User },
  { id: 2 as StepId, label: "Professional", icon: Briefcase },
  { id: 3 as StepId, label: "Documents", icon: FileText },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              done ? "bg-green-500 text-white" :
              active ? "bg-primary text-primary-foreground" :
              "bg-muted text-muted-foreground"
            }`}>
              {done ? <CheckCircle size={13} /> : <Icon size={13} />}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{step.id}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 rounded-full ${current > step.id ? "bg-green-500" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function VerificationForm() {
  const { data: user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<StepId>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — Personal
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [city, setCity] = useState(user?.city || "Jeddah");

  // Step 2 — Professional
  const [specialization, setSpecialization] = useState("");
  const [yearsExperience, setYearsExperience] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [bio, setBio] = useState("");

  // Step 3 — Documents
  const [govIdUrl, setGovIdUrl] = useState("");
  const [workCertUrl, setWorkCertUrl] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([""]);
  const [videoUrl, setVideoUrl] = useState("");

  const toggleSkill = (s: string) => {
    setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills(prev => [...prev, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const addPortfolioUrl = () => setPortfolioUrls(prev => [...prev, ""]);
  const updatePortfolioUrl = (i: number, val: string) => {
    setPortfolioUrls(prev => prev.map((u, idx) => idx === i ? val : u));
  };
  const removePortfolioUrl = (i: number) => {
    setPortfolioUrls(prev => prev.filter((_, idx) => idx !== i));
  };

  const canProceed = () => {
    if (step === 1) return fullName.trim().length > 0;
    if (step === 2) return specialization.length > 0 && bio.trim().length > 10;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/verify/apply", {
        fullName, phone, email, city,
        specialization, yearsExperience, skills: selectedSkills, bio,
        govIdUrl, workCertUrl, profilePhotoUrl,
        portfolioUrls: portfolioUrls.filter(u => u.trim()),
        videoUrl,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/verify/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      toast({ title: "Application submitted!", description: "We'll review your application and get back to you." });
      setLocation("/technician/verify-status");
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-12">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-primary rounded-3xl p-6 text-white mb-8 text-center relative overflow-hidden"
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <ShieldCheck size={36} className="mx-auto mb-3 relative z-10" />
        <h1 className="text-xl font-bold relative z-10">Technician Verification</h1>
        <p className="text-white/80 text-sm mt-1 relative z-10">Complete your application to join the FixoSmart network</p>
      </motion.div>

      <StepIndicator current={step} />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-2xl p-6 space-y-4"
          >
            <h2 className="font-bold text-lg flex items-center gap-2"><User size={18} className="text-primary" /> Personal Information</h2>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Full Name *</label>
              <input
                data-testid="input-verif-fullname"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full legal name"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Phone Number</label>
              <input
                data-testid="input-verif-phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+966 5X XXX XXXX"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email Address</label>
              <input
                data-testid="input-verif-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">City / Location</label>
              <input
                data-testid="input-verif-city"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Jeddah"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-2xl p-6 space-y-4"
          >
            <h2 className="font-bold text-lg flex items-center gap-2"><Briefcase size={18} className="text-primary" /> Professional Information</h2>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Service Specialization *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SPECIALIZATIONS.map(s => (
                  <button
                    key={s}
                    data-testid={`button-spec-${s}`}
                    onClick={() => setSpecialization(s)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                      specialization === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1 block">
                <Clock size={13} /> Years of Experience
              </label>
              <div className="flex items-center gap-3">
                <input
                  data-testid="input-verif-experience"
                  type="number"
                  min={0}
                  max={50}
                  value={yearsExperience}
                  onChange={e => setYearsExperience(Number(e.target.value))}
                  className="w-24 px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm text-center"
                />
                <span className="text-sm text-muted-foreground">years</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {SKILL_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSkill(s)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      selectedSkills.includes(s)
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {selectedSkills.includes(s) ? "✓ " : ""}{s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={customSkill}
                  onChange={e => setCustomSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomSkill()}
                  placeholder="Add custom skill..."
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button onClick={addCustomSkill} className="px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedSkills.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {s}
                      <button onClick={() => toggleSkill(s)}><X size={11} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Short Bio *</label>
              <textarea
                data-testid="input-verif-bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell us about your experience, expertise, and why customers should choose you..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">{bio.length} chars (min 10)</p>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-2xl p-6 space-y-5"
          >
            <h2 className="font-bold text-lg flex items-center gap-2"><FileText size={18} className="text-primary" /> Verification Documents</h2>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300">
              Upload your documents to Google Drive, Dropbox, or any cloud storage and paste the shareable link below.
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5 block">
                <FileText size={13} /> Government ID / Iqama URL
              </label>
              <input
                data-testid="input-verif-govid"
                value={govIdUrl}
                onChange={e => setGovIdUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5 block">
                <ShieldCheck size={13} /> Work Certificate / License URL
              </label>
              <input
                data-testid="input-verif-workcert"
                value={workCertUrl}
                onChange={e => setWorkCertUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5 block">
                <User size={13} /> Profile Photo URL
              </label>
              <input
                data-testid="input-verif-photo"
                value={profilePhotoUrl}
                onChange={e => setProfilePhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
              {profilePhotoUrl && (
                <img src={profilePhotoUrl} alt="Preview" className="mt-2 w-16 h-16 rounded-xl object-cover border border-border" onError={e => (e.currentTarget.style.display='none')} />
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5 block">
                <Image size={13} /> Portfolio Images (previous work)
              </label>
              <div className="space-y-2">
                {portfolioUrls.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={url}
                      onChange={e => updatePortfolioUrl(i, e.target.value)}
                      placeholder={`Image ${i + 1} URL`}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    />
                    {portfolioUrls.length > 1 && (
                      <button onClick={() => removePortfolioUrl(i)} className="px-3 py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addPortfolioUrl}
                className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                <Plus size={13} /> Add another image
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5 block">
                <Video size={13} /> Video Introduction URL <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                data-testid="input-verif-video"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/... or https://drive.google.com/..."
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button
            onClick={() => setStep(s => (s - 1) as StepId)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-border font-semibold text-sm hover:bg-muted/50 transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>
        )}
        {step < 3 ? (
          <button
            data-testid="button-verif-next"
            onClick={() => canProceed() && setStep(s => (s + 1) as StepId)}
            disabled={!canProceed()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl gradient-primary text-white font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button
            data-testid="button-verif-submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl gradient-primary text-white font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {submitting ? "Submitting..." : <><CheckCircle size={16} /> Submit Application</>}
          </button>
        )}
      </div>
    </div>
  );
}
