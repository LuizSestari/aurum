"use client";

import { useState } from "react";

interface CheckoutParams {
  userId: string;
  email?: string;
  planTier: string;
  billingPeriod: "monthly" | "yearly";
}

/**
 * Hook to handle Stripe checkout flow.
 * Calls /api/stripe/checkout and redirects to Stripe.
 */
export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async (params: CheckoutParams) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Erro ao iniciar checkout");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
      setLoading(false);
    }
  };

  const openPortal = async (customerId: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Erro ao abrir portal");
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
      setLoading(false);
    }
  };

  return { startCheckout, openPortal, loading, error };
}
