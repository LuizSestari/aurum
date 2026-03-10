"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import AurumShell from "@/components/aurum/AurumShell";

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
        <div className="text-sm text-white/60">Carregando Aurum...</div>
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
    <AurumShell
      userName={session.user?.email ?? undefined}
      onSignOut={signOut}
    />
  );
}
