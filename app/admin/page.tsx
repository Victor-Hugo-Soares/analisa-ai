"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Shield, Building2, Users, FileText, AlertTriangle,
  CheckCircle, XCircle, ChevronDown, Save, LogOut, Settings
} from "lucide-react"
import { getSession, isMaster, getAccessToken, clearSession } from "@/lib/storage"
import type { NivelAcesso } from "@/lib/types"

interface EmpresaAdmin {
  id: string
  nome: string
  cnpj: string
  email: string
  plano: string
  ativo: boolean
  limite_usuarios: number
  nivel_acesso: NivelAcesso
  criado_em: string
  total_usuarios: number
  total_sinistros: number
  sinistros_suspeitos: number
}

const NIVEL_LABEL: Record<NivelAcesso, string> = {
  basico: "Básico",
  avancado: "Avançado",
  premium: "Premium",
}

const NIVEL_COLOR: Record<NivelAcesso, string> = {
  basico: "bg-slate-100 text-slate-700 border-slate-200",
  avancado: "bg-blue-50 text-blue-700 border-blue-200",
  premium: "bg-amber-50 text-amber-700 border-amber-200",
}

export default function AdminPage() {
  const router = useRouter()
  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<EmpresaAdmin>>({})
  const [salvando, setSalvando] = useState(false)
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean } | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session || !isMaster()) {
      router.push("/login")
      return
    }
    carregarEmpresas()
  }, [router])

  async function carregarEmpresas() {
    setLoading(true)
    const token = getAccessToken()
    const res = await fetch("/api/admin/empresas", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setEmpresas(data.empresas)
    }
    setLoading(false)
  }

  function abrirEdicao(empresa: EmpresaAdmin) {
    setEditando(empresa.id)
    setForm({
      limite_usuarios: empresa.limite_usuarios,
      nivel_acesso: empresa.nivel_acesso,
      ativo: empresa.ativo,
      plano: empresa.plano,
    })
    setFeedback(null)
  }

  async function salvar(id: string) {
    setSalvando(true)
    const token = getAccessToken()
    const res = await fetch(`/api/admin/empresas/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    })
    setSalvando(false)
    if (res.ok) {
      setFeedback({ id, ok: true })
      setEditando(null)
      carregarEmpresas()
    } else {
      setFeedback({ id, ok: false })
    }
  }

  function handleLogout() {
    clearSession()
    router.push("/login")
  }

  const totalEmpresas = empresas.length
  const totalAtivas = empresas.filter((e) => e.ativo).length
  const totalUsuarios = empresas.reduce((a, e) => a + e.total_usuarios, 0)
  const totalSinistros = empresas.reduce((a, e) => a + e.total_sinistros, 0)

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header master */}
      <header className="border-b border-[#1e293b] bg-[#0f172a] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold tracking-tight">Analisa Aí</span>
              <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                MASTER
              </span>
            </div>
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Painel Master</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gerencie todas as empresas, acessos e limites da plataforma
          </p>
        </div>

        {/* Stats gerais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Empresas", value: totalEmpresas, icon: Building2, color: "text-blue-400" },
            { label: "Ativas", value: totalAtivas, icon: CheckCircle, color: "text-emerald-400" },
            { label: "Usuários", value: totalUsuarios, icon: Users, color: "text-violet-400" },
            { label: "Sinistros", value: totalSinistros, icon: FileText, color: "text-amber-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className="text-2xl font-bold text-white">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Lista de empresas */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#334155] flex items-center justify-between">
            <h2 className="text-white font-semibold">Empresas Cadastradas</h2>
            <span className="text-slate-400 text-sm">{totalEmpresas} empresa{totalEmpresas !== 1 ? "s" : ""}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-amber-400 rounded-full animate-spin" />
            </div>
          ) : empresas.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              Nenhuma empresa cadastrada ainda.
            </div>
          ) : (
            <div className="divide-y divide-[#334155]">
              {empresas.map((empresa) => (
                <div key={empresa.id} className="px-6 py-5">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Info empresa */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold truncate">{empresa.nome}</span>
                        {empresa.ativo ? (
                          <span className="flex-shrink-0 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            Ativa
                          </span>
                        ) : (
                          <span className="flex-shrink-0 text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                            Inativa
                          </span>
                        )}
                        <span className={`flex-shrink-0 text-xs border px-2 py-0.5 rounded-full ${NIVEL_COLOR[empresa.nivel_acesso]}`}>
                          {NIVEL_LABEL[empresa.nivel_acesso]}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{empresa.email}</p>
                      <p className="text-slate-500 text-xs mt-0.5">CNPJ: {empresa.cnpj}</p>

                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 text-slate-400 text-xs">
                          <Users className="w-3.5 h-3.5" />
                          {empresa.total_usuarios}/{empresa.limite_usuarios} usuários
                        </span>
                        <span className="flex items-center gap-1 text-slate-400 text-xs">
                          <FileText className="w-3.5 h-3.5" />
                          {empresa.total_sinistros} sinistros
                        </span>
                        {empresa.sinistros_suspeitos > 0 && (
                          <span className="flex items-center gap-1 text-amber-400 text-xs">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {empresa.sinistros_suspeitos} suspeitos
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      {feedback?.id === empresa.id && (
                        <span className={`text-xs ${feedback.ok ? "text-emerald-400" : "text-red-400"}`}>
                          {feedback.ok ? "Salvo!" : "Erro ao salvar"}
                        </span>
                      )}
                      <button
                        onClick={() => editando === empresa.id ? setEditando(null) : abrirEdicao(empresa)}
                        className="flex items-center gap-1.5 text-sm bg-[#334155] hover:bg-[#475569] text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Editar
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${editando === empresa.id ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Painel de edição inline */}
                  {editando === empresa.id && (
                    <div className="mt-4 pt-4 border-t border-[#334155]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Limite de usuários */}
                        <div>
                          <label className="block text-xs text-slate-400 font-medium mb-1.5">
                            Limite de Usuários
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={form.limite_usuarios ?? empresa.limite_usuarios}
                            onChange={(e) => setForm((f) => ({ ...f, limite_usuarios: Number(e.target.value) }))}
                            className="w-full bg-[#0f172a] border border-[#475569] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Nível de acesso */}
                        <div>
                          <label className="block text-xs text-slate-400 font-medium mb-1.5">
                            Nível de Acesso
                          </label>
                          <select
                            value={form.nivel_acesso ?? empresa.nivel_acesso}
                            onChange={(e) => setForm((f) => ({ ...f, nivel_acesso: e.target.value as NivelAcesso }))}
                            className="w-full bg-[#0f172a] border border-[#475569] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                          >
                            <option value="basico">Básico</option>
                            <option value="avancado">Avançado</option>
                            <option value="premium">Premium</option>
                          </select>
                        </div>

                        {/* Plano */}
                        <div>
                          <label className="block text-xs text-slate-400 font-medium mb-1.5">
                            Plano
                          </label>
                          <input
                            type="text"
                            value={form.plano ?? empresa.plano ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, plano: e.target.value }))}
                            className="w-full bg-[#0f172a] border border-[#475569] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                            placeholder="ex: Pro, Enterprise..."
                          />
                        </div>

                        {/* Status ativo */}
                        <div>
                          <label className="block text-xs text-slate-400 font-medium mb-1.5">
                            Status
                          </label>
                          <div className="flex items-center gap-3 h-9">
                            <button
                              onClick={() => setForm((f) => ({ ...f, ativo: true }))}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                (form.ativo ?? empresa.ativo)
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-[#334155] text-slate-400 border border-transparent"
                              }`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Ativa
                            </button>
                            <button
                              onClick={() => setForm((f) => ({ ...f, ativo: false }))}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                !(form.ativo ?? empresa.ativo)
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : "bg-[#334155] text-slate-400 border border-transparent"
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Inativa
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-4">
                        <button
                          onClick={() => salvar(empresa.id)}
                          disabled={salvando}
                          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {salvando ? "Salvando..." : "Salvar alterações"}
                        </button>
                        <button
                          onClick={() => setEditando(null)}
                          className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
