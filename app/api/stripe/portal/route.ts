import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

// Interface para validar o corpo da requisição
interface PortalRequestBody {
  customerId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Extrai o corpo da requisição
    const body: PortalRequestBody = await request.json();

    const { customerId } = body;

    // Valida se o ID do cliente foi fornecido
    if (!customerId) {
      return NextResponse.json(
        { error: "customerId é obrigatório" },
        { status: 400 }
      );
    }

    // Obtém a URL base para o URL de retorno
    const baseUrl = request.headers.get("origin") || "http://localhost:3000";

    // Cria uma sessão do Stripe Customer Portal
    // O portal permite que os usuários gerenciem suas próprias assinaturas
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      // URL para onde o usuário volta após gerenciar sua assinatura
      return_url: `${baseUrl}/dashboard/billing`,
    });

    // Retorna a URL do portal para o cliente
    // O cliente deve redirecionar para essa URL para acessar o portal de gerenciamento
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Erro ao criar sessão do portal de faturamento:", error);

    // Trata diferentes tipos de erro
    if (error instanceof Error) {
      // Verifica se é um erro específico do Stripe (cliente não encontrado, etc)
      if (error.message.includes("No such customer")) {
        return NextResponse.json(
          { error: "Cliente não encontrado no Stripe" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: `Erro ao criar portal: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Erro desconhecido ao criar portal de faturamento" },
      { status: 500 }
    );
  }
}
