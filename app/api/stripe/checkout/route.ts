import { NextRequest, NextResponse } from "next/server";
import { stripe, getPriceIdForPlan } from "@/lib/stripe";

interface CheckoutRequestBody {
  userId: string;
  planTier: string;
  billingPeriod: "monthly" | "yearly";
  email?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe não está configurado. Configure STRIPE_SECRET_KEY." },
        { status: 503 }
      );
    }

    const body: CheckoutRequestBody = await request.json();
    const { userId, planTier, billingPeriod, email } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }
    if (!planTier || planTier === "free") {
      return NextResponse.json({ error: "Plano gratuito não requer checkout" }, { status: 400 });
    }
    if (!billingPeriod || !["monthly", "yearly"].includes(billingPeriod)) {
      return NextResponse.json({ error: "billingPeriod deve ser 'monthly' ou 'yearly'" }, { status: 400 });
    }

    const priceId = getPriceIdForPlan(planTier, billingPeriod);
    if (!priceId) {
      return NextResponse.json(
        { error: `Preço não configurado para plano '${planTier}' (${billingPeriod})` },
        { status: 400 }
      );
    }

    const baseUrl = request.headers.get("origin") || "http://localhost:3000";

    const sessionParams: any = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/?checkout=success&plan=${planTier}`,
      cancel_url: `${baseUrl}/?checkout=canceled`,
      allow_promotion_codes: true,
      metadata: { userId, planTier, billingPeriod },
    };

    // Pre-fill email if available
    if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url ?? "" });
  } catch (error) {
    console.error("[Aurum Stripe] Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar checkout" },
      { status: 500 }
    );
  }
}
