import { useState } from "react";
import { supabase, getRedirectUrl } from "@/lib/supabase"; // getRedirectUrl ইমপোর্ট করুন

export default function SupabaseLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // এই লাইনটিই আসল সমাধান। এটি ছাড়া সেশন কাজ করবে না।
        emailRedirectTo: getRedirectUrl(),
      },
    });

    setLoading(false);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Check your email for the magic link!");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Supabase Login</h1>
      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />
      <button onClick={login} disabled={loading}>
        {loading ? "Sending..." : "Login"}
      </button>
    </div>
  );
}
