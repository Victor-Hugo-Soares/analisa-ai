"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Shield, Eye, EyeOff, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { setSession } from "@/lib/storage"

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
    setLoading(true)

    await new Promise((r) => setTimeout(r, 800))

    if (!email || !password) {
      setError("Preencha todos os campos.")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Senha inválida. Verifique suas credenciais.")
      setLoading(false)
      return
    }

    setSession({
      id: "emp-001",
      nome: "Seguradora Modelo S.A.",
      email,
      cnpj: "00.000.000/0001-00",
    })

    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
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
              Acesse sua conta
            </CardTitle>
            <CardDescription className="text-[#64748b]">
              Entre com as credenciais da sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#0f172a] font-medium">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="empresa@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-[#e2e8f0] focus:border-[#1a2744] focus:ring-[#1a2744]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-[#0f172a] font-medium"
                >
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-[#e2e8f0] focus:border-[#1a2744] pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f172a]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
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
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Entrar
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#e2e8f0] text-center">
              <p className="text-sm text-[#64748b]">
                Ainda não tem conta?{" "}
                <Link
                  href="/cadastro"
                  className="text-[#1a2744] font-medium hover:underline"
                >
                  Cadastre sua empresa
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#94a3b8] mt-6">
          Ambiente demonstração &mdash; use qualquer e-mail e senha com 6+ caracteres
        </p>
      </div>
    </div>
  )
}
