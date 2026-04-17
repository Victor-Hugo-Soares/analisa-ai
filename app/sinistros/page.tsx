"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import SinistrosList from "@/components/dashboard/SinistrosList"
import { getSession, getAccessToken, refreshAuthTokens, clearSession } from "@/lib/storage"
import type { EmpresaSession, Sinistro, StatusSinistro } from "@/lib/types"

const statusOptions: { value: string; label: string }[] = [
  { value: "todos", label: "Todos os status" },
  { value: "pendente", label: "Pendente" },
  { value: "em_analise", label: "Em Análise" },
  { value: "aguardando_informacoes", label: "Aguardando Informações" },
  { value: "concluido", label: "Concluído" },
  { value: "suspeito", label: "Suspeito" },
]

export default function EventosPage() {
  const router = useRouter()
  const [session, setSession] = useState<EmpresaSession | null>(null)
  const [sinistros, setEventos] = useState<Sinistro[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
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
      const loadEventos = async (accessToken: string, retried = false) => {
        try {
          const r = await fetch("/api/sinistros", { headers: { Authorization: `Bearer ${accessToken}` } })
          if (r.status === 401 && !retried) {
            const newToken = await refreshAuthTokens()
            if (newToken) { loadEventos(newToken, true); return }
            clearSession()
            router.push("/login")
            return
          }
          const d = await r.json()
          if (d.sinistros) setEventos(d.sinistros)
        } finally {
          setLoading(false)
        }
      }
      loadEventos(token)
    } else {
      setLoading(false)
    }
  }, [router])

  const filtered = sinistros.filter((s) => {
    const matchSearch =
      !search ||
      s.dados.nomeSegurado.toLowerCase().includes(search.toLowerCase()) ||
      s.dados.placa.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())

    const matchStatus =
      statusFilter === "todos" || s.status === (statusFilter as StatusSinistro)

    return matchSearch && matchStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-8 h-8 border-2 border-[#1a2744]/20 border-t-[#1a2744] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header session={session} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 min-w-0">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-[#0f172a]">Eventos</h1>
                <p className="text-[#64748b] text-sm mt-0.5">
                  {sinistros.length} evento{sinistros.length !== 1 ? "s" : ""} registrados
                </p>
              </div>
              <Link href="/sinistros/novo">
                <Button className="text-white gap-2" style={{ backgroundColor: "#00bcb6" }}>
                  <Plus className="w-4 h-4" />
                  Novo Evento
                </Button>
              </Link>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Buscar por nome, placa ou número..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 border-[#e2e8f0]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#64748b]" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-[#e2e8f0] rounded-md px-3 py-2 text-sm text-[#0f172a] bg-white focus:outline-none focus:border-[#1a2744]"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-[#64748b]">
                  <p className="font-medium">Nenhum evento encontrado</p>
                  <p className="text-sm text-[#94a3b8] mt-1">
                    Tente ajustar os filtros de busca
                  </p>
                </div>
              ) : (
                <SinistrosList sinistros={filtered} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
