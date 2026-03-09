'use client';

import React, { useState } from 'react';
import { useVoiceCoordinator } from '@/lib/hooks/useVoiceCoordinator';

interface VoiceButtonProps {
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  className?: string;
}

/**
 * Componente VoiceButton - Interface de Voz com Coordinator
 */
export function VoiceButton({ onTranscript, onResponse, className = '' }: VoiceButtonProps) {
  const {
    isListening,
    isProcessing,
    transcript,
    response,
    metrics,
    executor,
    error,
    claudeTokensRemaining,
    recordAndProcess,
  } = useVoiceCoordinator({
    language: 'pt-BR',
    maxLatency: 300,
    autoPlay: true,
  });

  const [isRecording, setIsRecording] = useState(false);

  const handleClick = async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    const result = await recordAndProcess(5000); // 5 segundos
    setIsRecording(false);

    if (result) {
      onTranscript?.(result.transcript);
      onResponse?.(result.response);
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Botão Principal */}
      <button
        onClick={handleClick}
        disabled={isProcessing}
        className={`
          relative w-24 h-24 rounded-full flex items-center justify-center
          transition-all duration-300 transform
          ${isRecording || isListening
            ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50'
            : isProcessing
            ? 'bg-yellow-500 scale-105 shadow-lg shadow-yellow-500/50'
            : 'bg-cyan-500 hover:scale-105 shadow-lg shadow-cyan-500/50'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <div className="flex flex-col items-center gap-1">
          {isRecording ? (
            <>
              <span className="text-2xl">🎤</span>
              <span className="text-xs text-white font-bold">Gravando</span>
            </>
          ) : isProcessing ? (
            <>
              <span className="text-2xl animate-spin">⚙️</span>
              <span className="text-xs text-white font-bold">Processando</span>
            </>
          ) : (
            <>
              <span className="text-2xl">🎤</span>
              <span className="text-xs text-white font-bold">Falar</span>
            </>
          )}
        </div>

        {/* Animação de ondas */}
        {(isRecording || isListening) && (
          <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-pulse" />
        )}
      </button>

      {/* Status */}
      <div className="text-sm text-gray-400 text-center">
        {isRecording && 'Escutando...'}
        {isProcessing && 'Processando...'}
        {!isRecording && !isProcessing && 'Pronto'}
      </div>

      {/* Métricas */}
      {metrics && (
        <div className="bg-gray-800 rounded-lg p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span>STT:</span>
            <span className="text-cyan-400">{metrics.sttLatency}ms</span>
          </div>
          <div className="flex justify-between">
            <span>LLM:</span>
            <span className="text-cyan-400">{metrics.llmLatency}ms</span>
          </div>
          <div className="flex justify-between">
            <span>TTS:</span>
            <span className="text-cyan-400">{metrics.ttsLatency}ms</span>
          </div>
          <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
            <span>Total:</span>
            <span className={metrics.totalLatency <= 300 ? 'text-green-400' : 'text-red-400'}>
              {metrics.totalLatency}ms
            </span>
          </div>
        </div>
      )}

      {/* Executor Info */}
      {executor && (
        <div className="bg-gray-800 rounded-lg p-2 text-xs text-center">
          <div className="flex items-center justify-center gap-2">
            <span>{executor === 'claude' ? '🔵' : '🤖'}</span>
            <span>{executor === 'claude' ? 'Claude Code' : 'Manus'}</span>
            {executor === 'claude' && (
              <span className="text-gray-400">({claudeTokensRemaining} tokens)</span>
            )}
          </div>
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Você disse:</div>
          <div className="text-sm text-white">{transcript}</div>
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Aurum respondeu:</div>
          <div className="text-sm text-white line-clamp-3">{response}</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900 rounded-lg p-3">
          <div className="text-xs text-red-400">Erro:</div>
          <div className="text-sm text-red-200">{error}</div>
        </div>
      )}
    </div>
  );
}

export default VoiceButton;
