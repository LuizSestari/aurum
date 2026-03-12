"use client";

import { useState } from "react";
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
    profile,
    loading,
    plan,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  } = useAuth();

  const [view, setView] = useState<AppView>(!session && !profile ? "landing" : "app");

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
        onSelectPlan={(selectedPlan) => {
          // TODO: integrate with Stripe/payment provider
          console.log("Selected plan:", selectedPlan);
          setView(session && profile ? "app" : "landing");
        }}
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

    // Landing page (view === "landing")
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
      <AurumShell
        userName={profile?.fullName || session?.user?.email || undefined}
        onSignOut={signOut}
        onNavigatePricing={() => setView("pricing")}
        currentPlan={plan}
      />
    </>
  );
}
