"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import type { PlanTier } from "@/lib/aurum-plans";
import { PLANS, hasFeature, isWithinLimit } from "@/lib/aurum-plans";

export interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl: string;
  plan: PlanTier;
  planStartedAt: string | null;
  planExpiresAt: string | null;
  teamId: string | null;
  isTeamAdmin: boolean;
  language: string;
  onboardingCompleted: boolean;
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

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !data) return null;

      const p: UserProfile = {
        id: data.id,
        fullName: data.full_name ?? "",
        avatarUrl: data.avatar_url ?? "",
        plan: data.plan ?? "free",
        planStartedAt: data.plan_started_at,
        planExpiresAt: data.plan_expires_at,
        teamId: data.team_id,
        isTeamAdmin: data.is_team_admin ?? false,
        language: data.language ?? "pt-BR",
        onboardingCompleted: data.onboarding_completed ?? false,
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
        planStartedAt: null,
        planExpiresAt: null,
        teamId: null,
        isTeamAdmin: false,
        language: "pt-BR",
        onboardingCompleted: true,
      });
      setLoading(false);
      return;
    }

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const sess = data.session;
      setSession(sess);

      if (sess?.user?.id) {
        await fetchProfile(sess.user.id);
        await fetchUsage(sess.user.id);
      }
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      if (sess?.user?.id) {
        await fetchProfile(sess.user.id);
        await fetchUsage(sess.user.id);
      } else {
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    window.speechSynthesis?.cancel();
    if (hasSupabaseConfig) await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const canUseFeature = (feature: string) => {
    return hasFeature(plan, feature as keyof typeof PLANS.free.features);
  };

  const isWithinUsageLimitFn = (limitKey: string, current?: number) => {
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
