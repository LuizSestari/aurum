'use client';

import React, { useState, useEffect } from 'react';

interface Update {
  id: string;
  type: 'feature' | 'improvement' | 'fix' | 'integration' | 'skill' | 'warning' | 'info';
  title: string;
  description: string;
  details?: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  category: string;
  relatedFeatures?: string[];
}

interface Suggestion {
  id: string;
  type: 'optimization' | 'feature-request' | 'improvement' | 'workflow';
  title: string;
  description: string;
  reason: string;
  impact: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  timestamp: Date;
  read: boolean;
  category: string;
}

/**
 * NewsPage - Novidades e Sugestões do Aurum
 */
export function NewsPage() {
  const [activeTab, setActiveTab] = useState<'updates' | 'suggestions'>('updates');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [updates, setUpdates] = useState<Update[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [unreadCount, setUnreadCount] = useState({ updates: 0, suggestions: 0 });

  // Simular dados
  useEffect(() => {
    const mockUpdates: Update[] = [
      {
        id: '1',
        type: 'integration',
        title: '🤝 Coordinator Agent Ativado',
        description: 'Sistema de coordenação entre Manus e Claude Code está funcionando',
        details: 'O Coordinator Agent agora gerencia automaticamente tarefas entre Claude Code e Manus.',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        priority: 'high',
        read: false,
        category: 'Integração',
        relatedFeatures: ['Claude Code', 'Manus', 'Auto Fallback'],
      },
      {
        id: '2',
        type: 'feature',
        title: '🎤 Sistema de Voz Completo',
        description: 'Voz real com latência <300ms implementada',
        details: 'Speech-to-Text (Whisper), LLM Processing (Ollama), Text-to-Speech (Google TTS).',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        priority: 'high',
        read: false,
        category: 'Voz',
        relatedFeatures: ['VoiceButton', 'useVoiceCoordinator'],
      },
      {
        id: '3',
        type: 'skill',
        title: '📦 25+ Skills Integradas',
        description: 'Todas as skills estão disponíveis e funcionando',
        details: '3 Skills Nativas + 7 Skills GitHub + 68.8k⭐ Everything Claude Code Skills.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        priority: 'high',
        read: true,
        category: 'Skills',
        relatedFeatures: ['Skill Manager', 'GitHub Skills'],
      },
      {
        id: '4',
        type: 'improvement',
        title: '✅ Todas as Abas Corrigidas',
        description: '15 abas funcionais em 6 páginas',
        details: 'VisionPage, TasksPage, HabitsPage, ProjectsPage, FinancePage, KnowledgePage.',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        priority: 'medium',
        read: true,
        category: 'Interface',
      },
      {
        id: '5',
        type: 'integration',
        title: '⚙️ n8n Integrado e Funcionando',
        description: 'Automações com n8n estão prontas',
        details: 'n8n-mcp configurado no Claude Desktop.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        priority: 'high',
        read: true,
        category: 'Automação',
      },
    ];

    const mockSuggestions: Suggestion[] = [
      {
        id: 's1',
        type: 'optimization',
        title: '💡 Otimizar Cache de Skills',
        description: 'Implementar cache para skills frequentes',
        reason: 'Reduzir tempo de resposta para skills usadas repetidamente',
        impact: 'medium',
        difficulty: 'easy',
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        read: false,
        category: 'Performance',
      },
      {
        id: 's2',
        type: 'feature-request',
        title: '🎨 Temas Personalizáveis',
        description: 'Permitir usuário escolher tema (claro/escuro/customizado)',
        reason: 'Melhorar experiência do usuário e acessibilidade',
        impact: 'low',
        difficulty: 'medium',
        timestamp: new Date(Date.now() - 1000 * 60 * 20),
        read: false,
        category: 'Interface',
      },
      {
        id: 's3',
        type: 'improvement',
        title: '📊 Dashboard de Análise',
        description: 'Criar dashboard com estatísticas de uso',
        reason: 'Entender padrões de uso e otimizar features',
        impact: 'high',
        difficulty: 'hard',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        read: true,
        category: 'Analytics',
      },
    ];

    setUpdates(mockUpdates);
    setSuggestions(mockSuggestions);
    setUnreadCount({
      updates: mockUpdates.filter((u) => !u.read).length,
      suggestions: mockSuggestions.filter((s) => !s.read).length,
    });
  }, []);

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      feature: '✨',
      improvement: '📈',
      fix: '🐛',
      integration: '🔗',
      skill: '🎯',
      warning: '⚠️',
      info: 'ℹ️',
      optimization: '⚡',
      'feature-request': '💡',
      workflow: '🔄',
    };
    return icons[type] || '📌';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'text-red-400 bg-red-900/20',
      high: 'text-orange-400 bg-orange-900/20',
      medium: 'text-yellow-400 bg-yellow-900/20',
      low: 'text-green-400 bg-green-900/20',
    };
    return colors[priority] || 'text-gray-400 bg-gray-900/20';
  };

  const getImpactColor = (impact: string) => {
    const colors: Record<string, string> = {
      high: 'text-red-400',
      medium: 'text-yellow-400',
      low: 'text-green-400',
    };
    return colors[impact] || 'text-gray-400';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      hard: 'text-red-400',
      medium: 'text-yellow-400',
      easy: 'text-green-400',
    };
    return colors[difficulty] || 'text-gray-400';
  };

  const currentItems = activeTab === 'updates' ? updates : suggestions;
  const filteredItems =
    selectedCategory === 'all'
      ? currentItems
      : currentItems.filter((item) => item.category === selectedCategory);

  const categories = [
    ...new Set(
      activeTab === 'updates'
        ? updates.map((u) => u.category)
        : suggestions.map((s) => s.category)
    ),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-600 mb-2">
            📰 Novidades e Sugestões
          </h1>
          <p className="text-gray-400">Fique atualizado com as últimas atualizações do Aurum</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('updates')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'updates'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            📢 Atualizações {unreadCount.updates > 0 && `(${unreadCount.updates})`}
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'suggestions'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            💡 Sugestões {unreadCount.suggestions > 0 && `(${unreadCount.suggestions})`}
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              selectedCategory === 'all'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <p>Nenhum item nesta categoria</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-gray-800/50 backdrop-blur rounded-lg p-6 border ${
                  item.read ? 'border-gray-700' : 'border-cyan-500/50'
                } hover:border-cyan-400 transition-colors`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl">{getTypeIcon(item.type)}</div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      {'priority' in item && (
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(item.priority)}`}>
                          {item.priority.toUpperCase()}
                        </span>
                      )}
                      {'impact' in item && (
                        <span className={`text-xs px-2 py-1 rounded ${getImpactColor(item.impact)}`}>
                          Impacto: {item.impact}
                        </span>
                      )}
                      {'difficulty' in item && (
                        <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(item.difficulty)}`}>
                          {item.difficulty}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-300 mb-2">{item.description}</p>

                    {'details' in item && (item as Update).details && (
                      <p className="text-sm text-gray-400 mb-3">{(item as Update).details}</p>
                    )}

                    {'reason' in item && (
                      <p className="text-sm text-gray-400 mb-3">
                        <span className="text-cyan-400">Motivo:</span> {item.reason}
                      </p>
                    )}

                    {/* Related Features */}
                    {'relatedFeatures' in item && item.relatedFeatures && (
                      <div className="flex gap-2 flex-wrap">
                        {item.relatedFeatures.map((feature) => (
                          <span
                            key={feature}
                            className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500 text-right">
                    {new Date(item.timestamp).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats Footer */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-700">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-gray-400 text-sm">Total de Atualizações</div>
            <div className="text-2xl font-bold text-cyan-400">{updates.length}</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-700">
            <div className="text-2xl mb-2">💡</div>
            <div className="text-gray-400 text-sm">Total de Sugestões</div>
            <div className="text-2xl font-bold text-cyan-400">{suggestions.length}</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-700">
            <div className="text-2xl mb-2">✨</div>
            <div className="text-gray-400 text-sm">Não Lidas</div>
            <div className="text-2xl font-bold text-cyan-400">
              {unreadCount.updates + unreadCount.suggestions}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsPage;
