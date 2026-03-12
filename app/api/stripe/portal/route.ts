import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe não configurado" }, { status: 503 });
    }

    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json({ error: "customerId é obrigatório" }, { status: 400 });
    }

    const baseUrl = request.headers.get("origin") || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("[Aurum Stripe] Portal error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar portal" },
      { status: 500 }
    );
  }
}
