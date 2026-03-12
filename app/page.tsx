"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/aurum-auth";
import AurumShell from "@/components/aurum/AurumShell";
import ConfigLoader from "@/components/aurum/ConfigLoader";
import LoginPage from "@/components/aurum/pages/LoginPage";
import PricingPage from "@/components/aurum/pages/PricingPage";
import LandingPage from "@/components/aurum/pages/LandingPage";

type AppView = "app" | "login" | "pricing" | "landing";

export default function Home() {
  const {
    session,
    user,
    profile,
    loading,
    plan,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshProfile,
  } = useAuth();

  const [view, setView] = useState<AppView>(!session && !profile ? "landing" : "app");
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  // Handle checkout success/cancel query params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);

    if (params.get("checkout") === "success") {
      setCheckoutMessage("Assinatura ativada com sucesso!");
      // Refresh profile to get updated plan
      refreshProfile();
      // Clean URL
      window.history.replaceState({}, "", "/");
      // Auto-dismiss
      setTimeout(() => setCheckoutMessage(null), 5000);
    } else if (params.get("checkout") === "canceled") {
      setCheckoutMessage("Checkout cancelado.");
      window.history.replaceState({}, "", "/");
      setTimeout(() => setCheckoutMessage(null), 4000);
    }
  }, [refreshProfile]);

  // Loading
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

  // Pricing page (accessible anytime)
  if (view === "pricing") {
    return (
      <PricingPage
        currentPlan={plan}
        userId={user?.id || profile?.id}
        userEmail={user?.email || undefined}
        stripeCustomerId={(profile as any)?.stripeCustomerId || null}
        onBack={() => setView(session && profile ? "app" : "landing")}
      />
    );
  }

  // Not logged in → Landing page (default)
  if (!session && !profile) {
    if (view === "login") {
      return (
        <LoginPage
          onSignInGoogle={signInWithGoogle}
          onSignInEmail={signInWithEmail}
          onSignUpEmail={signUpWithEmail}
          onNavigatePricing={() => setView("pricing")}
          onBack={() => setView("landing")}
        />
      );
    }

    return (
      <LandingPage
        onGetStarted={() => setView("login")}
        onViewPricing={() => setView("pricing")}
        currentPlan={plan}
      />
    );
  }

  // Logged in → Aurum Shell
  return (
    <>
      <ConfigLoader />
      {/* Checkout success/cancel toast */}
      {checkoutMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-xl bg-emerald-500/90 text-white text-sm font-medium shadow-2xl shadow-emerald-500/30 animate-bounce-in">
          {checkoutMessage}
        </div>
      )}
      <AurumShell
        userName={profile?.fullName || session?.user?.email || undefined}
        onSignOut={signOut}
        onNavigatePricing={() => setView("pricing")}
        currentPlan={plan}
      />
    </>
  );
}
