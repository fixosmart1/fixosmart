import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiRequest, queryClient, saveSessionToken } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function AuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing sign-in…");
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase detects the hash/query params and exchanges the code for a session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session?.user?.email) {
          // Try exchanging code from URL (PKCE flow)
          const params = new URLSearchParams(window.location.search);
          const code = params.get("code");
          if (code) {
            const { data, error: exchError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchError || !data.session?.user?.email) throw exchError || new Error("No session");
            await bridge(data.session.user.email, data.session.user.user_metadata?.full_name);
          } else {
            throw new Error("No session or code found");
          }
        } else {
          await bridge(session.user.email, session.user.user_metadata?.full_name);
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.message || "Sign-in failed. Please try again.");
        setTimeout(() => setLocation("/login"), 3000);
      }
    };

    const bridge = async (email: string, fullName?: string) => {
      const res = await apiRequest("POST", "/api/supabase-auth", { email, fullName });
      const data = await res.json();
      if (data?.token) saveSessionToken(data.token);
      await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setStatus("success");
      setMessage("Signed in! Redirecting…");
      setTimeout(() => setLocation("/dashboard"), 1200);
    };

    handleCallback();
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
