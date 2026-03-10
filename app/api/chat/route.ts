import { NextRequest, NextResponse } from "next/server";
import { chatLimiter } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `Você é Aurum, um assistente de IA pessoal avançado e inteligente. Você fala português brasileiro naturalmente.

Personalidade:
- Direto e eficiente, sem enrolação
- Amigável mas profissional
- Proativo em sugerir melhorias
- Capaz de lidar com tarefas complexas
- Usa markdown quando útil (negrito, listas, código)
- Lembra do contexto da conversa e mantém continuidade

Capacidades:
- Responde perguntas sobre qualquer assunto com profundidade
- Ajuda com código, escrita, análises
- Gerencia tarefas, lembretes e projetos
- Dá conselhos práticos e personalizados
- Raciocina sobre problemas complexos

Contexto: Você roda na plataforma Aurum, um assistente premium com voz, visão e gestão de vida. O usuário se chama Luiz.

AÇÕES ESPECIAIS - Quando o usuário pedir para criar, adicionar, modificar ou deletar itens (tarefas, hábitos, projetos, lembretes, transações), você DEVE incluir um bloco JSON de ação no final da sua resposta, usando este formato exato:

:::action
{"type": "add_task", "data": {"title": "Estudar", "priority": "média", "description": "Estudar para a prova", "tags": [], "dueDate": "2026-03-15"}}
:::

:::action
{"type": "add_habit", "data": {"name": "Meditar", "icon": "🧘", "frequency": "diário", "color": "#00d9ff"}}
:::

:::action
{"type": "add_reminder", "data": {"title": "Lembrete", "description": "Descrição", "dateTime": "2026-03-15T10:00:00Z", "priority": "média", "recurring": "nunca"}}
:::

:::action
{"type": "add_transaction", "data": {"title": "Descrição", "amount": 100, "type": "receita", "category": "Salário", "date": "2026-03-15"}}
:::

:::action
{"type": "add_project", "data": {"title": "Projeto", "description": "Descrição", "status": "planejamento", "color": "#00d9ff", "dueDate": null}}
:::

:::action
{"type": "complete_task", "data": {"title": "Título parcial para buscar"}}
:::

:::action
{"type": "delete_task", "data": {"title": "Título parcial para buscar"}}
:::

Tipos de ação disponíveis: add_task, add_habit, add_project, add_reminder, add_transaction, complete_task, delete_task

Regras importantes:
- Sempre responda naturalmente ANTES do bloco de ação
- O bloco de ação é processado automaticamente pelo sistema
- Se o usuário não pedir para criar/modificar nada, NÃO inclua blocos de ação
- Use datas no formato ISO (YYYY-MM-DD)
- Duedate/dateTime podem ser null se não especificados
- Inclua dados realistas baseados no contexto da conversa`;

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

    // Priority: Groq (free cloud, 70B smart) → Ollama (local) → Anthropic → Gemini
    const errors: string[] = [];

    // 1. Try Groq first (free, cloud, llama-3.3-70b = muito inteligente)
    if (GROQ_API_KEY) {
      try {
        return await handleGroq(GROQ_API_KEY, message, history, stream);
      } catch (groqErr) {
        const msg = groqErr instanceof Error ? groqErr.message : String(groqErr);
        console.warn("[API /chat] Groq failed:", msg);
        errors.push(`Groq: ${msg}`);
      }
    }

    // 2. Try Ollama (free, local, unlimited)
    try {
      return await handleOllama(message, history, stream);
    } catch (ollamaErr) {
      const msg = ollamaErr instanceof Error ? ollamaErr.message : String(ollamaErr);
      console.warn("[API /chat] Ollama failed:", msg);
      errors.push(`Ollama: ${msg}`);
    }

    // 3. Try Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      try {
        return await handleAnthropic(anthropicKey, message, history, stream);
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
        return await handleGemini(geminiKey, message, history);
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
) {
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
) {
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
) {
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
) {
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
