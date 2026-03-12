import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Use @supabase/ssr's createBrowserClient which stores auth data
// (including PKCE code_verifier) in cookies instead of localStorage.
// This is REQUIRED for Next.js App Router where the callback route handler
// needs to read the code_verifier server-side during the code exchange.
export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient);

export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey);
