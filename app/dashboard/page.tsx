"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import StatsCard from "@/components/dashboard/StatsCard"
import SinistrosList from "@/components/dashboard/SinistrosList"
import { getSession, getAccessToken } from "@/lib/storage"
import type { EmpresaSession, Sinistro } from "@/lib/types"

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<EmpresaSession | null>(null)
  const [sinistros, setSinistros] = useState<Sinistro[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = getSession()
    if (!s) {
      router.push("/login")
      return
    }
    setSession(s)
    const token = getAccessToken()
    if (token) {
      fetch("/api/sinistros", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => { if (d.sinistros) setSinistros(d.sinistros) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-8 h-8 border-3 border-[#1a2744]/20 border-t-[#1a2744] rounded-full animate-spin" />
      </div>
    )
  }

  const total = sinistros.length
  const pendentes = sinistros.filter(
    (s) => s.status === "pendente" || s.status === "em_analise"
  ).length
  const concluidos = sinistros.filter((s) => s.status === "concluido").length
  const suspeitos = sinistros.filter((s) => s.status === "suspeito").length
  const taxaSuspeita =
    total > 0 ? Math.round((suspeitos / total) * 100) : 0

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header session={session} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 min-w-0">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-[#0f172a]">Dashboard</h1>
                <p className="text-[#64748b] text-sm mt-0.5">
                  Visão geral dos sinistros
                </p>
              </div>
              <Link href="/sinistros/novo">
                <Button className="bg-amber-500 hover:bg-amber-400 text-white gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Sinistro
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatsCard
                title="Total de Sinistros"
                value={total}
                subtitle="Todos os registros"
                icon={FileText}
                color="navy"
                trend={{ value: "12%", positive: true }}
              />
              <StatsCard
                title="Pendentes"
                value={pendentes}
                subtitle="Aguardando análise"
                icon={Clock}
                color="amber"
              />
              <StatsCard
                title="Concluídos"
                value={concluidos}
                subtitle="Análise finalizada"
                icon={CheckCircle}
                color="teal"
              />
              <StatsCard
                title="Taxa de Suspeita"
                value={`${taxaSuspeita}%`}
                subtitle={`${suspeitos} sinistros suspeitos`}
                icon={AlertTriangle}
                color="red"
              />
            </div>

            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
                <div>
                  <h2 className="font-semibold text-[#0f172a]">
                    Sinistros Recentes
                  </h2>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    {total} sinistro{total !== 1 ? "s" : ""} no total
                  </p>
                </div>
                <Link
                  href="/sinistros"
                  className="text-sm text-[#1a2744] font-medium hover:underline"
                >
                  Ver todos
                </Link>
              </div>
              <SinistrosList sinistros={sinistros.slice(0, 8)} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
