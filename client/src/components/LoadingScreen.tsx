import { Wrench } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  overlay?: boolean;
}

export function LoadingScreen({ message = "Loading...", overlay = false }: LoadingScreenProps) {
  const base =
    "flex flex-col items-center justify-center gap-6 bg-background";
  const className = overlay
    ? `fixed inset-0 z-[9999] ${base}`
    : `min-h-screen min-h-dvh w-full ${base}`;

  return (
    <div className={className}>
      {/* Branding */}
      <div className="flex flex-col items-center gap-3 select-none">
        <div className="relative">
          {/* Outer ring pulse */}
          <span className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" />
          <div className="relative w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Wrench className="text-white" size={30} />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary tracking-tight">FixoSmart</h1>
          <p className="text-xs text-muted-foreground mt-0.5 tracking-widest uppercase">
            Smart Home Marketplace
          </p>
        </div>
      </div>

      {/* Spinner */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground font-medium animate-pulse">{message}</p>
      </div>

      {/* Dots loader */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
