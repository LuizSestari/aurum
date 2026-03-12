// ─────────────────────────────────────────────
// Stripe Integration - Aurum
// Uses dynamic require so builds don't break without the stripe package
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let stripe: any = null;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (stripeSecretKey) {
  try {
    const Stripe = require("stripe");
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20",
    });
  } catch {
    console.warn("[Aurum] Stripe package not installed. Run: npm install stripe");
  }
}

export { stripe };

// ─────────────────────────────────────────────
// Price ID Mapping
// Each env var maps a plan+period to a Stripe Price ID
// Create these in Stripe Dashboard → Products → Prices
// ─────────────────────────────────────────────

const PRICE_MAP: Record<string, Record<string, string>> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || "",
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
  },
  max: {
    monthly: process.env.STRIPE_PRICE_MAX_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_MAX_YEARLY || "",
  },
};

// Reverse mapping: Stripe Price ID → plan tier
const PRICE_TO_PLAN: Record<string, string> = {};
for (const [plan, periods] of Object.entries(PRICE_MAP)) {
  for (const [, priceId] of Object.entries(periods)) {
    if (priceId) PRICE_TO_PLAN[priceId] = plan;
  }
}

/**
 * Get Stripe Price ID for a plan tier + billing period
 */
export function getPriceIdForPlan(
  planTier: string,
  billingPeriod: "monthly" | "yearly"
): string | null {
  return PRICE_MAP[planTier]?.[billingPeriod] || null;
}

/**
 * Get plan tier from a Stripe Price ID (used by webhooks)
 */
export function getPlanFromPriceId(priceId: string): string | null {
  return PRICE_TO_PLAN[priceId] || null;
}

/**
 * Publishable key for frontend (Stripe.js / checkout redirect)
 */
export function getPublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
}

/**
 * Webhook secret for signature validation
 */
export function getWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET || "";
}
