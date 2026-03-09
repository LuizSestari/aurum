# 🤖 Aurum - Assistente de IA com Voz Real

Assistente de IA conversacional completo com:
- ✅ **Voz Real** (<300ms latência)
- ✅ **Coordinator Agent** (Claude Code + Manus)
- ✅ **25+ Skills Integradas**
- ✅ **Sistema de Novidades em Tempo Real**
- ✅ **n8n Automações**
- ✅ **Obsidian Integration**
- ✅ **Orb Conversacional Visual**

## 🚀 Quick Start

### Instalação

```bash
git clone https://github.com/LuizSestari/aurum.git
cd aurum
npm install
npm run dev
```

## 📋 Componentes Principais

### 1. Coordinator Agent
- Gerencia tarefas entre Claude Code e Manus
- Auto fallback quando Claude atingir limite

### 2. Voice System
- Speech-to-Text (Whisper + Web Speech API)
- LLM Processing (Ollama + Gemini)
- Text-to-Speech (Google TTS)
- Latência <300ms

### 3. Skills System
- 25+ skills integradas
- GitHub skills loader
- Everything Claude Code integration

### 4. Interface
- VoiceButton (botão de voz)
- VoicePage (página de voz)
- NewsPage (novidades)

## 📁 Estrutura

```
aurum/
├── app/api/coordinator/process/route.ts
├── components/aurum/
│   ├── VoiceButton.tsx
│   └── pages/
│       ├── VoicePage.tsx
│       └── NewsPage.tsx
├── lib/
│   ├── coordinator-agent.ts
│   ├── voice-system.ts
│   ├── updates-system.ts
│   └── skills/
└── test-*.mjs
```

## 🧪 Testes

```bash
node test-voice-system.mjs
node test-coordinator.mjs
```

## 📊 Performance

- STT: 20-100ms
- LLM: 30-150ms
- TTS: 20-100ms
- **Total: <300ms ✅**

## 🛠️ Tech Stack

- React 19 + Next.js 16
- Tailwind CSS 4
- Ollama + Gemini
- Supabase + OAuth
- n8n + Obsidian

🚀 **Feito com ❤️ por Manus + Claude Code**
