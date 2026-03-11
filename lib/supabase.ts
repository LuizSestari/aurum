import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Create client with implicit flow (not PKCE) to avoid SSR localStorage issues.
// Implicit flow sends tokens in URL hash which the browser client detects automatically.
export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "implicit",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient("https://placeholder.supabase.co", "placeholder-key");

export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey);
