import { NextRequest, NextResponse } from "next/server";
import { stripe, getWebhookSecret } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Tipo para eventos do Stripe que tratamos
type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: any;
  };
};

// Cria um cliente Supabase com a chave de serviço
// Isso permite atualizar dados do usuário sem necessidade de autenticação
function createSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Variáveis de ambiente do Supabase não configuradas");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Obtém o corpo da requisição como texto para validar a assinatura
    const rawBody = await request.text();

    // Obtém a assinatura do webhook dos headers
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Assinatura do webhook não fornecida" },
        { status: 400 }
      );
    }

    // Obtém a chave secreta do webhook
    const webhookSecret = getWebhookSecret();

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET não configurada");
      return NextResponse.json(
        { error: "Configuração do webhook incompleta" },
        { status: 500 }
      );
    }

    // Valida a assinatura do webhook para garantir que vem do Stripe
    let event: StripeEvent;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      ) as StripeEvent;
    } catch (error) {
      console.error("Erro ao validar assinatura do webhook:", error);
      return NextResponse.json(
        { error: "Assinatura do webhook inválida" },
        { status: 401 }
      );
    }

    // Cria o cliente Supabase para atualizar o banco de dados
    const supabase = createSupabaseServiceClient();

    // Processa diferentes tipos de eventos do Stripe
    switch (event.type) {
      // Evento disparado quando uma sessão de checkout é completada com sucesso
      case "checkout.session.completed": {
        const session = event.data.object as any;

        // Extrai as informações do usuário dos metadados
        const userId = session.metadata?.userId;
        const planTier = session.metadata?.planTier;
        const billingPeriod = session.metadata?.billingPeriod;

        if (!userId || !planTier) {
          console.error("Metadados incompletos na sessão de checkout");
          break;
        }

        // Atualiza o perfil do usuário com o novo plano
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            plan: planTier,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            billing_period: billingPeriod,
            subscription_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (updateError) {
          console.error(
            "Erro ao atualizar plano do usuário após checkout:",
            updateError
          );
        } else {
          console.log(
            `Plano do usuário ${userId} atualizado para ${planTier}`
          );
        }
        break;
      }

      // Evento disparado quando uma assinatura é atualizada
      // Pode indicar mudança de plano ou período de cobrança
      case "customer.subscription.updated": {
        const subscription = event.data.object as any;

        // Extrai o ID do cliente do Stripe
        const customerId = subscription.customer;

        // Busca o usuário pelo ID do cliente do Stripe
        const { data: profiles, error: fetchError } = await supabase
          .from("profiles")
          .select("id, plan")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (fetchError || !profiles || profiles.length === 0) {
          console.error(
            "Usuário não encontrado para customer ID:",
            customerId
          );
          break;
        }

        const userId = profiles[0].id;

        // Extrai o novo plano baseado no item de preço
        // O Stripe armazena o plano nos metadados ou podemos derivar da estrutura
        const priceId = subscription.items?.data?.[0]?.price?.id;
        let newPlan = profiles[0].plan; // Mantém o plano atual se não conseguir determinar o novo

        // Aqui você pode adicionar lógica para mapear priceId para planTier
        // Por enquanto, apenas registra o evento
        console.log(
          `Assinatura atualizada para usuário ${userId}, preço: ${priceId}`
        );

        // Atualiza o status da assinatura
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (updateError) {
          console.error(
            "Erro ao atualizar status da assinatura:",
            updateError
          );
        }
        break;
      }

      // Evento disparado quando uma assinatura é cancelada
      // Faz downgrade do usuário para o plano gratuito
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;

        const customerId = subscription.customer;

        // Busca o usuário pelo ID do cliente do Stripe
        const { data: profiles, error: fetchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (fetchError || !profiles || profiles.length === 0) {
          console.error(
            "Usuário não encontrado para customer ID:",
            customerId
          );
          break;
        }

        const userId = profiles[0].id;

        // Faz downgrade do usuário para o plano gratuito
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            plan: "free",
            subscription_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (updateError) {
          console.error("Erro ao fazer downgrade para plano gratuito:", updateError);
        } else {
          console.log(`Usuário ${userId} foi feito downgrade para plano gratuito`);
        }
        break;
      }

      // Casos adicionais que podem ser úteis
      case "invoice.payment_succeeded": {
        console.log("Pagamento de fatura bem-sucedido");
        break;
      }

      case "invoice.payment_failed": {
        console.log("Falha no pagamento da fatura");
        break;
      }

      default:
        // Apenas registra eventos não tratados
        console.log(`Evento do Stripe não tratado: ${event.type}`);
    }

    // Retorna 200 para confirmar que o webhook foi recebido e processado
    // Stripe considerará qualquer resposta 2xx como sucesso
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook do Stripe:", error);

    // Retorna erro apropriado
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Erro ao processar webhook: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Erro desconhecido ao processar webhook" },
      { status: 500 }
    );
  }
}
