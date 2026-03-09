import { useState, useCallback, useRef, useEffect } from 'react';

export interface VoiceMetrics {
  sttLatency: number;
  llmLatency: number;
  ttsLatency: number;
  totalLatency: number;
  timestamp: Date;
}

export interface VoiceResult {
  transcript: string;
  response: string;
  audioResponse: Blob;
  metrics: VoiceMetrics;
  executor: 'claude' | 'manus';
}

export interface UseVoiceCoordinatorOptions {
  language?: string;
  maxLatency?: number;
  autoPlay?: boolean;
}

/**
 * Hook React para integrar Voice System + Coordinator Agent
 */
export function useVoiceCoordinator(options: UseVoiceCoordinatorOptions = {}) {
  const {
    language = 'pt-BR',
    maxLatency = 300,
    autoPlay = true,
  } = options;

  // Estados
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [metrics, setMetrics] = useState<VoiceMetrics | null>(null);
  const [executor, setExecutor] = useState<'claude' | 'manus'>('claude');
  const [error, setError] = useState<string | null>(null);
  const [claudeTokensRemaining, setClaudeTokensRemaining] = useState(100);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * Iniciar gravação de áudio
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setIsListening(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      console.log('[useVoiceCoordinator] 🎤 Gravação iniciada');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao iniciar gravação';
      setError(errorMsg);
      setIsListening(false);
      console.error('[useVoiceCoordinator] ❌ Erro:', err);
    }
  }, []);

  /**
   * Parar gravação
   */
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsListening(false);
        console.log('[useVoiceCoordinator] 🔇 Gravação parada');
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  /**
   * Processar entrada de voz completa
   */
  const processVoiceInput = useCallback(async (audioBlob: Blob): Promise<VoiceResult | null> => {
    try {
      setError(null);
      setIsProcessing(true);

      const startTime = Date.now();

      // Simular envio para Coordinator Agent
      const coordinatorResponse = await fetch('/api/coordinator/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: await blobToBase64(audioBlob),
          language,
        }),
      });

      if (!coordinatorResponse.ok) {
        throw new Error('Erro ao processar voz');
      }

      const data = await coordinatorResponse.json();

      const totalLatency = Date.now() - startTime;

      const result: VoiceResult = {
        transcript: data.transcript,
        response: data.response,
        audioResponse: data.audioResponse,
        metrics: {
          sttLatency: data.metrics.sttLatency,
          llmLatency: data.metrics.llmLatency,
          ttsLatency: data.metrics.ttsLatency,
          totalLatency,
          timestamp: new Date(),
        },
        executor: data.executor,
      };

      // Atualizar estados
      setTranscript(result.transcript);
      setResponse(result.response);
      setMetrics(result.metrics);
      setExecutor(result.executor);
      setClaudeTokensRemaining(data.claudeTokensRemaining);

      // Reproduzir áudio se habilitado
      if (autoPlay) {
        playAudio(result.audioResponse);
      }

      setIsProcessing(false);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao processar voz';
      setError(errorMsg);
      setIsProcessing(false);
      console.error('[useVoiceCoordinator] ❌ Erro:', err);
      return null;
    }
  }, [language, autoPlay]);

  /**
   * Fluxo completo: gravar → processar → reproduzir
   */
  const recordAndProcess = useCallback(async (durationMs: number = 5000) => {
    try {
      // Iniciar gravação
      await startRecording();

      // Aguardar duração
      await new Promise((resolve) => setTimeout(resolve, durationMs));

      // Parar gravação
      const audioBlob = await stopRecording();

      if (!audioBlob) {
        throw new Error('Falha ao gravar áudio');
      }

      // Processar
      return await processVoiceInput(audioBlob);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro no fluxo de voz';
      setError(errorMsg);
      console.error('[useVoiceCoordinator] ❌ Erro:', err);
      return null;
    }
  }, [startRecording, stopRecording, processVoiceInput]);

  /**
   * Reproduzir áudio
   */
  const playAudio = useCallback((audioBlob: Blob) => {
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => {
        console.error('[useVoiceCoordinator] ❌ Erro ao reproduzir:', err);
      });
    } catch (err) {
      console.error('[useVoiceCoordinator] ❌ Erro:', err);
    }
  }, []);

  /**
   * Converter Blob para Base64
   */
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  /**
   * Limpar recursos
   */
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return {
    // Estados
    isListening,
    isProcessing,
    transcript,
    response,
    metrics,
    executor,
    error,
    claudeTokensRemaining,

    // Funções
    startRecording,
    stopRecording,
    processVoiceInput,
    recordAndProcess,
    playAudio,
  };
}
