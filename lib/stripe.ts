// ─────────────────────────────────────────────
// Stripe Integration - Aurum
// Só funciona quando STRIPE_SECRET_KEY está configurada
// e o pacote 'stripe' está instalado (npm install stripe)
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let stripe: any = null;

// Inicializa Stripe apenas se a chave estiver configurada
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (stripeSecretKey) {
  try {
    // Dynamic import para não quebrar build sem o pacote stripe
    const Stripe = require("stripe");
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20",
    });
  } catch {
    console.warn("Pacote 'stripe' não instalado. Execute: npm install stripe");
  }
}

export { stripe };

// Interface para mapear tiers de plano para IDs de preço no Stripe
export interface PriceIds {
  pro_monthly: string;
  pro_yearly: string;
  max_monthly: string;
  max_yearly: string;
  teams_monthly: string;
  teams_yearly: string;
}

// Carrega os IDs de preço do Stripe a partir das variáveis de ambiente
export function getPriceIds(): PriceIds {
  return {
    pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
    max_monthly: process.env.STRIPE_PRICE_MAX_MONTHLY || "",
    max_yearly: process.env.STRIPE_PRICE_MAX_YEARLY || "",
    teams_monthly: process.env.STRIPE_PRICE_TEAMS_MONTHLY || "",
    teams_yearly: process.env.STRIPE_PRICE_TEAMS_YEARLY || "",
  };
}

// Mapa de tiers de plano para IDs de preço
export function getPriceIdForPlan(
  planTier: string,
  billingPeriod: "monthly" | "yearly"
): string | null {
  const priceIds = getPriceIds();

  const priceMap: Record<string, Record<string, string>> = {
    pro: { monthly: priceIds.pro_monthly, yearly: priceIds.pro_yearly },
    max: { monthly: priceIds.max_monthly, yearly: priceIds.max_yearly },
    teams: { monthly: priceIds.teams_monthly, yearly: priceIds.teams_yearly },
  };

  return priceMap[planTier]?.[billingPeriod] || null;
}

// Chave pública do Stripe (usada no frontend)
export function getPublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
}

// Secret do webhook para validação
export function getWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET || "";
}
