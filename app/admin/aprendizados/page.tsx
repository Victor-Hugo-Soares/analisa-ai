"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LogOut, ArrowLeft, Brain, CheckCircle, XCircle, Clock,
  Sparkles, BookOpen, ChevronDown, ChevronUp, Loader2,
} from "lucide-react"
import { getSession, isMaster, getAccessToken, clearSession } from "@/lib/storage"

type StatusAprendizado = "pendente" | "aprovado" | "reprovado" | "registrado"

interface Aprendizado {
  id: string
  sinistro_id: string
  conteudo: string
  conteudo_editado: string | null
  status: StatusAprendizado
  criado_em: string
}

const STATUS_CONFIG: Record<StatusAprendizado, { label: string; className: string }> = {
  pendente: {
    label: "Pendente",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  aprovado: {
    label: "Aprovado",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  reprovado: {
    label: "Reprovado",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  registrado: {
    label: "Registrado na IA",
    className: "border",
  },
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AprendizadosPage() {
  const router = useRouter()
  const [aprendizados, setAprendizados] = useState<Aprendizado[]>([])
  const [loading, setLoading] = useState(true)
  const [emAcao, setEmAcao] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [textoEditado, setTextoEditado] = useState<Record<string, string>>({})

  useEffect(() => {
    const session = getSession()
    if (!session || !isMaster()) {
      router.push("/login")
      return
    }
    fetchAprendizados()
  }, [router])

  async function fetchAprendizados() {
    setLoading(true)
    const token = getAccessToken()
    const res = await fetch("/api/admin/aprendizados", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setAprendizados(data.aprendizados ?? [])
    }
    setLoading(false)
  }

  async function aprovar(id: string) {
    setEmAcao(id)
    const token = getAccessToken()
    const editado = textoEditado[id]
    await fetch(`/api/admin/aprendizados/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: "aprovado",
        ...(editado ? { conteudo_editado: editado } : {}),
      }),
    })
    setEmAcao(null)
    setEditandoId(null)
    fetchAprendizados()
  }

  async function reprovar(id: string) {
    setEmAcao(id)
    const token = getAccessToken()
    await fetch(`/api/admin/aprendizados/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "reprovado" }),
    })
    setEmAcao(null)
    fetchAprendizados()
  }

  async function registrarNaIA(id: string) {
    setEmAcao(id)
    const token = getAccessToken()
    await fetch(`/api/admin/aprendizados/${id}/registrar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
    setEmAcao(null)
    fetchAprendizados()
  }

  function handleLogout() {
    clearSession()
    router.push("/login")
  }

  function toggleEditar(id: string, conteudoAtual: string) {
    if (editandoId === id) {
      setEditandoId(null)
    } else {
      setEditandoId(id)
      setTextoEditado((prev) => ({
        ...prev,
        [id]: prev[id] ?? conteudoAtual,
      }))
    }
  }

  const total = aprendizados.length
  const pendentes = aprendizados.filter((a) => a.status === "pendente").length
  const aprovados = aprendizados.filter((a) => a.status === "aprovado").length
  const registrados = aprendizados.filter((a) => a.status === "registrado").length

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="border-b border-[#1e293b] bg-[#0f172a] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-lg leading-none" style={{ color: "#00bcb6" }}>
                Loma
              </span>
              <span className="text-slate-300 text-sm font-medium hidden sm:inline">
                Proteção Veicular
              </span>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: "rgba(0,188,182,0.15)",
                color: "#00bcb6",
                border: "1px solid rgba(0,188,182,0.3)",
              }}
            >
              MASTER
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm hidden sm:block">vsoareslins452@gmail.com</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb / voltar */}
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Painel
        </button>

        {/* Título */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Aprendizados</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gerencie os aprendizados reportados pelos analistas
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total</span>
              <BookOpen className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-2xl font-bold text-white">{total}</span>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Pendentes</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl font-bold text-white">{pendentes}</span>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Aprovados</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-bold text-white">{aprovados}</span>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                Registrados na IA
              </span>
              <Brain className="w-4 h-4" style={{ color: "#00bcb6" }} />
            </div>
            <span className="text-2xl font-bold text-white">{registrados}</span>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#334155] flex items-center justify-between">
            <h2 className="text-white font-semibold">Lista de Aprendizados</h2>
            <span className="text-slate-400 text-sm">
              {total} item{total !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div
                className="w-8 h-8 border-2 border-slate-700 rounded-full animate-spin"
                style={{ borderTopColor: "#00bcb6" }}
              />
            </div>
          ) : aprendizados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <BookOpen className="w-10 h-10 text-slate-700" />
              <span className="text-sm">Nenhum aprendizado reportado ainda.</span>
            </div>
          ) : (
            <div className="divide-y divide-[#334155]">
              {aprendizados.map((item) => {
                const conteudoExibido = item.conteudo_editado ?? item.conteudo
                const statusCfg = STATUS_CONFIG[item.status]
                const ocupado = emAcao === item.id

                return (
                  <div key={item.id} className="px-6 py-5">
                    {/* Header do card */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span
                        className="text-sm font-bold font-mono"
                        style={{ color: "#00bcb6" }}
                      >
                        {item.sinistro_id}
                      </span>
                      <span className="text-slate-600 text-xs">·</span>
                      <span className="text-slate-500 text-xs">{formatarData(item.criado_em)}</span>
                      <span
                        className={`text-xs border px-2 py-0.5 rounded-full ml-auto ${
                          item.status === "registrado" ? "" : statusCfg.className
                        }`}
                        style={
                          item.status === "registrado"
                            ? {
                                backgroundColor: "rgba(0,188,182,0.1)",
                                color: "#00bcb6",
                                borderColor: "rgba(0,188,182,0.25)",
                              }
                            : undefined
                        }
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Conteúdo */}
                    <p className="text-slate-300 text-sm leading-relaxed mb-4">
                      {conteudoExibido}
                    </p>

                    {/* Ações por status */}
                    {item.status === "pendente" && (
                      <div className="space-y-3">
                        {/* Toggle editar conteúdo */}
                        <button
                          onClick={() => toggleEditar(item.id, item.conteudo)}
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                          {editandoId === item.id ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                          Editar conteúdo antes de aprovar
                        </button>

                        {editandoId === item.id && (
                          <textarea
                            value={textoEditado[item.id] ?? item.conteudo}
                            onChange={(e) =>
                              setTextoEditado((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            rows={4}
                            className="w-full bg-[#0f172a] border border-[#475569] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00bcb6] resize-y"
                          />
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => aprovar(item.id)}
                            disabled={ocupado}
                            className="flex items-center gap-1.5 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 bg-emerald-600 hover:bg-emerald-500"
                          >
                            {ocupado ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            Aprovar
                          </button>
                          <button
                            onClick={() => reprovar(item.id)}
                            disabled={ocupado}
                            className="flex items-center gap-1.5 text-red-400 hover:text-white text-sm font-medium px-4 py-2 rounded-lg border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reprovar
                          </button>
                        </div>
                      </div>
                    )}

                    {item.status === "aprovado" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => registrarNaIA(item.id)}
                          disabled={ocupado}
                          className="flex items-center gap-1.5 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                          style={{ backgroundColor: "#00bcb6" }}
                        >
                          {ocupado ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          Registrar na IA
                        </button>
                        <button
                          onClick={() => reprovar(item.id)}
                          disabled={ocupado}
                          className="flex items-center gap-1.5 text-red-400 hover:text-white text-sm font-medium px-4 py-2 rounded-lg border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reprovar
                        </button>
                      </div>
                    )}

                    {item.status === "reprovado" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => aprovar(item.id)}
                          disabled={ocupado}
                          className="flex items-center gap-1.5 text-emerald-400 hover:text-white text-sm font-medium px-4 py-2 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        >
                          {ocupado ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          Aprovar
                        </button>
                      </div>
                    )}

                    {/* status === "registrado" — sem ações */}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
