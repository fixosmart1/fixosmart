import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { useAuth, useServices, useProducts, useCreateBooking } from "@/hooks/use-api";
import { Check, ChevronRight, AlertTriangle } from "lucide-react";

export function Booking() {
  const { t, language, isRtl } = useLanguage();
  const [location, setLocation] = useLocation();
  const { data: user } = useAuth();
  const { data: services = [] } = useServices();
  const { data: products = [] } = useProducts();
  const createBooking = useCreateBooking();

  // Extract query params (mocking URLSearchParams for wouter simplicity if needed)
  const searchParams = new URLSearchParams(window.location.search);
  const type = searchParams.get('type');
  const initialServiceId = searchParams.get('serviceId');
  const initialProductId = searchParams.get('productId');

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceId: initialServiceId || "",
    productId: initialProductId || "",
    district: "",
    address: "",
    bookingDate: "",
    bookingTime: "",
    includeInstall: false
  });

  // Requires login
  if (user === undefined) return <div className="p-8 text-center animate-pulse">Loading...</div>;
  if (user === null) {
    return (
      <div className="text-center p-12 glass rounded-3xl max-w-md mx-auto mt-12">
        <h2 className="text-2xl font-bold mb-4">{t('login_required')}</h2>
        <button onClick={() => setLocation('/profile')} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl w-full">
          Go to Login
        </button>
      </div>
    );
  }

  const districts = ["Al-Safa", "Al-Hamra", "Al-Rawdah", "Obhur", "Al-Nazlah", "Al-Basateen", "Al-Marwah", "Al-Sharafiyah", "Al-Balad"];

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    let total = 0;
    if (formData.serviceId) {
      const s = services.find((s: any) => s.id.toString() === formData.serviceId);
      if (s) total += Number(s.priceSar);
    }
    if (formData.productId) {
      const p = products.find((p: any) => p.id.toString() === formData.productId);
      if (p) {
        total += Number(p.priceSar);
        if (formData.includeInstall) total += Number(p.installationFeeSar);
      }
    }

    try {
      await createBooking.mutateAsync({
        userId: user.id,
        serviceId: formData.serviceId ? parseInt(formData.serviceId) : null,
        productId: formData.productId ? parseInt(formData.productId) : null,
        district: formData.district,
        address: formData.address,
        bookingDate: formData.bookingDate,
        bookingTime: formData.bookingTime,
        languagePreference: language,
        totalAmountSar: total.toString()
      });
      // Mock WhatsApp redirect on success
      const msg = encodeURIComponent(`New Booking\nName: ${user.fullName}\nDate: ${formData.bookingDate}\nDist: ${formData.district}`);
      window.open(`https://wa.me/966500000000?text=${msg}`, '_blank');
      setLocation('/dashboard');
    } catch (err) {
      console.error(err);
      alert("Validation failed. Please fill all required fields.");
    }
  };

  const isEmergency = type === 'emergency';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-display font-bold">{isEmergency ? t('emergency_service') : t('booking')}</h1>
        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-2 rounded-full flex-1 max-w-[4rem] transition-colors ${step >= i ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <div className="glass p-6 md:p-8 rounded-3xl relative overflow-hidden">
        {isEmergency && (
          <div className="absolute top-0 left-0 right-0 bg-destructive text-destructive-foreground text-sm font-bold text-center py-2 flex items-center justify-center gap-2">
            <AlertTriangle size={16} /> EMERGENCY PRIORITY DISPATCH
          </div>
        )}
        
        <div className={isEmergency ? 'mt-8' : ''}>
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold">{t('select_service')}</h2>
              
              <div className="space-y-4">
                <label className="block text-sm font-medium">{t('services')}</label>
                <select 
                  className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  value={formData.serviceId}
                  onChange={e => setFormData({...formData, serviceId: e.target.value})}
                >
                  <option value="">-- Choose --</option>
                  {services.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.nameEn} ({s.priceSar} SAR)</option>
                  ))}
                </select>
              </div>

              {!isEmergency && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium">{t('products')}</label>
                  <select 
                    className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all outline-none"
                    value={formData.productId}
                    onChange={e => setFormData({...formData, productId: e.target.value})}
                  >
                    <option value="">-- None --</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nameEn} ({p.priceSar} SAR)</option>
                    ))}
                  </select>
                  
                  {formData.productId && (
                    <label className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-primary rounded"
                        checked={formData.includeInstall}
                        onChange={e => setFormData({...formData, includeInstall: e.target.checked})}
                      />
                      <span className="font-medium">{t('install_fee')}</span>
                    </label>
                  )}
                </div>
              )}

              <button 
                onClick={handleNext}
                disabled={!formData.serviceId && !formData.productId}
                className="w-full py-4 mt-8 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 flex justify-center items-center gap-2"
              >
                Next <ChevronRight size={20} className={isRtl ? 'rotate-180' : ''} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold">Location Details</h2>
              
              <div className="space-y-4">
                <label className="block text-sm font-medium">{t('district')}</label>
                <select 
                  className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all outline-none"
                  value={formData.district}
                  onChange={e => setFormData({...formData, district: e.target.value})}
                >
                  <option value="">Select District</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium">{t('address')}</label>
                <textarea 
                  className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all outline-none resize-none h-32"
                  placeholder="Street, Building No, Floor..."
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={handleBack} className="w-1/3 py-4 bg-muted text-muted-foreground font-bold rounded-xl">Back</button>
                <button 
                  onClick={handleNext}
                  disabled={!formData.district || !formData.address}
                  className="w-2/3 py-4 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold">Time & Confirmation</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t('date')}</label>
                  <input 
                    type="date" 
                    className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all outline-none"
                    value={formData.bookingDate}
                    onChange={e => setFormData({...formData, bookingDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t('time')}</label>
                  <input 
                    type="time" 
                    className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all outline-none"
                    value={formData.bookingTime}
                    onChange={e => setFormData({...formData, bookingTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-6 bg-muted/50 rounded-xl mt-6 space-y-3">
                <h3 className="font-bold border-b border-border pb-2 mb-2">Summary</h3>
                {formData.serviceId && <div className="flex justify-between text-sm"><span>Service</span><Check size={16} className="text-success" /></div>}
                {formData.productId && <div className="flex justify-between text-sm"><span>Product</span><Check size={16} className="text-success" /></div>}
                {formData.includeInstall && <div className="flex justify-between text-sm"><span>Installation</span><Check size={16} className="text-success" /></div>}
                <div className="pt-2 border-t border-border flex justify-between font-bold">
                  <span>To pay upon completion</span>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={handleBack} className="w-1/3 py-4 bg-muted text-muted-foreground font-bold rounded-xl">Back</button>
                <button 
                  onClick={handleSubmit}
                  disabled={!formData.bookingDate || !formData.bookingTime || createBooking.isPending}
                  className="w-2/3 py-4 bg-success text-success-foreground font-bold rounded-xl disabled:opacity-50 hover:bg-success/90 transition-colors shadow-lg shadow-success/20 flex justify-center items-center gap-2"
                >
                  {createBooking.isPending ? "Submitting..." : t('confirm_booking')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
