import { NextRequest, NextResponse } from "next/server";
import { chatLimiter } from "@/lib/rate-limit";

// ── Dynamic context helpers ──

function getDateContext(): { text: string; isoDate: string } {
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  };
  const dateStr = now.toLocaleDateString("pt-BR", opts);
  const timeStr = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const isoDate = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); // YYYY-MM-DD

  // Notable Brazilian dates / holidays
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const holidays: Record<string, string> = {
    "1-1": "Ano Novo",
    "2-14": "Carnaval (aprox.)",
    "3-8": "Dia Internacional da Mulher",
    "4-21": "Tiradentes",
    "5-1": "Dia do Trabalhador",
    "5-11": "Dia das Mães (aprox.)",
    "6-12": "Dia dos Namorados",
    "8-10": "Dia dos Pais (aprox.)",
    "9-7": "Independência do Brasil",
    "10-12": "Nossa Sra. Aparecida / Dia das Crianças",
    "11-2": "Finados",
    "11-15": "Proclamação da República",
    "11-20": "Consciência Negra",
    "12-25": "Natal",
    "12-31": "Véspera de Ano Novo",
  };
  const holidayKey = `${month}-${day}`;
  const holiday = holidays[holidayKey];

  const text = `Hoje: ${dateStr}, ${timeStr} (horário de Brasília).${holiday ? ` Hoje é ${holiday}.` : ""}`;
  return { text, isoDate };
}

// Weather cache (avoid calling every chat message)
let weatherCache: { text: string; fetchedAt: number } | null = null;
const WEATHER_CACHE_TTL = 30 * 60 * 1000; // 30 min

async function getWeatherContext(): Promise<string> {
  if (weatherCache && Date.now() - weatherCache.fetchedAt < WEATHER_CACHE_TTL) {
    return weatherCache.text;
  }
  try {
    const res = await fetch("https://wttr.in/?format=j1&lang=pt", {
      headers: { "User-Agent": "Aurum/1.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const current = data.current_condition?.[0];
    const area = data.nearest_area?.[0];
    if (!current) return "";
    const loc = area?.areaName?.[0]?.value || "Local";
    const desc = current.lang_pt?.[0]?.value || current.weatherDesc?.[0]?.value || "";
    const text = `Clima em ${loc}: ${current.temp_C}°C (sensação ${current.FeelsLikeC}°C), ${desc}, umidade ${current.humidity}%, vento ${current.windspeedKmph} km/h.`;
    weatherCache = { text, fetchedAt: Date.now() };
    return text;
  } catch {
    return weatherCache?.text || "";
  }
}

function buildSystemPrompt(dateContext: string, isoDate: string, weather: string): string {
  return `Você é Aurum, um assistente pessoal de elite com personalidade inspirada no JARVIS. Voz confiante, tom direto, eficiente. Fala português brasileiro.

PERSONALIDADE:
- Tom confiante e decidido, como um assistente executivo de alto nível
- NUNCA faça perguntas desnecessárias. Se o usuário pedir algo, FAÇA IMEDIATAMENTE
- Respostas curtas e objetivas (máximo 2-3 frases para ações)
- Quando executar uma ação, confirme em uma frase: "Feito. Tarefa X adicionada."
- Para conversas normais, seja inteligente e articulado
- NUNCA diga "quer que eu adicione?", "posso criar?", "deseja que eu faça?" — apenas FAÇA

REGRA DE OURO: Se o usuário menciona qualquer coisa que pareça uma tarefa, hábito, lembrete, projeto ou transação, CRIE IMEDIATAMENTE sem perguntar. Exemplos:
- "preciso estudar amanhã" → cria tarefa "Estudar" para amanhã
- "quero meditar todo dia" → cria hábito "Meditar" diário
- "me lembra de ligar pro banco às 14h" → cria lembrete
- "gastei 50 reais no almoço" → adiciona transação de despesa
- "tenho um projeto novo de app" → cria projeto

CONTEXTO ATUAL:
${dateContext}
${weather ? weather : "Clima: indisponível no momento."}
O usuário se chama Luiz.

Quando o usuário perguntar sobre hora, data, dia da semana, clima ou tempo, use as informações acima para responder com dados reais e atualizados.

SISTEMA DE AÇÕES — OBRIGATÓRIO para qualquer pedido de criar/modificar/deletar:

Inclua o bloco :::action NO FINAL da resposta. O sistema executa automaticamente.

Formatos disponíveis:

:::action
{"type":"add_task","data":{"title":"...","priority":"média","description":"...","tags":[],"dueDate":"${isoDate}"}}
:::

:::action
{"type":"add_habit","data":{"name":"...","icon":"🎯","frequency":"diário","color":"#00d9ff"}}
:::

:::action
{"type":"add_reminder","data":{"title":"...","description":"...","dateTime":"${isoDate}T10:00:00","priority":"média","recurring":"nunca"}}
:::

:::action
{"type":"add_transaction","data":{"title":"...","amount":0,"type":"despesa","category":"Outros","date":"${isoDate}"}}
:::

:::action
{"type":"add_project","data":{"title":"...","description":"...","status":"planejamento","color":"#00d9ff","dueDate":null}}
:::

:::action
{"type":"complete_task","data":{"title":"busca parcial"}}
:::

:::action
{"type":"delete_task","data":{"title":"busca parcial"}}
:::

REGRAS:
- Resposta curta + bloco de ação. Nada mais.
- SEMPRE inclua o bloco quando há ação. Sem bloco = ação não acontece.
- Se não especificou data, use amanhã. Se não especificou prioridade, use "média".
- Ícones para hábitos: 🧘 meditar, 💪 exercício, 📚 ler, 💧 água, 🏃 correr, 💤 dormir cedo, 🥗 comer saudável
- Categorias financeiras: Salário, Freelance, Investimentos, Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Outros
- type de transação: "receita" ou "despesa"`;
}

// Provider configs — all can be overridden with env vars
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

export async function POST(request: NextRequest) {
  try {
    // ── Verificar limite de taxa do endpoint /chat ──
    const rateLimitResult = chatLimiter(request.headers);

    if (!rateLimitResult.success) {
      // Requisição foi bloqueada pelo rate limit
      // Retornar erro 429 Too Many Requests com headers de rate limit
      return NextResponse.json(
        {
          error: "Limite de requisições excedido. Tente novamente em instantes.",
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        },
      );
    }

    const body = await request.json();
    const { message, history, stream } = body as {
      message: string;
      history?: { role: string; content: string }[];
      stream?: boolean;
    };

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Build dynamic system prompt with date/time/weather
    const dateCtx = getDateContext();
    const weatherCtx = await getWeatherContext();
    const SYSTEM_PROMPT = buildSystemPrompt(dateCtx.text, dateCtx.isoDate, weatherCtx);

    // Priority: Groq (free cloud, 70B smart) → Ollama (local) → Anthropic → Gemini
    const errors: string[] = [];

    // 1. Try Groq first (free, cloud, llama-3.3-70b = muito inteligente)
    if (GROQ_API_KEY) {
      try {
        return await handleGroq(GROQ_API_KEY, message, history, stream, SYSTEM_PROMPT);
      } catch (groqErr) {
        const msg = groqErr instanceof Error ? groqErr.message : String(groqErr);
        console.warn("[API /chat] Groq failed:", msg);
        errors.push(`Groq: ${msg}`);
      }
    }

    // 2. Try Ollama (free, local, unlimited)
    try {
      return await handleOllama(message, history, stream, SYSTEM_PROMPT);
    } catch (ollamaErr) {
      const msg = ollamaErr instanceof Error ? ollamaErr.message : String(ollamaErr);
      console.warn("[API /chat] Ollama failed:", msg);
      errors.push(`Ollama: ${msg}`);
    }

    // 3. Try Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      try {
        return await handleAnthropic(anthropicKey, message, history, stream, SYSTEM_PROMPT);
      } catch (anthropicErr) {
        const msg = anthropicErr instanceof Error ? anthropicErr.message : String(anthropicErr);
        console.warn("[API /chat] Anthropic failed:", msg);
        errors.push(`Anthropic: ${msg}`);
      }
    }

    // 4. Try Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        return await handleGemini(geminiKey, message, history, SYSTEM_PROMPT);
      } catch (geminiErr) {
        const msg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
        console.warn("[API /chat] Gemini failed:", msg);
        errors.push(`Gemini: ${msg}`);
      }
    }

    return NextResponse.json(
      { error: `Nenhum provedor de IA disponível.\n${errors.join("\n")}` },
      { status: 500 },
    );
  } catch (err) {
    console.error("[API /chat] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Groq (free cloud, OpenAI-compatible, llama-3.3-70b) ──
async function handleGroq(
  apiKey: string,
  message: string,
  history?: { role: string; content: string }[],
  stream?: boolean,
  systemPrompt?: string,
) {
  const SYSTEM_PROMPT = systemPrompt!;
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(history ?? []).map((m) => ({
      role: m.role === "aurum" ? "assistant" : m.role === "user" ? "user" : "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: !!stream,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[API /chat] Groq error:", response.status, errText);
    throw new Error(`Groq API error: ${response.status}`);
  }

  if (stream && response.body) {
    // Groq uses OpenAI SSE format — transform to our format
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(ctrl) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  const sseData = JSON.stringify({
                    type: "content_block_delta",
                    delta: { text: token },
                  });
                  ctrl.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                }
              } catch { /* skip */ }
            }
          }
        } finally {
          ctrl.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content ?? "Desculpe, erro na resposta.";

  return NextResponse.json({
    reply,
    provider: "groq",
    model: GROQ_MODEL,
  });
}

// ── Ollama (local, unlimited) ──
async function handleOllama(
  message: string,
  history?: { role: string; content: string }[],
  stream?: boolean,
  systemPrompt?: string,
) {
  const SYSTEM_PROMPT = systemPrompt!;
  const ollamaBase = OLLAMA_URL;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const healthCheck = await fetch(`${ollamaBase}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!healthCheck.ok) {
      throw new Error(`Ollama não está respondendo (status ${healthCheck.status})`);
    }

    const tagsData = await healthCheck.json();
    const models = tagsData.models?.map((m: { name: string }) => m.name) ?? [];

    if (models.length === 0) {
      throw new Error("Ollama sem modelos. Execute: ollama pull llama3.2");
    }

    const preferredModels = [OLLAMA_MODEL, "llama3.2", "llama3.1", "llama3", "mistral", "qwen2", "phi3"];
    let selectedModel = models[0];
    for (const preferred of preferredModels) {
      const found = models.find((m: string) => m.startsWith(preferred));
      if (found) { selectedModel = found; break; }
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(history ?? []).map((m) => ({
        role: m.role === "aurum" ? "assistant" : m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    if (stream) {
      const ollamaRes = await fetch(`${ollamaBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel, messages, stream: true }),
      });

      if (!ollamaRes.ok) throw new Error(`Ollama chat error: ${ollamaRes.status}`);

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(ctrl) {
          const reader = ollamaRes.body!.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              const lines = buf.split("\n");
              buf = lines.pop() ?? "";
              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const p = JSON.parse(line);
                  if (p.message?.content) {
                    ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content_block_delta", delta: { text: p.message.content } })}\n\n`));
                  }
                } catch { /* skip */ }
              }
            }
          } finally { ctrl.close(); }
        },
      });

      return new Response(readable, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      });
    }

    const ollamaRes = await fetch(`${ollamaBase}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: selectedModel, messages, stream: false }),
    });

    if (!ollamaRes.ok) throw new Error(`Ollama chat error: ${ollamaRes.status}`);

    const data = await ollamaRes.json();
    return NextResponse.json({ reply: data.message?.content ?? "Erro.", provider: "ollama", model: selectedModel });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Ollama não acessível (timeout). Execute: ollama serve");
    }
    throw err;
  }
}

// ── Anthropic (cloud) ──
async function handleAnthropic(
  apiKey: string,
  message: string,
  history?: { role: string; content: string }[],
  stream?: boolean,
  systemPrompt?: string,
) {
  const SYSTEM_PROMPT = systemPrompt!;
  const messages = [
    ...(history ?? []).map((m) => ({
      role: m.role === "aurum" ? "assistant" : m.role === "user" ? "user" : "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      system: SYSTEM_PROMPT,
      messages,
      max_tokens: 2048,
      stream: !!stream,
    }),
  });

  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);

  if (stream && response.body) {
    return new Response(response.body, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  }

  const data = await response.json();
  return NextResponse.json({ reply: data.content?.[0]?.text ?? "Erro.", provider: "anthropic", model: "claude-sonnet-4-20250514" });
}

// ── Gemini (cloud) ──
async function handleGemini(
  apiKey: string,
  message: string,
  history?: { role: string; content: string }[],
  systemPrompt?: string,
) {
  const SYSTEM_PROMPT = systemPrompt!;
  const contents = [
    ...(history ?? []).map((m) => ({
      role: m.role === "aurum" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    },
  );

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

  const data = await response.json();
  return NextResponse.json({ reply: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Erro.", provider: "gemini", model: "gemini-2.0-flash" });
}
