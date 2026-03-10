import { NextRequest, NextResponse } from "next/server";

/**
 * Speech-to-Text API route
 * Proxies audio to a local Whisper server for transcription.
 *
 * POST /api/stt
 * Body: FormData with "audio" file
 * Returns: { text: string, language: string, duration: number }
 *
 * Requires a local Whisper server running on WHISPER_URL (default: http://localhost:9000)
 * You can start one with: pip install faster-whisper && python -m faster_whisper.server
 * Or use: https://github.com/fedirz/faster-whisper-server
 */
export async function POST(request: NextRequest) {
  const whisperUrl = process.env.WHISPER_URL ?? "http://localhost:9000";

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Forward to Whisper server
    const whisperForm = new FormData();
    whisperForm.append("file", audioFile);
    whisperForm.append("language", "pt");
    whisperForm.append("response_format", "json");

    const response = await fetch(`${whisperUrl}/v1/audio/transcriptions`, {
      method: "POST",
      body: whisperForm,
    });

    if (!response.ok) {
      // Whisper server not available — fall back gracefully
      return NextResponse.json(
        { error: "Whisper server not available. Using browser STT instead.", fallback: true },
        { status: 503 }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      text: result.text ?? "",
      language: result.language ?? "pt",
      duration: result.duration ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "STT processing failed", fallback: true },
      { status: 500 }
    );
  }
}
