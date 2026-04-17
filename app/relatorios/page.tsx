"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, TrendingUp, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import { getSession, getAccessToken } from "@/lib/storage"
import type { EmpresaSession, Sinistro } from "@/lib/types"

export default function RelatoriosPage() {
  const router = useRouter()
  const [session, setSession] = useState<EmpresaSession | null>(null)
  const [sinistros, setEventos] = useState<Sinistro[]>([])

  useEffect(() => {
    const s = getSession()
    if (!s) { router.push("/login"); return }
    setSession(s)
    const token = getAccessToken()
    if (token) {
      fetch("/api/sinistros", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => { if (d.sinistros) setEventos(d.sinistros) })
    }
  }, [router])

  const total = sinistros.length
  const aprovados = sinistros.filter((s) => s.status === "concluido").length
  const suspeitos = sinistros.filter((s) => s.status === "suspeito").length
  const pendentes = sinistros.filter((s) => s.status === "pendente" || s.status === "em_analise" || s.status === "aguardando_informacoes").length

  const metrics = [
    { label: "Total de Eventos", value: total, icon: BarChart3, color: "", bg: "", inlineColor: "#00a89e", inlineBg: "#ccf7f5" },
    { label: "Aprovados", value: aprovados, icon: TrendingUp, color: "text-green-700", bg: "bg-green-100", inlineColor: undefined, inlineBg: undefined },
    { label: "Suspeitos / Recusados", value: suspeitos, icon: TrendingUp, color: "text-red-700", bg: "bg-red-100", inlineColor: undefined, inlineBg: undefined },
    { label: "Pendentes", value: pendentes, icon: TrendingUp, color: "", bg: "", inlineColor: "#2e9c8f", inlineBg: "#f0fdfc" },
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header session={session} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-[#0f172a]">Relatórios</h1>
                <p className="text-[#64748b] text-sm mt-0.5">Visão consolidada dos sinistros</p>
              </div>
              <Button variant="outline" className="gap-2 border-[#e2e8f0] text-[#64748b]">
                <FileDown className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {metrics.map((m) => {
                const Icon = m.icon
                return (
                  <div key={m.label} className="bg-white border border-[#e2e8f0] rounded-xl p-4">
                    <div className={`${m.bg} p-2.5 rounded-lg w-fit mb-3`} style={m.inlineBg ? { backgroundColor: m.inlineBg } : undefined}>
                      <Icon className={`w-5 h-5 ${m.color}`} style={m.inlineColor ? { color: m.inlineColor } : undefined} />
                    </div>
                    <p className="text-2xl font-bold text-[#0f172a]">{m.value}</p>
                    <p className="text-sm text-[#64748b] mt-0.5">{m.label}</p>
                  </div>
                )
              })}
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 text-center">
              <BarChart3 className="w-12 h-12 text-[#94a3b8] mx-auto mb-3" />
              <p className="font-semibold text-[#0f172a]">Relatórios avançados em breve</p>
              <p className="text-sm text-[#64748b] mt-1">
                Gráficos de tendências, análise de fraudes por período e muito mais.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
