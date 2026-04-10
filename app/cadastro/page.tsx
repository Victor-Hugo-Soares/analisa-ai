"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Shield, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
      // Registra empresa e usuário no Supabase
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
      // Supabase indisponível — segue com sessão local demo
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
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#1a2744] p-2.5 rounded-xl">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1a2744] tracking-tight">
              Analisa Aí
            </span>
          </div>
          <p className="text-sm text-[#64748b]">
            Análise Inteligente de Sinistros
          </p>
        </div>

        <Card className="border border-[#e2e8f0] shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-[#0f172a] text-xl">
              Cadastrar empresa
            </CardTitle>
            <CardDescription className="text-[#64748b]">
              Crie sua conta e comece a analisar sinistros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#0f172a] font-medium">
                  Nome da empresa
                </Label>
                <Input
                  name="empresa"
                  placeholder="Seguradora Exemplo S.A."
                  value={form.empresa}
                  onChange={handleChange}
                  className="border-[#e2e8f0]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#0f172a] font-medium">CNPJ</Label>
                <Input
                  name="cnpj"
                  placeholder="00.000.000/0001-00"
                  value={form.cnpj}
                  onChange={handleChange}
                  className="border-[#e2e8f0]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#0f172a] font-medium">
                  E-mail corporativo
                </Label>
                <Input
                  name="email"
                  type="email"
                  placeholder="contato@empresa.com"
                  value={form.email}
                  onChange={handleChange}
                  className="border-[#e2e8f0]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#0f172a] font-medium">Senha</Label>
                <Input
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  className="border-[#e2e8f0]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#0f172a] font-medium">
                  Confirmar senha
                </Label>
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder="Repita a senha"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="border-[#e2e8f0]"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a2744] hover:bg-[#243459] text-white font-medium h-10"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando conta...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Criar conta
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#e2e8f0] text-center">
              <p className="text-sm text-[#64748b]">
                Já tem uma conta?{" "}
                <Link
                  href="/login"
                  className="text-[#1a2744] font-medium hover:underline"
                >
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
