import { NextRequest, NextResponse } from "next/server";
import { stripe, getPriceIdForPlan } from "@/lib/stripe";

// Interface para validar o corpo da requisição
interface CheckoutRequestBody {
  priceId?: string; // ID de preço específico do Stripe
  userId: string;
  planTier: string;
  billingPeriod: "monthly" | "yearly";
}

export async function POST(request: NextRequest) {
  try {
    // Extrai o corpo da requisição
    const body: CheckoutRequestBody = await request.json();

    const { priceId: providedPriceId, userId, planTier, billingPeriod } =
      body;

    // Valida os parâmetros obrigatórios
    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    if (!planTier) {
      return NextResponse.json(
        { error: "planTier é obrigatório" },
        { status: 400 }
      );
    }

    if (!billingPeriod || !["monthly", "yearly"].includes(billingPeriod)) {
      return NextResponse.json(
        { error: "billingPeriod deve ser 'monthly' ou 'yearly'" },
        { status: 400 }
      );
    }

    // Determina o ID de preço a usar
    // Prioriza o priceId fornecido, caso contrário busca pelo tier e período
    let priceId = providedPriceId;

    if (!priceId) {
      priceId = getPriceIdForPlan(planTier, billingPeriod) ?? undefined;

      if (!priceId) {
        return NextResponse.json(
          {
            error: `Nenhum preço encontrado para o plano '${planTier}' com período '${billingPeriod}'`,
          },
          { status: 400 }
        );
      }
    }

    // Obtém a URL base para os URLs de sucesso e cancelamento
    const baseUrl = request.headers.get("origin") || "http://localhost:3000";

    // Cria uma sessão de checkout no Stripe
    // Modo 'subscription' cria uma assinatura recorrente
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // URLs para redirecionamento após checkout
      success_url: `${baseUrl}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/billing?canceled=true`,
      // Permite que os usuários usem cupons de promoção
      allow_promotion_codes: true,
      // Metadados para rastrear informações do usuário e plano
      metadata: {
        userId,
        planTier,
        billingPeriod,
      },
    });

    // Retorna a URL da sessão de checkout para o cliente
    // O cliente deve redirecionar para essa URL para completar o pagamento
    return NextResponse.json({ url: session.url ?? "" });
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);

    // Trata diferentes tipos de erro
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Erro ao criar checkout: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Erro desconhecido ao criar checkout" },
      { status: 500 }
    );
  }
}
