import { NextRequest, NextResponse } from "next/server";
import { stripe, getWebhookSecret, getPlanFromPriceId } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client for server-side mutations
function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    const webhookSecret = getWebhookSecret();
    if (!webhookSecret) {
      console.error("[Aurum Stripe] STRIPE_WEBHOOK_SECRET not set");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    // Validate signature
    let event: any;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error("[Aurum Stripe] Invalid signature:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const supabase = createSupabaseAdmin();

    switch (event.type) {
      // ─── Checkout completed ───────────────────────
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planTier = session.metadata?.planTier;
        const billingPeriod = session.metadata?.billingPeriod;

        if (!userId || !planTier) {
          console.error("[Aurum Stripe] Missing metadata in checkout session");
          break;
        }

        const { error } = await supabase
          .from("profiles")
          .update({
            plan: planTier,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            billing_period: billingPeriod || "monthly",
            subscription_active: true,
            plan_started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          console.error("[Aurum Stripe] Failed to update profile after checkout:", error);
        } else {
          console.log(`[Aurum Stripe] User ${userId} upgraded to ${planTier}`);
        }
        break;
      }

      // ─── Subscription updated (plan change, renewal) ──
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, plan")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (!profiles?.length) {
          console.error("[Aurum Stripe] No profile for customer:", customerId);
          break;
        }

        const userId = profiles[0].id;

        // Try to detect plan change from the price ID
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const detectedPlan = priceId ? getPlanFromPriceId(priceId) : null;

        const updateData: Record<string, any> = {
          subscription_active: subscription.status === "active",
          updated_at: new Date().toISOString(),
        };

        if (detectedPlan) {
          updateData.plan = detectedPlan;
        }

        await supabase.from("profiles").update(updateData).eq("id", userId);
        console.log(`[Aurum Stripe] Subscription updated for user ${userId}`);
        break;
      }

      // ─── Subscription cancelled ───────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (!profiles?.length) {
          console.error("[Aurum Stripe] No profile for customer:", customerId);
          break;
        }

        const userId = profiles[0].id;

        await supabase
          .from("profiles")
          .update({
            plan: "free",
            subscription_active: false,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        console.log(`[Aurum Stripe] User ${userId} downgraded to free`);
        break;
      }

      // ─── Payment failed ───────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.warn(`[Aurum Stripe] Payment failed for invoice ${invoice.id}`);
        // Could send an email notification here
        break;
      }

      default:
        console.log(`[Aurum Stripe] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Aurum Stripe] Webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
