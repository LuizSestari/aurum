"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [status, setStatus] = useState("Autenticando...");

  useEffect(() => {
    let done = false;

    const goHome = () => {
      if (!done) {
        done = true;
        setStatus("Entrando no Aurum...");
        window.location.replace("/");
      }
    };

    // Listen for auth state changes — Supabase client with
    // detectSessionInUrl + flowType:"pkce" handles the code exchange
    // automatically during initialization. We just wait for the result.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        goHome();
      }
      if (event === "TOKEN_REFRESHED" && session) {
        goHome();
      }
    });

    // Also check if session already exists (e.g. page reload)
    const checkExisting = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        goHome();
        return;
      }

      // Manual PKCE exchange as fallback
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        try {
          const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && exchangeData.session) {
            goHome();
            return;
          }
          if (error) {
            console.error("[Aurum Auth] Code exchange error:", error.message);
          }
        } catch (e) {
          console.error("[Aurum Auth] Code exchange exception:", e);
        }
      }

      // Implicit flow fallback — tokens in hash fragment
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { data: sessData, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error && sessData.session) {
            goHome();
            return;
          }
        }
      }

      // Final fallback: wait and check once more
      await new Promise((r) => setTimeout(r, 3000));
      const { data: retry } = await supabase.auth.getSession();
      if (retry.session) {
        goHome();
        return;
      }

      // If still nothing, go home anyway (landing page will show)
      setStatus("Redirecionando...");
      setTimeout(goHome, 500);
    };

    checkExisting();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-[#050810] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 text-2xl font-bold text-cyan-400">
            A
          </div>
        </div>
        <div className="text-sm text-white/50">{status}</div>
      </div>
    </div>
  );
}
