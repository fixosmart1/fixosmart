import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth, useIqamaTrackers, useCreateIqamaTracker, useDeleteIqamaTracker } from "@/hooks/use-api";
import { Calculator, Trash2, Plus, AlertCircle, FileText, Clock, Share2, RefreshCw } from "lucide-react";
import { differenceInDays } from "date-fns";

const PRAYER_TIMES = [
  { key: 'fajr',    nameEn: 'Fajr',    nameAr: 'الفجر',    nameBn: 'ফজর',    time: '05:12' },
  { key: 'dhuhr',   nameEn: 'Dhuhr',   nameAr: 'الظهر',    nameBn: 'যোহর',   time: '12:24' },
  { key: 'asr',     nameEn: 'Asr',     nameAr: 'العصر',    nameBn: 'আসর',    time: '15:45' },
  { key: 'maghrib', nameEn: 'Maghrib', nameAr: 'المغرب',   nameBn: 'মাগরিব', time: '18:31' },
  { key: 'isha',    nameEn: 'Isha',    nameAr: 'العشاء',   nameBn: 'ইশা',    time: '19:51' },
];

const SAR_RATE = 29.5;
const BDT_RATE_LABEL = '~29.5 BDT';

function getPrayerName(p: typeof PRAYER_TIMES[0], language: string) {
  if (language === 'ar') return p.nameAr;
  if (language === 'bn') return p.nameBn;
  return p.nameEn;
}

function getCurrentPrayer() {
  const now = new Date();
  const totalMins = now.getHours() * 60 + now.getMinutes();
  const toMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  for (let i = PRAYER_TIMES.length - 1; i >= 0; i--) {
    if (totalMins >= toMins(PRAYER_TIMES[i].time)) return PRAYER_TIMES[i].key;
  }
  return PRAYER_TIMES[PRAYER_TIMES.length - 1].key;
}

export function ExpatTools() {
  const { t, language } = useLanguage();
  const { data: user } = useAuth();
  const { data: iqamas = [] } = useIqamaTrackers();
  const createIqama = useCreateIqamaTracker();
  const deleteIqama = useDeleteIqamaTracker();

  const [sarAmount, setSarAmount] = useState<string>("100");
  const [iqamaForm, setIqamaForm] = useState({ number: "", expiry: "" });

  const currentPrayer = getCurrentPrayer();

  const handleAddIqama = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Login required");
    await createIqama.mutateAsync({
      userId: user.id,
      iqamaNumber: iqamaForm.number,
      expiryDate: iqamaForm.expiry
    });
    setIqamaForm({ number: "", expiry: "" });
  };

  const whatsappShare = () => {
    const text = encodeURIComponent("🇧🇩 FixoSmart — Smart Home Maintenance in Jeddah!\nBook AC, Electrical, Plumbing & Smart Gadget services.\nhttps://fixosmart.app");
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold">{t('tools')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">Useful tools for Bangladeshi expats in Jeddah, Saudi Arabia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Currency Converter ─────────────────────── */}
        <section className="glass p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 bg-primary/10 text-primary rounded-xl"><Calculator size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">{t('currency_converter')}</h2>
              <p className="text-xs text-muted-foreground">{t('sar_to_bdt')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Amount in SAR (Saudi Riyal)</label>
              <div className="relative">
                <input
                  data-testid="input-sar-amount"
                  type="number"
                  min="0"
                  className="w-full p-4 text-2xl font-bold rounded-xl bg-background border-2 border-border focus:border-primary outline-none transition-colors"
                  value={sarAmount}
                  onChange={e => setSarAmount(e.target.value)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">SAR</span>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">↓</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Amount in BDT (Bangladeshi Taka)</label>
              <div className="w-full p-4 text-2xl font-bold rounded-xl bg-accent/20 text-accent-foreground border-2 border-accent/30 flex justify-between items-center">
                <span data-testid="text-bdt-result">
                  {((Number(sarAmount) || 0) * SAR_RATE).toLocaleString('en-BD', { maximumFractionDigits: 2 })}
                </span>
                <span className="text-base font-normal text-muted-foreground">BDT</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
              <RefreshCw size={12} className="shrink-0" />
              <span>1 SAR = {BDT_RATE_LABEL}. Indicative rate only — check your bank for live rates.</span>
            </div>
          </div>
        </section>

        {/* ── Iqama Tracker ─────────────────────────── */}
        <section className="glass p-6 rounded-3xl flex flex-col">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl"><FileText size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">{t('iqama_tracker')}</h2>
              <p className="text-xs text-muted-foreground">Track your Iqama expiry</p>
            </div>
          </div>

          {!user ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm bg-muted/30 rounded-xl p-6 text-center">
              <div>
                <FileText size={32} className="mx-auto mb-2 opacity-30" />
                <p>Login to manage your Iqama records</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="space-y-2 flex-1 min-h-0">
                {iqamas.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-xl">No records yet. Add your Iqama below.</p>
                )}
                {iqamas.map(iq => {
                  const days = differenceInDays(new Date(iq.expiryDate), new Date());
                  const isUrgent = days < 30;
                  const isExpired = days < 0;
                  return (
                    <div
                      key={iq.id}
                      data-testid={`iqama-record-${iq.id}`}
                      className={`p-4 rounded-xl border flex items-center justify-between ${
                        isExpired ? 'bg-destructive/15 border-destructive/40' :
                        isUrgent  ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
                                    'bg-background border-border'
                      }`}
                    >
                      <div>
                        <div className="font-mono font-semibold text-sm">{iq.iqamaNumber}</div>
                        <div className={`text-sm mt-0.5 flex items-center gap-1 ${
                          isExpired ? 'text-destructive font-bold' :
                          isUrgent  ? 'text-amber-600 dark:text-amber-400 font-semibold' :
                                      'text-muted-foreground'
                        }`}>
                          {(isUrgent || isExpired) && <AlertCircle size={13} />}
                          {isExpired ? 'Expired' : `${days} ${t('days_left')}`}
                          <span className="text-muted-foreground font-normal ml-1">· {iq.expiryDate}</span>
                        </div>
                      </div>
                      <button
                        data-testid={`button-delete-iqama-${iq.id}`}
                        onClick={() => deleteIqama.mutate(iq.id)}
                        disabled={deleteIqama.isPending}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleAddIqama} className="pt-4 border-t border-border space-y-2">
                <div className="flex gap-2">
                  <input
                    data-testid="input-iqama-number"
                    type="text"
                    placeholder="Iqama number"
                    className="flex-1 p-3 text-sm rounded-lg bg-background border border-border outline-none focus:border-primary"
                    value={iqamaForm.number}
                    onChange={e => setIqamaForm({ ...iqamaForm, number: e.target.value })}
                    required
                  />
                  <input
                    data-testid="input-iqama-expiry"
                    type="date"
                    className="flex-1 p-3 text-sm rounded-lg bg-background border border-border outline-none focus:border-primary"
                    value={iqamaForm.expiry}
                    onChange={e => setIqamaForm({ ...iqamaForm, expiry: e.target.value })}
                    required
                  />
                  <button
                    data-testid="button-add-iqama"
                    type="submit"
                    disabled={createIqama.isPending}
                    className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">You'll see a warning when expiry is within 30 days.</p>
              </form>
            </div>
          )}
        </section>

        {/* ── Prayer Times ──────────────────────────── */}
        <section className="glass p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl"><Clock size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">{t('prayer_times')}</h2>
              <p className="text-xs text-muted-foreground">Jeddah, Saudi Arabia — Today</p>
            </div>
          </div>

          <div className="space-y-2">
            {PRAYER_TIMES.map(p => {
              const isActive = p.key === currentPrayer;
              return (
                <div
                  key={p.key}
                  data-testid={`prayer-${p.key}`}
                  className={`flex items-center justify-between p-3.5 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                      : 'bg-muted/40 hover:bg-muted/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isActive && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    )}
                    {!isActive && <div className="w-2 h-2" />}
                    <span className={`font-medium ${isActive ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                      {getPrayerName(p, language)}
                    </span>
                  </div>
                  <span className={`font-bold tabular-nums ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}>
                    {p.time}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Times are approximate. Verify with your local mosque.
          </p>
        </section>

        {/* ── WhatsApp Share & Referral ─────────────── */}
        <section className="glass p-6 rounded-3xl flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-green-500/10 text-green-600 rounded-xl"><Share2 size={22} /></div>
              <div>
                <h2 className="text-xl font-bold">{t('whatsapp_share')}</h2>
                <p className="text-xs text-muted-foreground">Help your community</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Know a Bangladeshi expat in Jeddah who needs home maintenance? Share FixoSmart with your community on WhatsApp!
            </p>
          </div>

          <button
            data-testid="button-whatsapp-share"
            onClick={whatsappShare}
            className="w-full py-3.5 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#20bf5a] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Share on WhatsApp
          </button>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Promo codes: <span className="font-mono text-primary">WELCOME10</span> · <span className="font-mono text-primary">EXPAT20</span> · <span className="font-mono text-primary">JEDDAH15</span>
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
