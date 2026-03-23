import { useState, useEffect } from "react";
import { supabase, getRedirectUrl } from "@/lib/supabase";
import { useLocation } from "wouter";
import { apiRequest, queryClient, saveSessionToken } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  // Handle Supabase callback — runs on mount if redirected back after OAuth/OTP
  useEffect(() => {
    const syncSupabaseSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        await bridgeSession(
          session.user.email,
          session.user.user_metadata?.full_name || session.user.user_metadata?.name
        );
      }
    };

    syncSupabaseSession();

    // Listen for future auth state changes (e.g. after OTP click-through)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user?.email) {
        await bridgeSession(
          session.user.email,
          session.user.user_metadata?.full_name || session.user.user_metadata?.name
        );
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const bridgeSession = async (email: string, fullName?: string) => {
    try {
      const res = await apiRequest("POST", "/api/supabase-auth", { email, fullName });
      const data = await res.json();
      if (data?.token) saveSessionToken(data.token);
      await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setLocation("/dashboard");
    } catch (err: any) {
      setError("Could not create session. Please try again.");
    }
  };

  const handleEmailOtp = async () => {
    if (!email.trim()) return setError("Please enter your email");
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: getRedirectUrl() },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getRedirectUrl(),
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // page will redirect to Google — no need to setLoading(false)
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-primary mb-1">FixoSmart</div>
          <p className="text-muted-foreground text-sm">
            Sign in to your account
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          {/* Google OAuth */}
          <button
            data-testid="button-google-login"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-border rounded-xl py-2.5 px-4 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FcGoogle className="w-5 h-5" />
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email OTP */}
          {!sent ? (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    data-testid="input-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleEmailOtp()}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                data-testid="button-send-otp"
                onClick={handleEmailOtp}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Magic Link
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="font-medium text-sm">Check your inbox</p>
              <p className="text-muted-foreground text-xs mt-1">
                We sent a sign-in link to <span className="font-medium">{email}</span>
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-xs text-primary hover:underline"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Or{" "}
          <a href="/profile" className="text-primary hover:underline">
            sign in with your name
          </a>{" "}
          if you already have an account
        </p>
      </motion.div>
    </div>
  );
}
