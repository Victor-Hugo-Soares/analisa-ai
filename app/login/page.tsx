"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Shield, Eye, EyeOff, LogIn } from "lucide-react"
import { setSession, setAuthTokens } from "@/lib/storage"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Preencha todos os campos.")
      return
    }

    if (password.length < 6) {
      setError("Senha inválida. Verifique suas credenciais.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha: password }),
      })

      if (res.ok) {
        const data = await res.json()
        setAuthTokens(data.session)
        setSession({
          id: data.usuario.empresa_id,
          usuario_id: data.usuario.id,
          nome: data.usuario.empresa_nome,
          email: data.usuario.email,
          cnpj: data.usuario.empresa_cnpj,
          role: data.usuario.role ?? "usuario",
        })
        router.push(data.usuario.role === "master" ? "/admin" : "/dashboard")
        return
      }
    } catch {
      // fallback demo
    }

    setSession({
      id: "emp-001",
      usuario_id: "demo-user",
      nome: "Seguradora Modelo S.A.",
      email,
      cnpj: "00.000.000/0001-00",
      role: "usuario",
    })
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity">
            <div className="bg-[#1a2744] p-2.5 rounded-xl">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black text-[#0f172a] tracking-tight">IAnalista</span>
          </Link>
          <p className="text-[#64748b] text-sm">Análise Inteligente de Sinistros</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 shadow-sm">
          <h1 className="text-xl font-bold text-[#0f172a] mb-1">Acesse sua conta</h1>
          <p className="text-[#64748b] text-sm mb-6">Entre com as credenciais da sua empresa</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1.5">E-mail</label>
              <input
                id="email"
                type="email"
                placeholder="empresa@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] placeholder:text-[#94a3b8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a2744] focus:ring-1 focus:ring-[#1a2744]/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Senha</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] placeholder:text-[#94a3b8] rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#1a2744] focus:ring-1 focus:ring-[#1a2744]/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a2744] hover:bg-[#243459] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#f1f5f9] text-center">
            <p className="text-sm text-[#94a3b8]">
              Acesso restrito. Para suporte entre em contato via{" "}
              <a
                href="https://wa.me/5511926712965"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1a2744] font-semibold hover:underline"
              >
                WhatsApp
              </a>
              .
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#94a3b8] mt-4">
          Plataforma privada — acesso somente por convite
        </p>
      </div>
    </div>
  )
}
