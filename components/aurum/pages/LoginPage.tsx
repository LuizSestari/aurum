"use client";

import { useState } from "react";

interface Props {
  onSignInGoogle: () => void;
  onSignInEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  onSignUpEmail: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  onNavigatePricing?: () => void;
}

export default function LoginPage({
  onSignInGoogle,
  onSignInEmail,
  onSignUpEmail,
  onNavigatePricing,
}: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!validateEmail(email)) {
        setError("Por favor, insira um email válido");
        setLoading(false);
        return;
      }

      if (!validatePassword(password)) {
        setError("A senha deve ter pelo menos 6 caracteres");
        setLoading(false);
        return;
      }

      if (mode === "login") {
        const result = await onSignInEmail(email, password);
        if (result.error) {
          setError(result.error);
        }
      } else {
        if (!name.trim()) {
          setError("Por favor, insira seu nome");
          setLoading(false);
          return;
        }
        const result = await onSignUpEmail(email, password, name);
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070A0F] via-[#0a0d15] to-[#070A0F] relative overflow-hidden flex items-center justify-center p-4">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(0, 255, 255, 0.6);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .aurora-gradient {
          background: linear-gradient(-45deg, rgba(0, 255, 255, 0.1), rgba(100, 50, 255, 0.1), rgba(0, 255, 255, 0.1));
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .gradient-border {
          position: relative;
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(100, 50, 255, 0.1));
          border: 1px solid;
          border-image: linear-gradient(135deg, #00ffff, #6432ff) 1;
        }

        .glass-effect {
          background: rgba(7, 10, 15, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 255, 255, 0.2);
        }

        input:focus {
          outline: none;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        }
      `}</style>

      {/* Animated background orbs */}
      <div className="glow-orb" style={{ width: "400px", height: "400px", top: "-100px", left: "-100px", background: "rgba(0, 255, 255, 0.3)" }} />
      <div className="glow-orb" style={{ width: "300px", height: "300px", bottom: "-50px", right: "-50px", background: "rgba(100, 50, 255, 0.3)" }} />

      {/* Main container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Aurum Branding */}
        <div className="text-center mb-12 animate-fadeInUp" style={{ animationDelay: "0ms" }}>
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24 flex items-center justify-center animate-float">
              <div className="absolute inset-0 animate-glow" style={{
                background: "radial-gradient(circle, rgba(0, 255, 255, 0.4), transparent)",
                borderRadius: "50%",
              }} />
              <div className="text-6xl font-bold bg-gradient-to-b from-[#00ffff] to-[#6432ff] bg-clip-text text-transparent"
                style={{ textShadow: "0 0 30px rgba(0, 255, 255, 0.4)" }}>
                A
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Aurum</h1>
          <p className="text-cyan-300/80 text-sm">Seu assistente de voz com IA</p>
        </div>

        {/* Main Card */}
        <div className="glass-effect rounded-2xl p-8 shadow-2xl animate-fadeInUp" style={{ animationDelay: "100ms" }}>
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-8 p-1 bg-black/20 rounded-lg">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                mode === "login"
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                mode === "signup"
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm animate-fadeInUp">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Signup only) */}
            {mode === "signup" && (
              <div className="animate-fadeInUp" style={{ animationDelay: "50ms" }}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="João Silva"
                  className="w-full px-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder:text-gray-500 transition-all hover:border-cyan-400/50"
                />
              </div>
            )}

            {/* Email Field */}
            <div className="animate-fadeInUp" style={{ animationDelay: "100ms" }}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="você@exemplo.com"
                className="w-full px-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder:text-gray-500 transition-all hover:border-cyan-400/50"
              />
            </div>

            {/* Password Field */}
            <div className="animate-fadeInUp" style={{ animationDelay: "150ms" }}>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Senha
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {}}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder:text-gray-500 transition-all hover:border-cyan-400/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {mode === "signup" && (
                <p className="text-xs text-gray-400 mt-2">
                  Mínimo 6 caracteres, recomendamos incluir letras, números e símbolos.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-6 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/50"
            >
              {loading ? "Processando..." : mode === "login" ? "Entrar" : "Criar Conta"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
            <span className="text-xs text-gray-500">ou</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={onSignInGoogle}
            className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>
        </div>

        {/* Terms and Pricing */}
        <div className="mt-8 text-center space-y-4 animate-fadeInUp" style={{ animationDelay: "250ms" }}>
          <p className="text-xs text-gray-400 px-4 leading-relaxed">
            Ao criar uma conta, você concorda com os{" "}
            <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Termos de Uso
            </button>{" "}
            e{" "}
            <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Política de Privacidade
            </button>{" "}
            do Aurum.
          </p>

          {/* Plan Badge */}
          <div className="inline-block px-6 py-3 glass-effect rounded-full border border-cyan-400/30 text-sm">
            <p className="text-gray-300 mb-1">Comece grátis</p>
            <button
              onClick={onNavigatePricing}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              Ver planos disponíveis →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
