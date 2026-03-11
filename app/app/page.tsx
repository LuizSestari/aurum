"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import AurumShell from "@/components/aurum/AurumShell";
import ConfigLoader from "@/components/aurum/ConfigLoader";

export default function AppPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (!sess) {
        window.location.href = "/";
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    window.speechSynthesis?.cancel();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#070A0F] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-xl font-bold text-cyan-400">
              A
            </div>
          </div>
          <div className="text-sm text-white/40">Carregando Aurum...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  return (
    <>
      <ConfigLoader />
      <AurumShell
        userName={session.user?.user_metadata?.full_name || session.user?.email || undefined}
        onSignOut={signOut}
        onNavigatePricing={() => window.location.href = "/#pricing"}
        currentPlan="free"
      />
    </>
  );
}
