import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Use PKCE flow (default, most reliable).
// The code verifier is stored in localStorage by signInWithOAuth on the client,
// and exchangeCodeForSession reads it on the callback page (also client).
// SSR doesn't interfere because both operations happen client-side.
export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : createClient("https://placeholder.supabase.co", "placeholder-key");

export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey);
