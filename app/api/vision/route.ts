import { NextRequest, NextResponse } from "next/server";

const TODAY = new Date().toISOString().split("T")[0];

const VISION_SYSTEM = `Você é Aurum, assistente pessoal de elite estilo JARVIS. Analise imagens com precisão e objetividade.
Hoje é ${TODAY}. Usuário: Luiz.

REGRAS:
- Descreva o que vê de forma clara e útil
- Se a imagem contém texto (documento, recibo, nota), extraia TODO o texto
- Se é um recibo/nota fiscal, extraia valores e crie transação automaticamente
- Se é uma lista de tarefas, crie as tarefas automaticamente
- Respostas em português brasileiro, tom confiante
- Use blocos :::action quando apropriado (mesmo formato do chat)

Formatos de ação disponíveis:
:::action
{"type":"add_task","data":{"title":"...","priority":"média","description":"...","tags":[],"dueDate":"${TODAY}"}}
:::

:::action
{"type":"add_transaction","data":{"title":"...","amount":0,"type":"despesa","category":"Outros","date":"${TODAY}"}}
:::`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File | null;
    const message = (formData.get("message") as string) || "O que você vê nesta imagem?";

    if (!image) {
      return NextResponse.json({ error: "Imagem é obrigatória" }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = image.type || "image/jpeg";

    const errors: string[] = [];

    // 1. Try Gemini 2.0 Flash (FREE multimodal)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: message },
                  { inline_data: { mime_type: mimeType, data: base64 } },
                ],
              }],
              systemInstruction: { parts: [{ text: VISION_SYSTEM }] },
              generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Não consegui analisar a imagem.";
          return NextResponse.json({ reply, provider: "gemini-vision", model: "gemini-2.0-flash" });
        }
        errors.push(`Gemini: ${response.status}`);
      } catch (e) {
        errors.push(`Gemini: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 2. Try OpenAI GPT-4o-mini (cheap vision)
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: VISION_SYSTEM },
              {
                role: "user",
                content: [
                  { type: "text", text: message },
                  { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
                ],
              },
            ],
            max_tokens: 4096,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content ?? "Não consegui analisar.";
          return NextResponse.json({ reply, provider: "openai-vision", model: "gpt-4o-mini" });
        }
        errors.push(`OpenAI: ${response.status}`);
      } catch (e) {
        errors.push(`OpenAI: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 3. Try Groq vision (llama-3.2-90b-vision)
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.2-90b-vision-preview",
            messages: [
              { role: "system", content: VISION_SYSTEM },
              {
                role: "user",
                content: [
                  { type: "text", text: message },
                  { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
                ],
              },
            ],
            max_tokens: 4096,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content ?? "Não consegui analisar.";
          return NextResponse.json({ reply, provider: "groq-vision", model: "llama-3.2-90b-vision" });
        }
        errors.push(`Groq Vision: ${response.status}`);
      } catch (e) {
        errors.push(`Groq Vision: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return NextResponse.json(
      { error: `Nenhum provedor de visão disponível.\n${errors.join("\n")}` },
      { status: 500 }
    );
  } catch (err) {
    console.error("[API /vision] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
