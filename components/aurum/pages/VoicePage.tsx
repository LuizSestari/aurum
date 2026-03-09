'use client';

import React, { useState } from 'react';
import { VoiceButton } from '../VoiceButton';

interface ConversationEntry {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metrics?: {
    sttLatency: number;
    llmLatency: number;
    ttsLatency: number;
    totalLatency: number;
  };
  executor?: 'claude' | 'manus';
}

/**
 * VoicePage - Interface de Voz Completa com Coordinator
 */
export function VoicePage() {
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [claudeTokensRemaining, setClaudeTokensRemaining] = useState(100);

  const handleTranscript = (text: string) => {
    setConversation((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        type: 'user',
        content: text,
        timestamp: new Date(),
      },
    ]);
  };

  const handleResponse = (text: string) => {
    setConversation((prev) => [
      ...prev,
      {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: text,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-600 mb-2">
            🎤 Aurum Voice
          </h1>
          <p className="text-gray-400">Assistente de IA com Voz Real e Coordinator Agent</p>
        </div>

        {/* Main Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Voice Button - Left */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700">
              <VoiceButton
                onTranscript={handleTranscript}
                onResponse={handleResponse}
              />

              {/* Status Info */}
              <div className="mt-6 space-y-3 text-xs">
                <div className="bg-gray-900 rounded p-3">
                  <div className="text-gray-400 mb-1">Claude Tokens</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          claudeTokensRemaining > 50
                            ? 'bg-green-500'
                            : claudeTokensRemaining > 20
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{
                          width: `${claudeTokensRemaining}%`,
                        }}
                      />
                    </div>
                    <span className="text-cyan-400 font-bold">
                      {claudeTokensRemaining}%
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 rounded p-3">
                  <div className="text-gray-400 mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-cyan-400">Pronto</span>
                  </div>
                </div>

                <div className="bg-gray-900 rounded p-3">
                  <div className="text-gray-400 mb-1">Modo</div>
                  <span className="text-cyan-400">
                    {claudeTokensRemaining > 0 ? '🔵 Claude Code' : '🤖 Manus'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Conversation - Right */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur rounded-lg border border-gray-700 h-[600px] flex flex-col">
              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {conversation.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">🎤</div>
                      <p>Clique no botão e comece a falar!</p>
                    </div>
                  </div>
                ) : (
                  conversation.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex ${
                        entry.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          entry.type === 'user'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-gray-700 text-gray-100'
                        }`}
                      >
                        <p className="text-sm">{entry.content}</p>
                        {entry.metrics && (
                          <div className="text-xs mt-2 opacity-70">
                            ⏱️ {entry.metrics.totalLatency}ms
                            {entry.executor && ` • ${entry.executor === 'claude' ? '🔵' : '🤖'}`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Info Footer */}
              <div className="border-t border-gray-700 p-4 bg-gray-900/50">
                <div className="text-xs text-gray-400 space-y-1">
                  <div>💡 Dica: Fale claramente e aguarde o processamento</div>
                  <div>⚡ Latência alvo: &lt;300ms</div>
                  <div>🔄 Quando Claude atingir limite, Manus toma as rédeas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-700">
            <div className="text-2xl mb-2">🎤</div>
            <h3 className="font-semibold text-cyan-400 mb-1">Speech-to-Text</h3>
            <p className="text-sm text-gray-400">Transcrição com Whisper + Web Speech API</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-700">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="font-semibold text-cyan-400 mb-1">Coordinator Agent</h3>
            <p className="text-sm text-gray-400">Gerencia Claude Code + Manus automaticamente</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-700">
            <div className="text-2xl mb-2">🔊</div>
            <h3 className="font-semibold text-cyan-400 mb-1">Text-to-Speech</h3>
            <p className="text-sm text-gray-400">Síntese com Google TTS + Web Speech API</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoicePage;
