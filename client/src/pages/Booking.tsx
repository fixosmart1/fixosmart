import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { useAuth, useServices, useProducts, useCreateBooking, useValidatePromo } from "@/hooks/use-api";
import { Check, ChevronRight, AlertTriangle, Tag, X, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Booking() {
  const { t, language, isRtl } = useLanguage();
  const [location, setLocation] = useLocation();
  const { data: user } = useAuth();
  const { data: services = [] } = useServices();
  const { data: products = [] } = useProducts();
  const createBooking = useCreateBooking();
  const validatePromo = useValidatePromo();
  const { toast } = useToast();

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
    notes: "",
    bookingDate: "",
    bookingTime: "",
    includeInstall: false,
    promoCode: "",
    discountPercent: 0,
    promoValidated: false,
  });
  const [useWallet, setUseWallet] = useState(false);

  const districts = ["Al-Safa", "Al-Hamra", "Al-Rawdah", "Obhur", "Al-Nazlah", "Al-Basateen", "Al-Marwah", "Al-Sharafiyah", "Al-Balad"];

  const calcSubtotal = () => {
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
    return total;
  };

  const referralDiscount = !!user?.discountAvailable && !formData.promoValidated;
  const walletBalance = parseFloat(user?.walletBalance || '0');

  const calcTotal = () => {
    const sub = calcSubtotal();
    const promoDiscount = formData.promoValidated ? Math.round(sub * formData.discountPercent / 100) : 0;
    const refDiscount = referralDiscount ? Math.round(sub * 10 / 100) : 0;
    const afterDiscount = sub - promoDiscount - refDiscount;
    const walletUsed = useWallet ? Math.min(walletBalance, afterDiscount) : 0;
    const discount = promoDiscount + refDiscount;
    return { sub, discount, promoDiscount, refDiscount, walletUsed, total: Math.max(0, afterDiscount - walletUsed) };
  };

  const handleApplyPromo = async () => {
    if (!formData.promoCode.trim()) return;
    try {
      const promo = await validatePromo.mutateAsync(formData.promoCode.trim());
      setFormData(f => ({ ...f, discountPercent: promo.discountPercent, promoValidated: true }));
      toast({ title: `Promo applied! -${promo.discountPercent}% discount` });
    } catch (err: any) {
      setFormData(f => ({ ...f, discountPercent: 0, promoValidated: false }));
      toast({ title: "Invalid promo code", description: err.message, variant: "destructive" });
    }
  };

  const clearPromo = () => {
    setFormData(f => ({ ...f, promoCode: "", discountPercent: 0, promoValidated: false }));
  };

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    const { sub, discount, total, refDiscount, walletUsed } = calcTotal();
    try {
      await createBooking.mutateAsync({
        userId: user!.id,
        serviceId: formData.serviceId ? parseInt(formData.serviceId) : null,
        productId: formData.productId ? parseInt(formData.productId) : null,
        district: formData.district,
        address: formData.address,
        notes: formData.notes || null,
        bookingDate: formData.bookingDate,
        bookingTime: formData.bookingTime,
        languagePreference: language,
        totalAmountSar: total.toString(),
        promoCode: formData.promoValidated ? formData.promoCode.toUpperCase() : null,
        discountSar: (discount + walletUsed).toString(),
      });
      if (refDiscount > 0) {
        await fetch('/api/referral/consume', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      }
      if (walletUsed > 0) {
        await fetch('/api/wallet/deduct', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: walletUsed }) });
      }
      toast({ title: "Booking confirmed! 🎉", description: `Total: ${total} SAR. We'll contact you soon.` });
      const msg = encodeURIComponent(`New Booking\nName: ${user!.fullName}\nDate: ${formData.bookingDate}\nDist: ${formData.district}\nTotal: ${total} SAR`);
      window.open(`https://wa.me/966500000000?text=${msg}`, '_blank');
      setLocation('/dashboard');
    } catch (err: any) {
      toast({ title: "Booking failed", description: err.message || "Please fill all required fields.", variant: "destructive" });
    }
  };

  const isEmergency = type === 'emergency';

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

  const { sub, discount, total, refDiscount, promoDiscount, walletUsed } = calcTotal();

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

      {referralDiscount && (
        <div className="glass border border-green-500/30 bg-green-50/50 dark:bg-green-900/10 rounded-2xl p-4 flex items-center gap-3" data-testid="banner-referral-discount">
          <Gift size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-700 dark:text-green-400 text-sm">10% Referral Discount Active!</p>
            <p className="text-xs text-muted-foreground">Your referral bonus will be deducted automatically from your total.</p>
          </div>
        </div>
      )}

      <div className="glass p-6 md:p-8 rounded-3xl relative overflow-hidden">
        {isEmergency && (
          <div className="absolute top-0 left-0 right-0 bg-destructive text-destructive-foreground text-sm font-bold text-center py-2 flex items-center justify-center gap-2">
            <AlertTriangle size={16} /> EMERGENCY PRIORITY DISPATCH
          </div>
        )}

        <div className={isEmergency ? 'mt-8' : ''}>
          {/* STEP 1 — Select Service/Product */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold">{t('select_service')}</h2>

              <div className="space-y-4">
                <label className="block text-sm font-medium">{t('services')}</label>
                <select
                  data-testid="select-service"
                  className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  value={formData.serviceId}
                  onChange={e => setFormData({ ...formData, serviceId: e.target.value })}
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
                    data-testid="select-product"
                    className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all outline-none"
                    value={formData.productId}
                    onChange={e => setFormData({ ...formData, productId: e.target.value })}
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
                        onChange={e => setFormData({ ...formData, includeInstall: e.target.checked })}
                      />
                      <span className="font-medium">{t('install_fee')}</span>
                    </label>
                  )}
                </div>
              )}

              <button
                data-testid="button-next-step1"
                onClick={handleNext}
                disabled={!formData.serviceId && !formData.productId}
                className="w-full py-4 mt-8 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 flex justify-center items-center gap-2"
              >
                Next <ChevronRight size={20} className={isRtl ? 'rotate-180' : ''} />
              </button>
            </div>
          )}

          {/* STEP 2 — Location Details + Notes */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold">Location Details</h2>

              <div className="space-y-4">
                <label className="block text-sm font-medium">{t('district')}</label>
                <select
                  data-testid="select-district"
                  className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all outline-none"
                  value={formData.district}
                  onChange={e => setFormData({ ...formData, district: e.target.value })}
                >
                  <option value="">Select District</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium">{t('address')}</label>
                <textarea
                  data-testid="input-address"
                  className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all outline-none resize-none h-28"
                  placeholder="Street, Building No, Floor..."
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium">Notes / Special Instructions</label>
                <textarea
                  data-testid="input-notes"
                  className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all outline-none resize-none h-24"
                  placeholder="e.g. Entry code, specific problem, preferred arrival time window..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-4 mt-8">
                <button data-testid="button-back-step2" onClick={handleBack} className="w-1/3 py-4 bg-muted text-muted-foreground font-bold rounded-xl">Back</button>
                <button
                  data-testid="button-next-step2"
                  onClick={handleNext}
                  disabled={!formData.district || !formData.address}
                  className="w-2/3 py-4 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Time, Promo & Confirmation */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold">Time & Confirmation</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t('date')}</label>
                  <input
                    data-testid="input-date"
                    type="date"
                    className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all outline-none"
                    value={formData.bookingDate}
                    onChange={e => setFormData({ ...formData, bookingDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t('time')}</label>
                  <input
                    data-testid="input-time"
                    type="time"
                    className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all outline-none"
                    value={formData.bookingTime}
                    onChange={e => setFormData({ ...formData, bookingTime: e.target.value })}
                  />
                </div>
              </div>

              {/* Promo Code */}
              <div className="space-y-2">
                <label className="block text-sm font-medium flex items-center gap-2"><Tag size={14} /> Promo Code</label>
                {formData.promoValidated ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500/30 rounded-xl">
                    <Check size={18} className="text-green-600 shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-green-700 dark:text-green-400">{formData.promoCode.toUpperCase()}</p>
                      <p className="text-xs text-green-600">{formData.discountPercent}% discount applied — saving {discount} SAR</p>
                    </div>
                    <button onClick={clearPromo} className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      data-testid="input-promo"
                      type="text"
                      className="flex-1 px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary outline-none transition-colors uppercase tracking-widest font-mono"
                      placeholder="WELCOME10"
                      value={formData.promoCode}
                      onChange={e => setFormData({ ...formData, promoCode: e.target.value })}
                    />
                    <button
                      data-testid="button-apply-promo"
                      onClick={handleApplyPromo}
                      disabled={!formData.promoCode.trim() || validatePromo.isPending}
                      className="px-5 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm disabled:opacity-50"
                    >
                      {validatePromo.isPending ? "..." : "Apply"}
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Try: WELCOME10 · EXPAT20 · JEDDAH15</p>
              </div>

              {/* Wallet Balance */}
              {walletBalance > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium flex items-center gap-2">
                    <span>💰</span> Wallet Balance ({walletBalance.toFixed(2)} SAR available)
                  </label>
                  <button
                    data-testid="button-toggle-wallet"
                    type="button"
                    onClick={() => setUseWallet(w => !w)}
                    className={`w-full p-3.5 rounded-xl border-2 font-medium text-sm flex items-center justify-between transition-all ${useWallet ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-border hover:border-primary/50'}`}
                  >
                    <span>{useWallet ? '✓ Using wallet credit' : 'Apply wallet balance'}</span>
                    <span className="font-mono">{useWallet ? `-${calcTotal().walletUsed.toFixed(2)} SAR` : `${walletBalance.toFixed(2)} SAR`}</span>
                  </button>
                </div>
              )}

              {/* Order Summary */}
              <div className="p-5 bg-muted/50 rounded-xl space-y-2">
                <h3 className="font-bold border-b border-border pb-2 mb-3">Order Summary</h3>
                {formData.serviceId && (() => {
                  const s = services.find((s: any) => s.id.toString() === formData.serviceId);
                  return s ? <div className="flex justify-between text-sm"><span>{s.nameEn}</span><span className="font-medium">{s.priceSar} SAR</span></div> : null;
                })()}
                {formData.productId && (() => {
                  const p = products.find((p: any) => p.id.toString() === formData.productId);
                  return p ? (
                    <>
                      <div className="flex justify-between text-sm"><span>{p.nameEn}</span><span className="font-medium">{p.priceSar} SAR</span></div>
                      {formData.includeInstall && <div className="flex justify-between text-sm"><span>Installation fee</span><span className="font-medium">{p.installationFeeSar} SAR</span></div>}
                    </>
                  ) : null;
                })()}
                {refDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1"><Gift size={13} /> Referral Discount (10% off)</span>
                    <span>-{refDiscount} SAR</span>
                  </div>
                )}
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Promo ({formData.discountPercent}% off)</span>
                    <span>-{promoDiscount} SAR</span>
                  </div>
                )}
                {walletUsed > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>💰 Wallet credit</span>
                    <span>-{walletUsed.toFixed(2)} SAR</span>
                  </div>
                )}
                <div className="pt-2 border-t border-border flex justify-between font-bold text-base">
                  <span>Total (to pay on completion)</span>
                  <span className="text-primary">{total} SAR</span>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button data-testid="button-back-step3" onClick={handleBack} className="w-1/3 py-4 bg-muted text-muted-foreground font-bold rounded-xl">Back</button>
                <button
                  data-testid="button-confirm-booking"
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
