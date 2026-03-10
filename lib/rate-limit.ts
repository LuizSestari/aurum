/**
 * Sistema de limite de taxa (rate limiting) em memória para API routes.
 * Rastreia requisições por endereço IP e aplica limites configuráveis.
 * Sem dependências externas.
 */

// Interface para configuração do rate limiter
interface RateLimitConfig {
  windowMs: number; // Janela de tempo em milissegundos
  max: number; // Máximo de requisições por janela
}

// Interface para resposta do rate limiter
interface RateLimitResult {
  success: boolean; // Se a requisição foi permitida
  remaining: number; // Requisições restantes na janela atual
  reset: number; // Timestamp quando o contador será resetado (ms)
}

// Estrutura para armazenar dados de requisições por IP
interface IpRequest {
  count: number;
  resetAt: number;
}

// Armazenamento em memória de requisições por IP
const requestStore = new Map<string, IpRequest>();

/**
 * Extrai o endereço IP do cliente a partir dos headers da requisição.
 * Verifica em ordem: x-forwarded-for, x-real-ip, fallback para 'anonymous'
 */
function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for pode conter múltiplos IPs, pegar o primeiro
    return forwarded.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "anonymous";
}

/**
 * Cria uma função middleware de rate limiting com configuração específica.
 * @param config Configuração do rate limiter (windowMs, max)
 * @returns Função que verifica o rate limit para um IP
 */
function createRateLimiter(config: RateLimitConfig) {
  return (headers: Headers): RateLimitResult => {
    const ip = getClientIp(headers);
    const now = Date.now();

    // Obter ou criar entrada para este IP
    let ipData = requestStore.get(ip);

    // Se a janela expirou ou não existe, criar nova entrada
    if (!ipData || now >= ipData.resetAt) {
      ipData = {
        count: 1,
        resetAt: now + config.windowMs,
      };
      requestStore.set(ip, ipData);

      return {
        success: true,
        remaining: config.max - 1,
        reset: ipData.resetAt,
      };
    }

    // Janela ainda está ativa
    ipData.count += 1;

    const allowed = ipData.count <= config.max;

    return {
      success: allowed,
      remaining: Math.max(0, config.max - ipData.count),
      reset: ipData.resetAt,
    };
  };
}

/**
 * Limpa entradas expiradas do armazenamento em memória.
 * Deve ser chamada periodicamente para evitar vazamento de memória.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [ip, data] of requestStore.entries()) {
    if (now >= data.resetAt) {
      requestStore.delete(ip);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[RateLimit] Limpeza: ${cleaned} entradas expiradas removidas`);
  }
}

/**
 * Inicia limpeza periódica de entradas expiradas.
 * Executa a cada 60 segundos.
 */
let cleanupInterval: NodeJS.Timeout;

function startCleanupInterval(): void {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    cleanupExpiredEntries();
  }, 60_000); // A cada 60 segundos

  // Permitir que o processo termine mesmo com este interval
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

// Iniciar limpeza ao carregar o módulo
startCleanupInterval();

// ─────────────────────────────────────────────────────────────────
// Limitadores Pré-configurados
// ─────────────────────────────────────────────────────────────────

/**
 * Limitador para endpoints de API autenticados.
 * 100 requisições por minuto
 */
export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
});

/**
 * Limitador para endpoint de chat de IA.
 * 30 requisições por minuto (mais restritivo porque é computacionalmente caro)
 */
export const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,
});

/**
 * Limitador para endpoints de autenticação (login/signup).
 * 10 requisições por minuto (previne força bruta)
 */
export const authLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
});

/**
 * Limitador para endpoints de pagamento (Stripe).
 * 20 requisições por minuto
 */
export const stripeLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 20,
});

/**
 * Função genérica para criar um limitador customizado.
 * Útil para endpoints específicos com requisitos diferentes.
 */
export function createCustomLimiter(windowMs: number, max: number) {
  return createRateLimiter({ windowMs, max });
}

/**
 * Interface exportada principal para uso como middleware.
 * Combina tudo o que é necessário para aplicar rate limiting.
 */
export interface RateLimitMiddleware {
  (headers: Headers): RateLimitResult;
}

// Re-exportar tipo de resultado para facilidade de uso
export type { RateLimitResult };
