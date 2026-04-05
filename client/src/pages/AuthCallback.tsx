import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { queryClient, saveSessionToken } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function AuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing sign-in…");
  const [, setLocation] = useLocation();
  const handled = useRef(false);

  useEffect(() => {
    const done = (ok: boolean, msg: string, redirectTo = "/dashboard") => {
      if (handled.current) return;
      handled.current = true;
      setStatus(ok ? "success" : "error");
      setMessage(msg);
      setTimeout(() => setLocation(ok ? redirectTo : "/login"), ok ? 1500 : 2500);
    };

    const bridge = async (email: string, fullName?: string) => {
      const res = await fetch("/api/supabase-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, fullName }),
      });
      let data: any = {};
      try { data = await res.json(); } catch (_) {}
      if (!res.ok) {
        throw new Error(data?.detail || data?.message || `Server error ${res.status}`);
      }
      if (data?.token) saveSessionToken(data.token);
      await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    };

    // ── Detect password recovery flow ──────────────────────────────────────
    // Supabase adds ?type=recovery (PKCE) or #type=recovery (implicit) to the redirect URL
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const flowType = searchParams.get("type") || hashParams.get("type") || "";
    const isRecovery = flowType === "recovery";

    const run = async () => {
      try {
        setMessage(isRecovery ? "Verifying reset link…" : "Completing sign-in…");

        // Exchange PKCE code for session (works for both login and recovery)
        const { data: exchanged, error: exchErr } =
          await supabase.auth.exchangeCodeForSession(window.location.href);

        if (!exchErr && exchanged?.session) {
          if (isRecovery) {
            // Recovery: do NOT bridge to backend. Just redirect to reset-password page.
            // The ResetPassword page will read the active Supabase session and call updateUser().
            done(true, "Reset link verified! Setting up new password…", "/reset-password");
            return;
          }

          // Normal login flow: bridge to backend for integer session
          if (exchanged.session.user?.email) {
            await bridge(
              exchanged.session.user.email,
              exchanged.session.user.user_metadata?.full_name
            );
            done(true, "Signed in! Redirecting…");
            return;
          }
        }

        // Fallback: try existing session (page refresh / already exchanged)
        const { data: { session }, error: sessErr } = await supabase.auth.getSession();
        if (!sessErr && session?.user?.email) {
          if (isRecovery) {
            done(true, "Reset link verified! Setting up new password…", "/reset-password");
            return;
          }
          await bridge(session.user.email, session.user.user_metadata?.full_name);
          done(true, "Signed in! Redirecting…");
          return;
        }

        const reason = exchErr?.message || sessErr?.message || "No session found";
        done(false, `Sign-in failed: ${reason}`);
      } catch (err: any) {
        done(false, err?.message || "Sign-in failed. Please try again.");
      }
    };

    run();

    const timeout = setTimeout(() => {
      if (!handled.current) done(false, "Request timed out. Please try again.");
    }, 25000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-sm text-red-500">{message}</p>
            <p className="text-xs text-muted-foreground">Redirecting to login…</p>
          </>
        )}
      </div>
    </div>
  );
}
