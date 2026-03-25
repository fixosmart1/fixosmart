import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://tdswmmtwhpxxycpoifwr.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_ICM6oRsZdJtGSl-qz2sRqg_yJFdtOp0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "fixosmart-auth",
    storage: window.localStorage,
    flowType: "pkce", // PKCE flow ডোমেইন পরিবর্তনের প্রতি খুব সংবেদনশীল
  },
});

export const getRedirectUrl = () => {
  // হার্ডকোডেড URL এর বদলে বর্তমান অরিজিন ব্যবহার করা সবচেয়ে নিরাপদ
  // এতে www থাকুক বা না থাকুক, সেশন ঠিকঠাক কাজ করবে
  const origin = window.location.origin;
  return `${origin}/auth/callback`;
};
