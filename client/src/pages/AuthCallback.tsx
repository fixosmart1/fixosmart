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
    const bridge = async (email: string, fullName?: string) => {
      if (handled.current) return;
      handled.current = true;
      try {
        const res = await apiRequest("POST", "/api/supabase-auth", { email, fullName });
        const data = await res.json();
        if (data?.token) saveSessionToken(data.token);
        await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
        setStatus("success");
        setMessage("Signed in! Redirecting…");
        setTimeout(() => setLocation("/dashboard"), 1200);
      } catch (err: any) {
        handled.current = false;
        throw err;
      }
    };

    const fail = (msg: string) => {
      if (handled.current) return;
      setStatus("error");
      setMessage(msg);
      setTimeout(() => setLocation("/login"), 3000);
    };

    // Strategy 1: listen for Supabase auth state change (best for PKCE flow)
    // Supabase automatically exchanges the code when detectSessionInUrl: true
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user?.email) {
        try {
          await bridge(session.user.email, session.user.user_metadata?.full_name);
        } catch (err: any) {
          fail(err?.message || "Sign-in failed. Please try again.");
        }
      }
    });

    // Strategy 2: also try immediately in case session is already available
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email) {
        try {
          await bridge(session.user.email, session.user.user_metadata?.full_name);
        } catch (err: any) {
          fail(err?.message || "Sign-in failed. Please try again.");
        }
      }
    });

    // Strategy 3: manual PKCE code exchange fallback
    const tryCodeExchange = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (!code || handled.current) return;
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        if (data.session?.user?.email) {
          await bridge(data.session.user.email, data.session.user.user_metadata?.full_name);
        }
      } catch (err: any) {
        fail(err?.message || "Sign-in failed. Please try again.");
      }
    };

    // Give Strategy 1 & 2 a head-start, then try manual exchange
    const codeTimer = setTimeout(tryCodeExchange, 1500);

    // Safety timeout: if nothing worked in 20s, show error
    const safetyTimer = setTimeout(() => {
      fail("Sign-in timed out. Please try again.");
    }, 20000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(codeTimer);
      clearTimeout(safetyTimer);
    };
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
