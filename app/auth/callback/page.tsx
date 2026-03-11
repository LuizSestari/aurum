"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [status, setStatus] = useState("Autenticando...");

  useEffect(() => {
    // With implicit flow, Supabase auto-detects tokens from URL hash
    // (#access_token=...&refresh_token=...) and establishes the session.
    // We just listen for the auth state change.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Session established — redirect to app
        window.location.href = "/";
      }
    });

    // Fallback: if tokens were already processed before listener attached
    const checkExisting = async () => {
      // Give Supabase a moment to process the hash
      await new Promise((r) => setTimeout(r, 500));

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        window.location.href = "/";
        return;
      }

      // Final fallback after 4 seconds
      setTimeout(() => {
        setStatus("Redirecionando...");
        window.location.href = "/";
      }, 4000);
    };

    checkExisting();

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
