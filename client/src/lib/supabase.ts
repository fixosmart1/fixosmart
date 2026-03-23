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
    flowType: "pkce",
  },
});

export const PRODUCTION_URL = "https://www.fixosmart.com";
export const getRedirectUrl = () => {
  const isProd = window.location.hostname === "www.fixosmart.com" ||
    window.location.hostname === "fixosmart.com";
  return isProd ? `${PRODUCTION_URL}/auth/callback` : `${window.location.origin}/auth/callback`;
};
