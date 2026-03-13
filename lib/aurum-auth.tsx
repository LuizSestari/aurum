"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import type { PlanTier } from "@/lib/aurum-plans";
import { PLANS, hasFeature, isWithinLimit } from "@/lib/aurum-plans";
import { startAutoSync, stopAutoSync, syncNow } from "@/lib/aurum-sync";

export type UserRole = "user" | "admin" | "dev";

export interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl: string;
  plan: PlanTier;
  role: UserRole;
  planStartedAt: string | null;
  planExpiresAt: string | null;
  teamId: string | null;
  isTeamAdmin: boolean;
  language: string;
  onboardingCompleted: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionActive: boolean;
  billingPeriod: string | null;
}

export interface UsageData {
  aiMessages: number;
  ttsCharacters: number;
  voiceMinutes: number;
  storageMb: number;
  apiCalls: number;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  usage: UsageData;
  loading: boolean;
  plan: PlanTier;
  role: UserRole;
  isAdmin: boolean;
  isDev: boolean;
  // Auth actions
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  // Plan helpers
  canUseFeature: (feature: string) => boolean;
  isWithinUsageLimit: (limitKey: string, current?: number) => boolean;
  incrementUsage: (key: "aiMessages" | "ttsCharacters" | "voiceMinutes" | "apiCalls", amount?: number) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UsageData>({ aiMessages: 0, ttsCharacters: 0, voiceMinutes: 0, storageMb: 0, apiCalls: 0 });
  const [loading, setLoading] = useState(true);

  const plan = profile?.plan ?? "free";
  const role: UserRole = profile?.role ?? "user";
  const isAdmin = role === "admin";
  const isDev = role === "dev" || role === "admin";

  const fetchProfile = useCallback(async (userId: string, user?: User | null) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !data) {
        // Profile doesn't exist yet — auto-create it (backup for trigger)
        const meta = user?.user_metadata ?? {};
        const newProfile = {
          id: userId,
          full_name: meta.full_name ?? meta.name ?? user?.email?.split("@")[0] ?? "",
          avatar_url: meta.avatar_url ?? meta.picture ?? "",
          plan: "free",
        };

        const { data: created } = await supabase
          .from("profiles")
          .upsert(newProfile)
          .select()
          .single();

        if (created) {
          const p: UserProfile = {
            id: created.id,
            fullName: created.full_name ?? "",
            avatarUrl: created.avatar_url ?? "",
            plan: created.plan ?? "free",
            role: (created.role as UserRole) ?? "user",
            planStartedAt: created.plan_started_at,
            planExpiresAt: created.plan_expires_at,
            teamId: created.team_id,
            isTeamAdmin: created.is_team_admin ?? false,
            language: created.language ?? "pt-BR",
            onboardingCompleted: created.onboarding_completed ?? false,
            stripeCustomerId: created.stripe_customer_id ?? null,
            stripeSubscriptionId: created.stripe_subscription_id ?? null,
            subscriptionActive: created.subscription_active ?? false,
            billingPeriod: created.billing_period ?? null,
          };
          setProfile(p);
          return p;
        }
        return null;
      }

      const p: UserProfile = {
        id: data.id,
        fullName: data.full_name ?? "",
        avatarUrl: data.avatar_url ?? "",
        plan: data.plan ?? "free",
        role: (data.role as UserRole) ?? "user",
        planStartedAt: data.plan_started_at,
        planExpiresAt: data.plan_expires_at,
        teamId: data.team_id,
        isTeamAdmin: data.is_team_admin ?? false,
        language: data.language ?? "pt-BR",
        onboardingCompleted: data.onboarding_completed ?? false,
        stripeCustomerId: data.stripe_customer_id ?? null,
        stripeSubscriptionId: data.stripe_subscription_id ?? null,
        subscriptionActive: data.subscription_active ?? false,
        billingPeriod: data.billing_period ?? null,
      };
      setProfile(p);
      return p;
    } catch {
      return null;
    }
  }, []);

  const fetchUsage = useCallback(async (userId: string) => {
    try {
      const period = getCurrentPeriod();
      const { data } = await supabase
        .from("usage")
        .select("*")
        .eq("user_id", userId)
        .eq("period", period)
        .single();

      if (data) {
        setUsage({
          aiMessages: data.ai_messages ?? 0,
          ttsCharacters: data.tts_characters ?? 0,
          voiceMinutes: data.voice_minutes ?? 0,
          storageMb: data.storage_mb ?? 0,
          apiCalls: data.api_calls ?? 0,
        });
      }
    } catch {
      // No usage record yet
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
      await fetchUsage(session.user.id);
    }
  }, [session, fetchProfile, fetchUsage]);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      // No Supabase — set a mock profile for development
      setProfile({
        id: "local",
        fullName: "Luiz",
        avatarUrl: "",
        plan: "free",
        role: "admin",
        planStartedAt: null,
        planExpiresAt: null,
        teamId: null,
        isTeamAdmin: false,
        language: "pt-BR",
        onboardingCompleted: true,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionActive: false,
        billingPeriod: null,
      });
      setLoading(false);
      return;
    }

    // On init, check if this is a fresh browser session.
    // sessionStorage is cleared when the browser closes, so if our marker
    // is missing, the user closed the browser → sign them out.
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sess = data.session;

        if (sess && !sessionStorage.getItem("aurum_active")) {
          // Browser was closed and reopened — force logout
          await supabase.auth.signOut();
          setSession(null);
          setLoading(false);
          return;
        }

        setSession(sess);

        if (sess?.user?.id) {
          sessionStorage.setItem("aurum_active", "1");
          await fetchProfile(sess.user.id, sess.user);
          await fetchUsage(sess.user.id);
          // Start cloud sync
          startAutoSync(sess.user.id);
        }
      } catch (err) {
        console.error("[Aurum Auth] init error:", err);
      }
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      if (sess?.user?.id) {
        sessionStorage.setItem("aurum_active", "1");
        await fetchProfile(sess.user.id, sess.user);
        await fetchUsage(sess.user.id);
        startAutoSync(sess.user.id);
      } else {
        sessionStorage.removeItem("aurum_active");
        stopAutoSync();
        setProfile(null);
        setUsage({ aiMessages: 0, ttsCharacters: 0, voiceMinutes: 0, storageMb: 0, apiCalls: 0 });
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchProfile, fetchUsage]);

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        console.error("Google OAuth error:", error.message);
        alert(`Erro ao conectar com Google: ${error.message}`);
      }
    } catch (err) {
      console.error("Google OAuth exception:", err);
      alert("Erro inesperado ao conectar com Google. Verifique o console.");
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error: error.message };
    // If user already exists but unconfirmed, Supabase returns a fake user with no identities
    if (data.user && data.user.identities?.length === 0) {
      return { error: "Este email já está cadastrado. Tente fazer login." };
    }
    // If email confirmation is required
    if (data.user && !data.session) {
      return { error: null }; // success — will show confirmation message in UI
    }
    return { error: null };
  };

  const signOut = async () => {
    window.speechSynthesis?.cancel();
    sessionStorage.removeItem("aurum_active");
    stopAutoSync();
    // Push final sync before logging out
    if (hasSupabaseConfig && session?.user?.id) {
      await syncNow(session.user.id).catch(() => {});
    }
    if (hasSupabaseConfig) await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setUsage({ aiMessages: 0, ttsCharacters: 0, voiceMinutes: 0, storageMb: 0, apiCalls: 0 });
  };

  const canUseFeature = (feature: string) => {
    // Admin/dev has access to everything
    if (isAdmin || isDev) return true;
    return hasFeature(plan, feature as keyof typeof PLANS.free.features);
  };

  const isWithinUsageLimitFn = (limitKey: string, current?: number) => {
    // Admin/dev has no usage limits
    if (isAdmin || isDev) return true;
    const usageMap: Record<string, number> = {
      aiMessagesPerMonth: usage.aiMessages,
      ttsCharactersPerMonth: usage.ttsCharacters,
      voiceMinutesPerMonth: usage.voiceMinutes,
    };
    const val = current ?? usageMap[limitKey] ?? 0;
    return isWithinLimit(plan, limitKey as keyof typeof PLANS.free.limits, val);
  };

  const incrementUsage = async (key: "aiMessages" | "ttsCharacters" | "voiceMinutes" | "apiCalls", amount = 1) => {
    setUsage((prev) => ({ ...prev, [key]: prev[key] + amount }));

    if (!hasSupabaseConfig || !session?.user?.id) return;

    const period = getCurrentPeriod();
    const colMap: Record<string, string> = {
      aiMessages: "ai_messages",
      ttsCharacters: "tts_characters",
      voiceMinutes: "voice_minutes",
      apiCalls: "api_calls",
    };

    try {
      // Upsert usage
      const { data: existing } = await supabase
        .from("usage")
        .select("id, " + colMap[key])
        .eq("user_id", session.user.id)
        .eq("period", period)
        .single();

      if (existing) {
        await supabase.from("usage").update({
          [colMap[key]]: (existing[colMap[key] as keyof typeof existing] as number ?? 0) + amount,
        }).eq("user_id", session.user.id).eq("period", period);
      } else {
        await supabase.from("usage").insert({
          user_id: session.user.id,
          period,
          [colMap[key]]: amount,
        });
      }
    } catch {
      // Silently fail — usage tracking shouldn't block UX
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      usage,
      loading,
      plan,
      role,
      isAdmin,
      isDev,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      canUseFeature,
      isWithinUsageLimit: isWithinUsageLimitFn,
      incrementUsage,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
