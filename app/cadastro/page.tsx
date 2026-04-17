"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Shield, Building2 } from "lucide-react"
import { setSession } from "@/lib/storage"

export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    empresa: "",
    cnpj: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }

    if (form.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.empresa,
          cnpj: form.cnpj,
          email: form.email,
          senha: form.password,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Erro ao criar conta. Tente novamente.")
        setLoading(false)
        return
      }
    } catch {
      // fallback demo
    }

    setSession({
      id: "emp-" + Date.now(),
      usuario_id: "demo-user",
      nome: form.empresa,
      email: form.email,
      cnpj: form.cnpj,
      role: "usuario",
    })

    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity">
            <div className="bg-amber-500 p-2.5 rounded-xl shadow-sm">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">IAnalista</span>
          </Link>
          <p className="text-slate-500 text-sm">Análise Inteligente de Eventos</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Cadastrar empresa</h1>
          <p className="text-slate-500 text-sm mb-6">Crie sua conta e comece a analisar eventos</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome da empresa</label>
              <input
                name="empresa"
                placeholder="Associadora Exemplo S.A."
                value={form.empresa}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">CNPJ</label>
              <input
                name="cnpj"
                placeholder="00.000.000/0001-00"
                value={form.cnpj}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail corporativo</label>
              <input
                name="email"
                type="email"
                placeholder="contato@empresa.com"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Mín. 6 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar</label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Repita a senha"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  required
                />
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
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  Criar conta
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-amber-600 font-semibold hover:text-amber-500 transition-colors">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
