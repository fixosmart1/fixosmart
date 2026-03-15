import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import {
  useServices, useCreateService, useUpdateService,
  useDeleteService, useServiceAddons, useCreateServiceAddon,
  useUpdateServiceAddon, useDeleteServiceAddon, useAllBookings
} from "@/hooks/use-api";
import {
  Wrench, Plus, Trash2, X, Edit2, Check, ChevronDown,
  ChevronRight, ToggleLeft, ToggleRight, Tag, BarChart2, Eye, EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ['AC', 'Electric', 'Plumbing', 'Smart Home', 'Security', 'Appliance', 'Emergency'];
const CAT_EMOJIS: Record<string, string> = {
  AC: "❄️", Electric: "⚡", Plumbing: "🔧", "Smart Home": "🏡", Security: "📷", Appliance: "🔌", Emergency: "🚨",
};

// ── Addon Manager ─────────────────────────────────────────────────────────────
function AddonManager({ serviceId }: { serviceId: number }) {
  const { data: addons = [] } = useServiceAddons(serviceId);
  const createAddon = useCreateServiceAddon();
  const deleteAddon = useDeleteServiceAddon();
  const { toast } = useToast();
  const [form, setForm] = useState({ nameEn: "", nameBn: "", nameAr: "", priceSar: "" });
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameEn || !form.priceSar) return;
    try {
      await createAddon.mutateAsync({ serviceId, data: { ...form, nameBn: form.nameBn || form.nameEn, nameAr: form.nameAr || form.nameEn } });
      setForm({ nameEn: "", nameBn: "", nameAr: "", priceSar: "" });
      setAdding(false);
      toast({ title: "Add-on added" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
          <Tag size={11} /> Add-ons ({(addons as any[]).length})
        </p>
        <button
          onClick={() => setAdding(!adding)}
          className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
        >
          <Plus size={11} /> {adding ? "Cancel" : "Add"}
        </button>
      </div>

      {(addons as any[]).map((a: any) => (
        <div key={a.id} className="flex items-center justify-between py-1 text-xs">
          <span>{a.nameEn}</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">+{a.priceSar} SAR</span>
            <button onClick={() => deleteAddon.mutate({ id: a.id, serviceId })} className="text-destructive hover:bg-destructive/10 p-0.5 rounded">
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      ))}

      <AnimatePresence>
        {adding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="overflow-hidden mt-2"
          >
            <div className="grid grid-cols-2 gap-1.5 mb-1.5">
              <input
                type="text" placeholder="Name (EN)*" required value={form.nameEn}
                onChange={e => setForm({ ...form, nameEn: e.target.value })}
                className="col-span-2 px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs focus:border-primary outline-none"
              />
              <input
                type="text" placeholder="Name (BN)" value={form.nameBn}
                onChange={e => setForm({ ...form, nameBn: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs focus:border-primary outline-none"
              />
              <input
                type="text" placeholder="Name (AR)" value={form.nameAr}
                onChange={e => setForm({ ...form, nameAr: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs focus:border-primary outline-none"
              />
              <input
                type="number" placeholder="Price SAR*" required value={form.priceSar}
                onChange={e => setForm({ ...form, priceSar: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs focus:border-primary outline-none"
              />
              <button
                type="submit"
                disabled={createAddon.isPending}
                className="bg-primary text-primary-foreground rounded-lg text-xs font-bold py-1.5 disabled:opacity-50"
              >
                {createAddon.isPending ? "…" : "Add"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Inline Edit Form ──────────────────────────────────────────────────────────
function EditForm({ service, onDone }: { service: any; onDone: () => void }) {
  const updateService = useUpdateService();
  const { toast } = useToast();
  const [form, setForm] = useState({
    nameEn: service.nameEn, nameBn: service.nameBn, nameAr: service.nameAr,
    category: service.category, priceSar: service.priceSar,
    imageUrl: service.imageUrl || "", descriptionEn: service.descriptionEn || "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateService.mutateAsync({ id: service.id, data: form });
      toast({ title: "Service updated!" });
      onDone();
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  return (
    <form onSubmit={handleSave} className="mt-3 border-t border-border pt-3 space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {[
          { key: 'nameEn', label: 'Name (EN)' },
          { key: 'nameBn', label: 'Name (BN)' },
          { key: 'nameAr', label: 'Name (AR)' },
          { key: 'priceSar', label: 'Price (SAR)' },
          { key: 'imageUrl', label: 'Image URL' },
        ].map(f => (
          <div key={f.key}>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">{f.label}</label>
            <input
              type="text" value={(form as any)[f.key]}
              onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs focus:border-primary outline-none"
            />
          </div>
        ))}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Category</label>
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs focus:border-primary outline-none"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Description</label>
          <textarea
            value={form.descriptionEn}
            onChange={e => setForm({ ...form, descriptionEn: e.target.value })}
            rows={2}
            className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs focus:border-primary outline-none resize-none"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onDone} className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={updateService.isPending} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1">
          <Check size={12} /> {updateService.isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ── Service Analytics ─────────────────────────────────────────────────────────
function ServiceAnalytics({ services }: { services: any[] }) {
  const { data: bookings = [] } = useAllBookings();

  const stats = services.map(s => {
    const svcBookings = (bookings as any[]).filter(b => b.serviceId === s.id);
    const revenue = svcBookings.reduce((sum: number, b: any) => sum + parseFloat(b.totalAmountSar || '0'), 0);
    return { ...s, bookingCount: svcBookings.length, revenue };
  }).sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 5);

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-bold text-base flex items-center gap-2 mb-4">
        <BarChart2 size={18} className="text-primary" /> Service Analytics
      </h3>
      {stats.length === 0 ? (
        <p className="text-sm text-muted-foreground">No booking data yet.</p>
      ) : (
        <div className="space-y-3">
          {stats.map((s: any) => {
            const maxCount = stats[0]?.bookingCount || 1;
            const pct = Math.round((s.bookingCount / maxCount) * 100);
            return (
              <div key={s.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span>{CAT_EMOJIS[s.category] || "🔨"}</span>
                    <span className="font-medium truncate max-w-[140px]">{s.nameEn}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-primary">{s.bookingCount}</span>
                    <span className="text-muted-foreground text-xs"> bookings</span>
                    <span className="text-xs text-muted-foreground ml-2">· {s.revenue.toFixed(0)} SAR</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function AdminServices() {
  const { t } = useLanguage();
  const { data: services = [], isLoading } = useServices();
  const createService = useCreateService();
  const deleteService = useDeleteService();
  const updateService = useUpdateService();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterCat, setFilterCat] = useState("all");
  const [form, setForm] = useState({
    nameEn: "", nameBn: "", nameAr: "",
    category: "AC", priceSar: "", imageUrl: "", descriptionEn: ""
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createService.mutateAsync(form);
      setForm({ nameEn: "", nameBn: "", nameAr: "", category: "AC", priceSar: "", imageUrl: "", descriptionEn: "" });
      setShowForm(false);
      toast({ title: "Service created!" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const toggleActive = async (s: any) => {
    try {
      await updateService.mutateAsync({ id: s.id, data: { isActive: !s.isActive } });
      toast({ title: s.isActive ? "Service disabled" : "Service enabled" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const allServices = services as any[];
  const filtered = filterCat === "all" ? allServices : allServices.filter(s => s.category === filterCat);

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
            <Wrench className="text-green-500" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('manage_services')}</h1>
            <p className="text-muted-foreground text-sm">{allServices.length} services</p>
          </div>
        </div>
        <button
          data-testid="button-add-service"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Service</>}
        </button>
      </div>

      {/* Analytics */}
      <ServiceAnalytics services={allServices} />

      {/* Add Service Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreate} className="glass p-5 rounded-2xl">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={16} /> Add New Service</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'nameEn', label: 'Name (English)*' },
                  { key: 'nameBn', label: 'Name (Bengali)*' },
                  { key: 'nameAr', label: 'Name (Arabic)*' },
                  { key: 'priceSar', label: 'Price (SAR)*' },
                  { key: 'imageUrl', label: 'Image URL' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={(form as any)[field.key]}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      required={field.label.includes('*')}
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description (English)</label>
                  <textarea
                    value={form.descriptionEn}
                    onChange={e => setForm({ ...form, descriptionEn: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={createService.isPending}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  <Check size={16} /> {createService.isPending ? "Adding…" : "Create Service"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {["all", ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              filterCat === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'glass border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            {cat === "all" ? "All" : `${CAT_EMOJIS[cat] || ""} ${cat}`}
          </button>
        ))}
      </div>

      {/* Service List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 animate-pulse h-32" />
        ))}
        {filtered.map((s: any, i: number) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            data-testid={`card-admin-service-${s.id}`}
            className={`glass rounded-2xl p-4 ${!s.isActive ? 'opacity-60' : ''}`}
          >
            {/* Card header */}
            <div className="flex gap-3">
              {s.imageUrl && s.imageUrl.startsWith('http') ? (
                <img src={s.imageUrl} alt={s.nameEn} className="w-16 h-14 object-cover rounded-xl shrink-0" />
              ) : (
                <div className="w-16 h-14 bg-primary/10 rounded-xl shrink-0 flex items-center justify-center text-2xl">
                  {CAT_EMOJIS[s.category] || "🔧"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold truncate">{s.nameEn}</p>
                    <p className="text-xs text-muted-foreground">{s.category} · <span className="font-bold text-primary">{s.priceSar} SAR</span></p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{s.nameBn} / {s.nameAr}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {/* Toggle active */}
                    <button
                      onClick={() => toggleActive(s)}
                      title={s.isActive ? "Disable" : "Enable"}
                      className={`p-1.5 rounded-lg transition-colors ${s.isActive ? 'text-green-600 hover:bg-green-500/10' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      {s.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    {/* Edit */}
                    <button
                      onClick={() => { setEditingId(editingId === s.id ? null : s.id); setExpandedId(s.id); }}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>
                    {/* Expand addons */}
                    <button
                      onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      {expandedId === s.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => { if (confirm(`Delete "${s.nameEn}"?`)) deleteService.mutate(s.id); }}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded section */}
            <AnimatePresence>
              {expandedId === s.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {editingId === s.id ? (
                    <EditForm service={s} onDone={() => { setEditingId(null); }} />
                  ) : (
                    <AddonManager serviceId={s.id} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
