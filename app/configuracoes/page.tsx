"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Settings, Building2, Users, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import { getSession } from "@/lib/storage"
import type { EmpresaSession } from "@/lib/types"

export default function ConfiguracoesPage() {
  const router = useRouter()
  const [session, setSession] = useState<EmpresaSession | null>(null)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.push("/login"); return }
    setSession(s)
  }, [router])

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header session={session} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#0f172a]">Configurações</h1>
              <p className="text-[#64748b] text-sm mt-0.5">Gerencie as configurações da sua empresa</p>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#1a2744]/10 p-2 rounded-lg">
                    <Building2 className="w-5 h-5 text-[#1a2744]" />
                  </div>
                  <h2 className="font-semibold text-[#0f172a]">Dados da Empresa</h2>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[#0f172a] font-medium text-sm">Nome da empresa</Label>
                    <Input defaultValue={session?.nome} className="border-[#e2e8f0]" readOnly />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#0f172a] font-medium text-sm">CNPJ</Label>
                    <Input defaultValue={session?.cnpj} className="border-[#e2e8f0]" readOnly />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#0f172a] font-medium text-sm">E-mail</Label>
                    <Input defaultValue={session?.email} className="border-[#e2e8f0]" readOnly />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 opacity-60">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[#0f172a]">Usuários e Permissões</h2>
                    <p className="text-xs text-[#94a3b8]">Em breve</p>
                  </div>
                </div>
                <p className="text-sm text-[#64748b]">Gerencie analistas e níveis de acesso.</p>
              </div>

              <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 opacity-60">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Key className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[#0f172a]">Integrações e API</h2>
                    <p className="text-xs text-[#94a3b8]">Em breve</p>
                  </div>
                </div>
                <p className="text-sm text-[#64748b]">Conecte o Analisa Aí com seu sistema de gestão.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
