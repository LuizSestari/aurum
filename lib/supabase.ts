import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Use @supabase/ssr's createBrowserClient which stores auth data
// (including PKCE code_verifier) in cookies instead of localStorage.
// This is REQUIRED for Next.js App Router where the callback route handler
// needs to read the code_verifier server-side during the code exchange.
//
// IMPORTANT: We bypass the gotrue-js Web Locks API entirely with a no-op lock.
// The default lock mechanism causes 5+ second timeouts in Next.js App Router
// because hydration can orphan locks (similar to React Strict Mode double-mount).
// Since we only have ONE Supabase client instance per tab, concurrent token
// refreshes are not a real concern — the no-op lock is safe.
export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
          return await fn();
        },
      },
    })
  : (null as unknown as SupabaseClient);

export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey);
