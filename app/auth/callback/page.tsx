"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [status, setStatus] = useState("Autenticando...");

  useEffect(() => {
    let redirected = false;

    const goHome = () => {
      if (!redirected) {
        redirected = true;
        window.location.href = "/";
      }
    };

    // Listen for auth state changes (works for both implicit and PKCE)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        goHome();
      }
    });

    const handleCallback = async () => {
      const hash = window.location.hash;
      const search = window.location.search;

      // Case 1: Implicit flow — tokens in URL hash (#access_token=...&refresh_token=...)
      if (hash && hash.includes("access_token")) {
        // Supabase client with detectSessionInUrl should handle this automatically.
        // Wait a moment for it to process.
        await new Promise((r) => setTimeout(r, 1000));
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          goHome();
          return;
        }
      }

      // Case 2: PKCE flow — code in query params (?code=...)
      if (search && search.includes("code=")) {
        const params = new URLSearchParams(search);
        const code = params.get("code");
        if (code) {
          try {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error) {
              goHome();
              return;
            }
            console.error("Code exchange error:", error.message);
          } catch (err) {
            console.error("Code exchange exception:", err);
          }
        }
      }

      // Case 3: Fallback — check if session was already established
      await new Promise((r) => setTimeout(r, 1500));
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        goHome();
        return;
      }

      // Final fallback — redirect home after timeout
      setStatus("Redirecionando...");
      setTimeout(goHome, 2000);
    };

    handleCallback();

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-[#050810] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-xl font-bold text-cyan-400">
            A
          </div>
        </div>
        <div className="text-sm text-white/40">{status}</div>
      </div>
    </div>
  );
}
