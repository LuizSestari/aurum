"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [status, setStatus] = useState("Autenticando...");

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Handle PKCE flow (code in query params)
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("OAuth code exchange error:", error.message);
            setStatus("Erro na autenticacao. Redirecionando...");
          }
        }

        // For implicit flow, Supabase detects hash fragments automatically
        // on client init. Just need to get the session.
        const { data } = await supabase.auth.getSession();

        if (data.session) {
          window.location.href = "/";
          return;
        }

        // Wait for Supabase to process hash fragment (implicit flow)
        await new Promise((r) => setTimeout(r, 2000));

        const { data: retry } = await supabase.auth.getSession();
        if (retry.session) {
          window.location.href = "/";
          return;
        }

        // Still no session — redirect home anyway
        setStatus("Redirecionando...");
        window.location.href = "/";
      } catch (err) {
        console.error("Auth callback error:", err);
        setStatus("Erro. Redirecionando...");
        setTimeout(() => { window.location.href = "/"; }, 1500);
      }
    };

    handleAuth();
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
