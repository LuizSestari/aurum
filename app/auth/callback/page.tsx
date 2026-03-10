"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    const run = async () => {
      await supabase.auth.getSession();
      window.location.href = "/";
    };
    run();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-sm opacity-80">
      Conectando o Aurum…
    </div>
  );
}
