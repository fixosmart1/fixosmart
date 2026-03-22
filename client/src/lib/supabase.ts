import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://tdswmmtwhpxxycpoifwr.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_ICM6oRsZdJtGSl-qz2sRqg_yJFdtOp0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
