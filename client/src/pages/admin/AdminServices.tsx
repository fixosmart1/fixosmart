import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useServices, useCreateService, useDeleteService } from "@/hooks/use-api";
import { Wrench, Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AdminServices() {
  const { t } = useLanguage();
  const { data: services = [], isLoading } = useServices();
  const createService = useCreateService();
  const deleteService = useDeleteService();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nameEn: "", nameBn: "", nameAr: "",
    category: "AC", priceSar: "", imageUrl: "", descriptionEn: ""
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createService.mutateAsync(form);
    setForm({ nameEn: "", nameBn: "", nameAr: "", category: "AC", priceSar: "", imageUrl: "", descriptionEn: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
            <Wrench className="text-green-500" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('manage_services')}</h1>
            <p className="text-muted-foreground text-sm">{services.length} services</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm"
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> {t('add_new')}</>}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreate} className="glass p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <h3 className="font-bold mb-4">Add New Service</h3>
              </div>
              {[
                { key: 'nameEn', label: 'Name (English)', req: true },
                { key: 'nameBn', label: 'Name (Bengali)', req: true },
                { key: 'nameAr', label: 'Name (Arabic)', req: true },
                { key: 'priceSar', label: 'Price (SAR)', req: true },
                { key: 'imageUrl', label: 'Image URL', req: false },
                { key: 'descriptionEn', label: 'Description', req: false },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={(form as any)[field.key]}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    required={field.req}
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
                  {['AC', 'Electric', 'Plumbing', 'Smart Home', 'Security', 'Appliance'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={createService.isPending}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50"
                >
                  {createService.isPending ? "Adding..." : "Add Service"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 animate-pulse h-32" />
        ))}
        {services.map((s: any, i: number) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass rounded-2xl p-4 flex gap-4"
          >
            {s.imageUrl && (
              <img src={s.imageUrl} alt={s.nameEn} className="w-20 h-16 object-cover rounded-xl shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{s.nameEn}</p>
              <p className="text-xs text-muted-foreground">{s.category} • {s.priceSar} SAR</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.nameBn} / {s.nameAr}</p>
            </div>
            <button
              onClick={() => deleteService.mutate(s.id)}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors shrink-0"
            >
              <Trash2 size={16} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
