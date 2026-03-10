import { useLanguage } from "@/hooks/use-language";
import { Globe } from "lucide-react";
import { Language } from "@/lib/translations";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 p-2 rounded-xl bg-card shadow-md border border-border text-foreground hover:bg-muted transition-colors">
        <Globe size={18} className="text-primary" />
        <span className="font-medium text-sm uppercase">{language}</span>
      </button>
      
      <div className="absolute right-0 mt-2 w-32 bg-card rounded-xl shadow-xl border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {(['en', 'bn', 'ar'] as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`w-full text-left px-4 py-3 text-sm first:rounded-t-xl last:rounded-b-xl hover:bg-muted transition-colors ${language === lang ? 'font-bold text-primary bg-primary/5' : 'text-foreground'}`}
          >
            {lang === 'en' ? 'English' : lang === 'bn' ? 'বাংলা' : 'العربية'}
          </button>
        ))}
      </div>
    </div>
  );
}
