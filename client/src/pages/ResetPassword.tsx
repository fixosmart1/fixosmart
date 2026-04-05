import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [, setLocation] = useLocation();

  // Supabase delivers the recovery session via onAuthStateChange with event=PASSWORD_RECOVERY
  // This fires after the code is exchanged in AuthCallback and the user lands here.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessionReady(true);
      }
    });

    // Also check if session already exists (user landed here after callback exchange)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (!password) return setError("Please enter a new password");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirm) return setError("Passwords do not match");

    setLoading(true);
    setError("");

    const { error: updateErr } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (updateErr) {
      setError(updateErr.message || "Could not update password. Please try again.");
      return;
    }

    setSuccess(true);
    // Sign out and redirect to login after 2.5s so user logs in fresh with new password
    setTimeout(async () => {
      await supabase.auth.signOut().catch(() => {});
      setLocation("/login");
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-primary mb-1">FixoSmart</div>
          <p className="text-muted-foreground text-sm">Set a new password</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="text-sm font-medium text-center">Password updated successfully!</p>
              <p className="text-xs text-muted-foreground text-center">
                Redirecting to sign in…
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold mb-1">Reset Your Password</h2>
                <p className="text-xs text-muted-foreground">
                  Enter a new password for your account.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    data-testid="input-new-password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    data-testid="input-confirm-password"
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <button
                data-testid="button-update-password"
                onClick={handleReset}
                disabled={loading || !sessionReady}
                className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {!sessionReady ? "Verifying reset link…" : "Update Password"}
              </button>

              <button
                onClick={() => setLocation("/login")}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Cancel — back to Sign In
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
