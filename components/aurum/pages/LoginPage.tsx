"use client";

import { useState } from "react";

interface Props {
  onSignInGoogle: () => void;
  onSignInEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  onSignUpEmail: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  onNavigatePricing?: () => void;
  onBack?: () => void;
}

export default function LoginPage({
  onSignInGoogle,
  onSignInEmail,
  onSignUpEmail,
  onNavigatePricing,
  onBack,
}: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!validateEmail(email)) {
        setError("Por favor, insira um email valido");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres");
        setLoading(false);
        return;
      }

      if (mode === "login") {
        const result = await onSignInEmail(email, password);
        if (result.error) setError(result.error);
      } else {
        if (!name.trim()) {
          setError("Por favor, insira seu nome");
          setLoading(false);
          return;
        }
        const result = await onSignUpEmail(email, password, name);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess("Conta criada! Verifique seu email para confirmar o cadastro.");
          setEmail("");
          setPassword("");
          setName("");
        }
      }
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0A09] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-amber-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-orange-500/[0.04] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Voltar
          </button>
        )}

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-2xl font-bold mb-4">
            A
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Aurum</h1>
          <p className="text-white/40 text-sm">Seu assistente pessoal com IA</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8">
          {/* Google Button — FIRST, most prominent */}
          <button
            onClick={onSignInGoogle}
            className="w-full py-3.5 px-4 rounded-xl bg-white text-gray-800 font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-3 mb-6 shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/30">ou use email</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-1 mb-6 p-1 rounded-lg bg-white/[0.03] border border-white/5">
            <button
              onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === "login"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === "signup"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Success */}
          {success && (
            <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
              {success}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/20 transition-all focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-white/50 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/20 transition-all focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm text-white/50">Senha</label>
                {mode === "login" && (
                  <button type="button" className="text-xs text-amber-400/70 hover:text-amber-400 transition">
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/20 transition-all focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20 pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 hover:text-white/50 transition"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:from-amber-400 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processando..." : mode === "login" ? "Entrar" : "Criar Conta"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-[11px] text-white/20 px-4 leading-relaxed">
            Ao continuar, voce concorda com os{" "}
            <button className="text-amber-400/50 hover:text-amber-400/70 transition">Termos de Uso</button>
            {" "}e{" "}
            <button className="text-amber-400/50 hover:text-amber-400/70 transition">Privacidade</button>
          </p>
          {onNavigatePricing && (
            <button
              onClick={onNavigatePricing}
              className="text-xs text-white/30 hover:text-amber-400/70 transition"
            >
              Ver planos disponiveis →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
