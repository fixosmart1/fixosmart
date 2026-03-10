import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-card shadow-md border border-border text-foreground hover:scale-105 transition-transform"
      aria-label="Toggle Theme"
    >
      <motion.div initial={false} animate={{ rotate: theme === 'dark' ? 180 : 0 }}>
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </motion.div>
    </button>
  );
}
