import { useState, useEffect } from "react";
import { useAdminSettings, useUpdateSiteSetting } from "@/hooks/use-api";
import { Settings, Save, ImageIcon, Phone, Type, AlignLeft, Eye, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const TYPE_ICONS: Record<string, any> = {
  url: ImageIcon,
  text: Type,
  textarea: AlignLeft,
  number: Type,
};

export function AdminSettings() {
  const { data: settings = [], isLoading } = useAdminSettings();
  const update = useUpdateSiteSetting();
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (settings.length > 0) {
      const map: Record<string, string> = {};
      for (const s of settings as any[]) map[s.key] = s.value;
      setValues(map);
    }
  }, [settings]);

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await update.mutateAsync({ key, value: values[key] || "" });
      setSaved(key);
      toast({ title: "Saved!", description: "Homepage updated successfully." });
      setTimeout(() => setSaved(null), 2500);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const heroImageUrl = values["hero_image_url"] || "";

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Settings className="text-primary" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground text-sm">Change homepage content, images, and contact info</p>
        </div>
      </div>

      {/* Hero Image Preview */}
      {heroImageUrl && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Eye size={15} className="text-muted-foreground" />
            <span className="text-sm font-semibold">Current Hero Photo Preview</span>
          </div>
          <div className="aspect-[16/6] relative overflow-hidden">
            <img
              src={heroImageUrl}
              alt="Hero preview"
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
            <div className="absolute inset-0 flex items-center px-8">
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Hero section preview</p>
                <h2 className="text-2xl font-bold">Your Home,</h2>
                <h2 className="text-2xl font-bold text-primary">Perfectly Maintained.</h2>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Settings Form */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 glass rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {(settings as any[]).map((setting: any, i: number) => {
            const Icon = TYPE_ICONS[setting.type] || Type;
            const isSavingThis = saving === setting.key;
            const isSavedThis = saved === setting.key;
            const isUrl = setting.type === 'url';

            return (
              <motion.div
                key={setting.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-2xl p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={15} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block font-semibold text-sm mb-0.5">{setting.label}</label>
                    <p className="text-xs text-muted-foreground font-mono">{setting.key}</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    {setting.type === 'textarea' ? (
                      <textarea
                        data-testid={`input-setting-${setting.key}`}
                        value={values[setting.key] ?? setting.value}
                        onChange={e => setValues(v => ({ ...v, [setting.key]: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary outline-none transition-colors resize-none text-sm"
                      />
                    ) : (
                      <input
                        data-testid={`input-setting-${setting.key}`}
                        type={isUrl ? "url" : "text"}
                        value={values[setting.key] ?? setting.value}
                        onChange={e => setValues(v => ({ ...v, [setting.key]: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary outline-none transition-colors text-sm"
                        placeholder={isUrl ? "https://..." : "Enter value..."}
                      />
                    )}
                    {/* URL image preview toggle */}
                    {isUrl && values[setting.key] && (
                      <button
                        className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                        onClick={() => setPreview(preview === setting.key ? null : setting.key)}
                      >
                        <Eye size={11} /> {preview === setting.key ? "Hide preview" : "Preview image"}
                      </button>
                    )}
                    {preview === setting.key && values[setting.key] && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-border max-h-40">
                        <img
                          src={values[setting.key]}
                          alt="preview"
                          className="w-full h-full object-cover max-h-40"
                          onError={e => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).alt = 'Invalid image URL'; }}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    data-testid={`button-save-${setting.key}`}
                    onClick={() => handleSave(setting.key)}
                    disabled={isSavingThis || update.isPending}
                    className={`shrink-0 px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                      isSavedThis
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        : 'bg-primary text-primary-foreground hover:-translate-y-0.5 shadow-md shadow-primary/20'
                    } disabled:opacity-50`}
                  >
                    {isSavingThis ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : isSavedThis ? (
                      <><CheckCircle size={15} /> Saved</>
                    ) : (
                      <><Save size={15} /> Save</>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Tip */}
      <div className="glass p-4 rounded-2xl border border-primary/20 bg-primary/5">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">Tip:</span> Changes take effect instantly on the homepage. For the hero photo, paste any image URL from Unsplash or your own host. Changes are saved per field — click "Save" next to each one.
        </p>
      </div>
    </div>
  );
}
