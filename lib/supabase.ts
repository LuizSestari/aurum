import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// MUST use flowType: "pkce" explicitly.
// The default is "implicit" which does NOT store a code_verifier,
// causing the PKCE code exchange on the callback page to fail silently.
export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "pkce",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : createClient("https://placeholder.supabase.co", "placeholder-key");

export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey);
