import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiRequest, queryClient, saveSessionToken } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function AuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing sign-in…");
  const [, setLocation] = useLocation();
  const handled = useRef(false);

  useEffect(() => {
    const done = (ok: boolean, msg: string, redirectTo = "/dashboard") => {
      if (handled.current && ok) return;
      handled.current = ok;
      setStatus(ok ? "success" : "error");
      setMessage(msg);
      setTimeout(() => setLocation(ok ? redirectTo : "/login"), 1200);
    };

    const bridge = async (email: string, fullName?: string) => {
      const res = await apiRequest("POST", "/api/supabase-auth", { email, fullName });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Auth bridge failed");
      if (data?.token) saveSessionToken(data.token);
      await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    };

    const run = async () => {
      try {
        // Step 1: exchange the PKCE code using the full URL (most reliable method)
        // Supabase reads the code + code_verifier from localStorage automatically
        const { data: exchanged, error: exchErr } =
          await supabase.auth.exchangeCodeForSession(window.location.href);

        if (!exchErr && exchanged?.session?.user?.email) {
          await bridge(
            exchanged.session.user.email,
            exchanged.session.user.user_metadata?.full_name
          );
          done(true, "Signed in! Redirecting…");
          return;
        }

        // Step 2: maybe the session was already established (e.g. page refresh on callback)
        const { data: { session }, error: sessErr } = await supabase.auth.getSession();
        if (!sessErr && session?.user?.email) {
          await bridge(session.user.email, session.user.user_metadata?.full_name);
          done(true, "Signed in! Redirecting…");
          return;
        }

        // If we reach here nothing worked
        const reason = exchErr?.message || sessErr?.message || "No session found";
        done(false, reason);
      } catch (err: any) {
        done(false, err?.message || "Sign-in failed. Please try again.");
      }
    };

    run();

    // Absolute safety net — should never be reached if run() works
    const timeout = setTimeout(() => {
      if (!handled.current) done(false, "Sign-in timed out. Please try again.");
    }, 25000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        )}
        {status === "success" && (
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
        )}
        {status === "error" && (
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        )}
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
