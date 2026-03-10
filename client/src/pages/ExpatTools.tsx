import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth, useIqamaTrackers, useCreateIqamaTracker, useDeleteIqamaTracker } from "@/hooks/use-api";
import { Calculator, Trash2, Plus, AlertCircle, FileText } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export function ExpatTools() {
  const { t } = useLanguage();
  const { data: user } = useAuth();
  const { data: iqamas = [] } = useIqamaTrackers();
  const createIqama = useCreateIqamaTracker();
  const deleteIqama = useDeleteIqamaTracker();

  const [sarAmount, setSarAmount] = useState<string>("100");
  const conversionRate = 29.5; // Mock fixed rate

  const [iqamaForm, setIqamaForm] = useState({ number: "", expiry: "" });

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

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-display font-bold">{t('tools')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Currency Converter */}
        <section className="glass p-6 md:p-8 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 text-primary rounded-xl"><Calculator size={24} /></div>
            <h2 className="text-2xl font-bold">{t('currency_converter')}</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Amount in SAR</label>
              <div className="relative">
                <input 
                  type="number" 
                  className="w-full p-4 text-2xl font-bold rounded-xl bg-background border-2 border-border focus:border-primary outline-none"
                  value={sarAmount}
                  onChange={e => setSarAmount(e.target.value)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">SAR</span>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">↓</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Amount in BDT (Approx)</label>
              <div className="w-full p-4 text-2xl font-bold rounded-xl bg-accent/20 text-accent-foreground border-2 border-accent/30 flex justify-between items-center">
                <span>{(Number(sarAmount) || 0) * conversionRate}</span>
                <span className="text-base">BDT</span>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">1 SAR = ~{conversionRate} BDT. Rates are indicative.</p>
          </div>
        </section>

        {/* Iqama Tracker */}
        <section className="glass p-6 md:p-8 rounded-3xl flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl"><FileText size={24} /></div>
            <h2 className="text-2xl font-bold">{t('iqama_tracker')}</h2>
          </div>

          {!user ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm bg-muted/30 rounded-xl p-4 text-center">
              Login to manage your Iqama records
            </div>
          ) : (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="space-y-3 flex-1">
                {iqamas.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No records found.</p>}
                {iqamas.map(iq => {
                  const days = differenceInDays(new Date(iq.expiryDate), new Date());
                  const isUrgent = days < 30;
                  return (
                    <div key={iq.id} className={`p-4 rounded-xl border flex items-center justify-between ${isUrgent ? 'bg-destructive/10 border-destructive/30' : 'bg-background border-border'}`}>
                      <div>
                        <div className="font-mono font-medium">{iq.iqamaNumber}</div>
                        <div className={`text-sm mt-1 flex items-center gap-1 ${isUrgent ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                          {isUrgent && <AlertCircle size={14} />} {days} {t('days_left')}
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteIqama.mutate(iq.id)}
                        disabled={deleteIqama.isPending}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleAddIqama} className="pt-4 border-t border-border flex gap-2">
                <input 
                  type="text" 
                  placeholder="Iqama No." 
                  className="flex-1 p-3 text-sm rounded-lg bg-background border border-border outline-none focus:border-primary"
                  value={iqamaForm.number}
                  onChange={e => setIqamaForm({...iqamaForm, number: e.target.value})}
                  required
                />
                <input 
                  type="date" 
                  className="flex-1 p-3 text-sm rounded-lg bg-background border border-border outline-none focus:border-primary"
                  value={iqamaForm.expiry}
                  onChange={e => setIqamaForm({...iqamaForm, expiry: e.target.value})}
                  required
                />
                <button 
                  type="submit" 
                  disabled={createIqama.isPending}
                  className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
