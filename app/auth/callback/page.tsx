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
        setTimeout(() => window.location.replace("/"), 200);
      }
    };

    const handleAuth = async () => {
      // Step 1: Check if Supabase auto-detection already established a session
      // (detectSessionInUrl processes tokens/code during client initialization)
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) {
        goHome();
        return;
      }

      // Step 2: Try PKCE code exchange manually
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.session) {
          goHome();
          return;
        }
        if (error) {
          console.error("[Aurum] Code exchange:", error.message);
        }
      }

      // Step 3: Try implicit flow — tokens in hash fragment
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error && data.session) {
            goHome();
            return;
          }
        }
      }

      // Step 4: Wait and retry — auto-detection might be async
      await new Promise((r) => setTimeout(r, 2000));
      const { data: retry } = await supabase.auth.getSession();
      if (retry.session) {
        goHome();
        return;
      }

      // Step 5: Last resort — redirect home anyway
      setStatus("Redirecionando...");
      setTimeout(goHome, 1000);
    };

    handleAuth();
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
