import { generateResponse } from './brains/index.js';

export interface VoiceConfig {
  language: string;
  sampleRate: number;
  maxLatency: number;
  enableStreaming: boolean;
  googleApiKey?: string;
}

export interface VoiceMetrics {
  sttLatency: number;
  llmLatency: number;
  ttsLatency: number;
  totalLatency: number;
  timestamp: Date;
}

/**
 * Sistema de Voz Completo para Aurum
 * - Speech-to-Text (Whisper)
 * - LLM Processing (Ollama/Gemini)
 * - Text-to-Speech (Google TTS)
 * - Latência <300ms
 */
export class VoiceSystem {
  private config: VoiceConfig;
  private metrics: VoiceMetrics[] = [];
  private isListening: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor(config: Partial<VoiceConfig> = {}) {
    this.config = {
      language: 'pt-BR',
      sampleRate: 16000,
      maxLatency: 300,
      enableStreaming: true,
      ...config,
    };
  }

  /**
   * Iniciar gravação de áudio
   */
  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.isListening = true;

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
      console.log('[VoiceSystem] 🎤 Gravação iniciada');
    } catch (error) {
      console.error('[VoiceSystem] ❌ Erro ao iniciar gravação:', error);
      throw error;
    }
  }

  /**
   * Parar gravação
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Gravação não iniciada'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.isListening = false;
        console.log('[VoiceSystem] 🔇 Gravação parada');
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Transcrever áudio com Whisper
   */
  async transcribeWithWhisper(audioBlob: Blob): Promise<string> {
    const startTime = Date.now();

    try {
      console.log('[VoiceSystem] 🎧 Transcrevendo com Whisper...');

      // Converter Blob para Base64
      const base64Audio = await this.blobToBase64(audioBlob);

      // Chamar Whisper API (via OpenAI)
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: this.createFormData(audioBlob),
      });

      if (!response.ok) {
        throw new Error(`Whisper error: ${response.statusText}`);
      }

      const data = await response.json();
      const transcript = data.text;
      const sttLatency = Date.now() - startTime;

      console.log(`[VoiceSystem] ✅ Transcrito: "${transcript}" (${sttLatency}ms)`);

      return transcript;
    } catch (error) {
      console.error('[VoiceSystem] ❌ Erro ao transcrever:', error);
      // Fallback: usar Web Speech API
      return await this.transcribeWithWebSpeech();
    }
  }

  /**
   * Fallback: Transcrever com Web Speech API
   */
  private async transcribeWithWebSpeech(): Promise<string> {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        reject(new Error('Web Speech API não suportada'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.language = this.config.language;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log(`[VoiceSystem] ✅ Web Speech: "${transcript}"`);
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        reject(new Error(`Web Speech error: ${event.error}`));
      };

      recognition.start();
    });
  }

  /**
   * Processar voz completa: STT → LLM → TTS
   */
  async processVoiceInput(audioBlob: Blob): Promise<{
    transcript: string;
    response: string;
    audioResponse: Blob;
    metrics: VoiceMetrics;
  }> {
    const totalStart = Date.now();

    try {
      // 1. STT (Speech-to-Text)
      const sttStart = Date.now();
      const transcript = await this.transcribeWithWhisper(audioBlob);
      const sttLatency = Date.now() - sttStart;

      // 2. LLM Processing
      const llmStart = Date.now();
      const response = await generateResponse(transcript);
      const llmLatency = Date.now() - llmStart;

      // 3. TTS (Text-to-Speech)
      const ttsStart = Date.now();
      const audioResponse = await this.synthesizeWithGoogle(response);
      const ttsLatency = Date.now() - ttsStart;

      const totalLatency = Date.now() - totalStart;

      // Registrar métricas
      const metrics: VoiceMetrics = {
        sttLatency,
        llmLatency,
        ttsLatency,
        totalLatency,
        timestamp: new Date(),
      };

      this.metrics.push(metrics);

      // Verificar se está dentro do limite
      if (totalLatency > this.config.maxLatency) {
        console.warn(
          `[VoiceSystem] ⚠️ Latência acima do limite: ${totalLatency}ms > ${this.config.maxLatency}ms`
        );
      } else {
        console.log(`[VoiceSystem] ✅ Latência OK: ${totalLatency}ms`);
      }

      return {
        transcript,
        response,
        audioResponse,
        metrics,
      };
    } catch (error) {
      console.error('[VoiceSystem] ❌ Erro ao processar voz:', error);
      throw error;
    }
  }

  /**
   * Sintetizar fala com Google TTS
   */
  async synthesizeWithGoogle(text: string): Promise<Blob> {
    try {
      console.log('[VoiceSystem] 🔊 Sintetizando com Google TTS...');

      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: this.config.language,
              name: `${this.config.language}-Neural2-C`,
            },
            audioConfig: {
              audioEncoding: 'MP3',
              pitch: 0,
              speakingRate: 1,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google TTS error: ${response.statusText}`);
      }

      const data = await response.json();
      const audioContent = data.audioContent;

      // Converter Base64 para Blob
      const binaryString = atob(audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
      console.log('[VoiceSystem] ✅ Áudio sintetizado');

      return audioBlob;
    } catch (error) {
      console.error('[VoiceSystem] ❌ Erro ao sintetizar:', error);
      // Fallback: usar Web Speech API
      return await this.synthesizeWithWebSpeech(text);
    }
  }

  /**
   * Fallback: Sintetizar com Web Speech API
   */
  private async synthesizeWithWebSpeech(text: string): Promise<Blob> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.config.language;
      utterance.rate = 1;
      utterance.pitch = 1;

      // Gravar o áudio enquanto fala
      const audioContext = new (window as any).AudioContext();
      const mediaStreamAudioDestination = audioContext.createMediaStreamAudioDestination();
      const mediaRecorder = new MediaRecorder(mediaStreamAudioDestination.stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
      };

      mediaRecorder.start();
      speechSynthesis.speak(utterance);

      utterance.onend = () => {
        mediaRecorder.stop();
      };
    });
  }

  /**
   * Reproduzir áudio
   */
  playAudio(audioBlob: Blob): void {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play().catch((error) => {
      console.error('[VoiceSystem] ❌ Erro ao reproduzir áudio:', error);
    });
  }

  /**
   * Obter métricas de latência
   */
  getMetrics(): {
    averageLatency: number;
    maxLatency: number;
    minLatency: number;
    totalCalls: number;
    withinLimit: number;
  } {
    if (this.metrics.length === 0) {
      return {
        averageLatency: 0,
        maxLatency: 0,
        minLatency: 0,
        totalCalls: 0,
        withinLimit: 0,
      };
    }

    const latencies = this.metrics.map((m) => m.totalLatency);
    const withinLimit = latencies.filter((l) => l <= this.config.maxLatency).length;

    return {
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      maxLatency: Math.max(...latencies),
      minLatency: Math.min(...latencies),
      totalCalls: this.metrics.length,
      withinLimit,
    };
  }

  /**
   * Converter Blob para Base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Criar FormData para Whisper
   */
  private createFormData(audioBlob: Blob): FormData {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', this.config.language.split('-')[0]); // 'pt'
    return formData;
  }

  /**
   * Obter status
   */
  getStatus(): {
    isListening: boolean;
    config: VoiceConfig;
    metrics: VoiceMetrics[];
  } {
    return {
      isListening: this.isListening,
      config: this.config,
      metrics: this.metrics,
    };
  }
}

/**
 * Integração com Aurum Orb
 */
export class AurumVoiceOrb {
  private voiceSystem: VoiceSystem;
  private orbState: {
    isActive: boolean;
    isListening: boolean;
    isProcessing: boolean;
  };

  constructor(voiceConfig?: Partial<VoiceConfig>) {
    this.voiceSystem = new VoiceSystem(voiceConfig);
    this.orbState = {
      isActive: false,
      isListening: false,
      isProcessing: false,
    };
  }

  /**
   * Ativar Orb com Voz
   */
  async activateVoiceOrb(): Promise<void> {
    this.orbState.isActive = true;
    console.log('[AurumVoiceOrb] 🔮 Orb de Voz ativada!');
    console.log('[AurumVoiceOrb] 👂 Escutando...');
  }

  /**
   * Processar entrada de voz
   */
  async processVoiceInput(): Promise<void> {
    if (!this.orbState.isActive) {
      console.log('[AurumVoiceOrb] ❌ Orb não está ativa');
      return;
    }

    try {
      this.orbState.isListening = true;

      // Iniciar gravação
      await this.voiceSystem.startRecording();

      // Aguardar 5 segundos ou até o usuário parar
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Parar gravação
      const audioBlob = await this.voiceSystem.stopRecording();
      this.orbState.isListening = false;
      this.orbState.isProcessing = true;

      // Processar voz
      const result = await this.voiceSystem.processVoiceInput(audioBlob);

      console.log(`[AurumVoiceOrb] 👤 Você: "${result.transcript}"`);
      console.log(`[AurumVoiceOrb] 🤖 Aurum: "${result.response.substring(0, 100)}..."`);
      console.log(`[AurumVoiceOrb] ⏱️ Latência: ${result.metrics.totalLatency}ms`);

      // Reproduzir resposta
      this.voiceSystem.playAudio(result.audioResponse);

      this.orbState.isProcessing = false;
      this.orbState.isListening = true;
    } catch (error) {
      console.error('[AurumVoiceOrb] ❌ Erro:', error);
      this.orbState.isProcessing = false;
      this.orbState.isListening = true;
    }
  }

  /**
   * Desativar Orb
   */
  deactivateVoiceOrb(): void {
    this.orbState.isActive = false;
    console.log('[AurumVoiceOrb] 🔮 Orb de Voz desativada');
  }

  /**
   * Obter status
   */
  getStatus() {
    return {
      orbState: this.orbState,
      voiceMetrics: this.voiceSystem.getMetrics(),
    };
  }
}
