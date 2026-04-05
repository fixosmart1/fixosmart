import { useState, useRef } from "react";
import { supabase, getRedirectUrl } from "@/lib/supabase";
import { useLocation } from "wouter";
import { queryClient, saveSessionToken } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, User, ArrowLeft, CheckCircle2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

type Tab = "login" | "register" | "forgot";

export default function Login() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [, setLocation] = useLocation();
  const bridging = useRef(false);

  const switchTab = (t: Tab) => { setTab(t); setError(""); setInfo(""); };

  // ── Bridge: Supabase email → Express integer session ──────────────────────
  const bridge = async (email: string, name?: string) => {
    if (bridging.current) return;
    bridging.current = true;
    try {
      const res = await fetch("/api/supabase-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, fullName: name }),
      });
      let data: any = {};
      try { data = await res.json(); } catch (_) {}
      if (!res.ok) {
        setError(data?.detail || data?.message || `Server error ${res.status}`);
        return;
      }
      if (data?.token) saveSessionToken(data.token);
      await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setLocation("/dashboard");
    } catch (err: any) {
      setError(`Connection error: ${err?.message || "Could not reach server"}`);
    } finally {
      bridging.current = false;
    }
  };

  // ── Email + Password LOGIN ─────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password) return setError("Email and password are required");
    setLoading(true);
    setError("");

    const { data, error: authErr } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authErr || !data?.user?.email) {
      setLoading(false);
      const msg = (authErr?.message || "").toLowerCase();
      if (msg.includes("email not confirmed")) {
        setError("Your email is not confirmed. Check your inbox for the confirmation link.");
      } else if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
        setError("Incorrect email or password. Forgot your password? Use the link below.");
      } else {
        setError(authErr?.message || "Login failed. Please try again.");
      }
      return;
    }

    await bridge(
      data.user.email,
      data.user.user_metadata?.full_name || data.user.user_metadata?.name
    );
    setLoading(false);
  };

  // ── Email + Password REGISTER ──────────────────────────────────────────────
  const handleRegister = async () => {
    if (!fullName.trim()) return setError("Full name is required");
    if (!email.trim()) return setError("Email is required");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    setError("");
    setInfo("");

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: getRedirectUrl(),
      },
    });

    if (signUpErr) {
      setLoading(false);
      const msg = (signUpErr.message || "").toLowerCase();
      if (msg.includes("already registered") || msg.includes("user already")) {
        setError("This email is already registered. Sign in instead, or use Forgot Password if you can't remember your password.");
      } else {
        setError(signUpErr.message);
      }
      return;
    }

    // Email confirmation disabled → session returned immediately
    if (data?.session?.user?.email) {
      await bridge(data.session.user.email, fullName.trim());
      setLoading(false);
      return;
    }

    // Email confirmation enabled → prompt user to confirm
    if (data?.user && !data?.session) {
      setLoading(false);
      setInfo("Account created! Check your email and click the confirmation link, then sign in.");
      switchTab("login");
      setPassword("");
      return;
    }

    setLoading(false);
    setError("Could not create account. Please try again.");
  };

  // ── Forgot Password ────────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email.trim()) return setError("Enter your email address above first");
    setLoading(true);
    setError("");
    setInfo("");

    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/auth/callback` }
    );

    setLoading(false);
    if (resetErr) {
      setError(resetErr.message || "Could not send reset email. Try again.");
    } else {
      setInfo(`Password reset email sent to ${email.trim()}. Check your inbox and click the link to set a new password.`);
    }
  };

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogle = async () => {
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (tab === "login") handleLogin();
    else if (tab === "register") handleRegister();
    else handleForgotPassword();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-primary mb-1">FixoSmart</div>
          <p className="text-muted-foreground text-sm">Smart home services — Jeddah</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">

          {/* Tab Switch — hidden on forgot password screen */}
          {tab !== "forgot" && (
            <div className="flex rounded-xl bg-muted p-1 mb-5">
              {(["login", "register"] as Tab[]).map((t) => (
                <button
                  key={t}
                  data-testid={`tab-${t}`}
                  onClick={() => switchTab(t)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    tab === t
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "login" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>
          )}

          {/* Forgot Password header */}
          {tab === "forgot" && (
            <div className="mb-5">
              <button
                onClick={() => switchTab("login")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </button>
              <h2 className="text-base font-semibold">Forgot Password?</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Enter your email and we'll send you a reset link.
              </p>
            </div>
          )}

          {/* Info Banner */}
          {info && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl text-xs text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {info}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: tab === "forgot" ? 10 : tab === "login" ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {/* Full Name (register only) */}
              {tab === "register" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      data-testid="input-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setError(""); }}
                      onKeyDown={handleKeyDown}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    data-testid="input-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={handleKeyDown}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Password (not on forgot tab) */}
              {tab !== "forgot" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      data-testid="input-password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      onKeyDown={handleKeyDown}
                      placeholder={tab === "register" ? "At least 6 characters" : "Your password"}
                      autoComplete={tab === "login" ? "current-password" : "new-password"}
                      className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      type="button"
                      data-testid="button-toggle-password"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Forgot password link (login tab only) */}
              {tab === "login" && (
                <div className="flex justify-end">
                  <button
                    data-testid="button-forgot-password"
                    type="button"
                    onClick={() => switchTab("forgot")}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                data-testid={tab === "login" ? "button-login" : tab === "register" ? "button-register" : "button-reset-password"}
                onClick={tab === "login" ? handleLogin : tab === "register" ? handleRegister : handleForgotPassword}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {tab === "login" ? "Sign In" : tab === "register" ? "Create Account" : "Send Reset Link"}
              </button>
            </motion.div>
          </AnimatePresence>

          {/* Divider + Google (not on forgot tab) */}
          {tab !== "forgot" && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                data-testid="button-google-login"
                onClick={handleGoogle}
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
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By signing in you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  );
}
