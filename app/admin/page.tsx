"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2, Users, FileText, AlertTriangle,
  CheckCircle, XCircle, ChevronDown, Save, LogOut, Settings,
  Plus, X, Eye, EyeOff, Loader2, BookOpen, ChevronRight,
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
  premium: "border",
}

const NIVEL_STYLE: Record<NivelAcesso, React.CSSProperties | undefined> = {
  basico: undefined,
  avancado: undefined,
  premium: { backgroundColor: "#f0fdfc", color: "#00a89e", borderColor: "#99ede9" },
}

const NIVEL_LIMITES: Record<NivelAcesso, number> = {
  basico: 3,
  avancado: 10,
  premium: 50,
}

interface NovaEmpresaForm {
  nome: string
  cnpj: string
  email: string
  senha: string
  limite_usuarios: number
  nivel_acesso: NivelAcesso
  plano: string
}

const FORM_INICIAL: NovaEmpresaForm = {
  nome: "",
  cnpj: "",
  email: "",
  senha: "",
  limite_usuarios: 3,
  nivel_acesso: "basico",
  plano: "Básico",
}

export default function AdminPage() {
  const router = useRouter()
  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<EmpresaAdmin>>({})
  const [salvando, setSalvando] = useState(false)
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean } | null>(null)

  // Modal Nova Empresa
  const [showModal, setShowModal] = useState(false)
  const [novaForm, setNovaForm] = useState<NovaEmpresaForm>(FORM_INICIAL)
  const [showSenha, setShowSenha] = useState(false)
  const [criando, setCriando] = useState(false)
  const [criarErro, setCriarErro] = useState("")
  const [criarOk, setCriarOk] = useState(false)

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

  async function criarEmpresa(e: React.FormEvent) {
    e.preventDefault()
    setCriarErro("")
    setCriarOk(false)

    if (!novaForm.nome || !novaForm.email || !novaForm.senha) {
      setCriarErro("Preencha nome, e-mail e senha.")
      return
    }
    if (novaForm.senha.length < 6) {
      setCriarErro("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    setCriando(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setCriarErro(data.error ?? "Erro ao criar empresa.")
        setCriando(false)
        return
      }
      setCriarOk(true)
      setNovaForm(FORM_INICIAL)
      setTimeout(() => {
        setShowModal(false)
        setCriarOk(false)
        carregarEmpresas()
      }, 1500)
    } catch {
      setCriarErro("Erro de conexão. Tente novamente.")
    }
    setCriando(false)
  }

  function handleLogout() {
    clearSession()
    router.push("/login")
  }

  // Ajusta limite ao mudar nível
  function handleNivelChange(nivel: NivelAcesso) {
    setNovaForm(f => ({
      ...f,
      nivel_acesso: nivel,
      limite_usuarios: NIVEL_LIMITES[nivel],
      plano: NIVEL_LABEL[nivel],
    }))
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
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-lg leading-none" style={{ color: "#00bcb6" }}>Loma</span>
              <span className="text-slate-300 text-sm font-medium hidden sm:inline">Proteção Veicular</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(0,188,182,0.15)", color: "#00bcb6", border: "1px solid rgba(0,188,182,0.3)" }}>
              MASTER
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <LogOut className="w-4 h-4 rotate-180" />
              Dashboard
            </button>
            <span className="text-slate-600">|</span>
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
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Painel Master</h1>
            <p className="text-slate-400 text-sm mt-1">
              Gerencie todas as empresas, acessos e limites da plataforma
            </p>
          </div>
          <button
            onClick={() => { setShowModal(true); setCriarErro(""); setCriarOk(false) }}
            className="flex items-center gap-2 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
            style={{ backgroundColor: "#00bcb6", boxShadow: "0 10px 15px -3px rgba(0,188,182,0.2)" }}
          >
            <Plus className="w-4 h-4" />
            Nova Empresa
          </button>
        </div>

        {/* Stats gerais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Empresas", value: totalEmpresas, icon: Building2, color: "text-blue-400" },
            { label: "Ativas", value: totalAtivas, icon: CheckCircle, color: "text-emerald-400" },
            { label: "Usuários", value: totalUsuarios, icon: Users, color: "text-violet-400" },
            { label: "Sinistros", value: totalSinistros, icon: FileText, color: "text-[#00bcb6]" },
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

        {/* Navegação rápida */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin/aprendizados")}
            className="w-full sm:w-auto flex items-center justify-between gap-4 bg-[#1e293b] border border-[#334155] hover:border-[#00bcb6]/40 rounded-xl px-5 py-4 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(0,188,182,0.12)" }}
              >
                <BookOpen className="w-4 h-4" style={{ color: "#00bcb6" }} />
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-semibold">Aprendizados</p>
                <p className="text-slate-400 text-xs">Revisar e registrar aprendizados dos analistas na IA</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
          </button>
        </div>

        {/* Lista de empresas */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#334155] flex items-center justify-between">
            <h2 className="text-white font-semibold">Empresas Cadastradas</h2>
            <span className="text-slate-400 text-sm">{totalEmpresas} empresa{totalEmpresas !== 1 ? "s" : ""}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-slate-700 rounded-full animate-spin" style={{ borderTopColor: "#00bcb6" }} />
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
                        <span className={`flex-shrink-0 text-xs border px-2 py-0.5 rounded-full ${NIVEL_COLOR[empresa.nivel_acesso]}`} style={NIVEL_STYLE[empresa.nivel_acesso]}>
                          {NIVEL_LABEL[empresa.nivel_acesso]}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{empresa.email}</p>
                      <p className="text-slate-500 text-xs mt-0.5">CNPJ: {empresa.cnpj}</p>

                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 text-xs">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className={empresa.total_usuarios >= empresa.limite_usuarios ? "text-red-400 font-semibold" : "text-slate-400"}>
                            {empresa.total_usuarios}/{empresa.limite_usuarios} usuários
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-400 text-xs">
                          <FileText className="w-3.5 h-3.5" />
                          {empresa.total_sinistros} sinistros
                        </span>
                        {empresa.sinistros_suspeitos > 0 && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "#00bcb6" }}>
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
                        <div>
                          <label className="block text-xs text-slate-400 font-medium mb-1.5">
                            Limite de Usuários
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={form.limite_usuarios ?? empresa.limite_usuarios}
                            onChange={(e) => setForm((f) => ({ ...f, limite_usuarios: Number(e.target.value) }))}
                            className="w-full bg-[#0f172a] border border-[#475569] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00bcb6]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-400 font-medium mb-1.5">
                            Nível de Acesso
                          </label>
                          <select
                            value={form.nivel_acesso ?? empresa.nivel_acesso}
                            onChange={(e) => setForm((f) => ({ ...f, nivel_acesso: e.target.value as NivelAcesso }))}
                            className="w-full bg-[#0f172a] border border-[#475569] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00bcb6]"
                          >
                            <option value="basico">Básico</option>
                            <option value="avancado">Avançado</option>
                            <option value="premium">Premium</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-slate-400 font-medium mb-1.5">
                            Plano
                          </label>
                          <input
                            type="text"
                            value={form.plano ?? empresa.plano ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, plano: e.target.value }))}
                            className="w-full bg-[#0f172a] border border-[#475569] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00bcb6]"
                            placeholder="ex: Pro, Enterprise..."
                          />
                        </div>

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
                          className="flex items-center gap-1.5 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                          style={{ backgroundColor: "#00bcb6" }}
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

      {/* ── Modal Nova Empresa ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#334155]">
              <div>
                <h2 className="text-white font-bold text-lg">Nova Empresa</h2>
                <p className="text-slate-400 text-sm">Cadastre uma nova empresa na plataforma</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={criarEmpresa} className="px-6 py-5 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">Nome da empresa *</label>
                <input
                  type="text"
                  placeholder="Seguradora Exemplo S.A."
                  value={novaForm.nome}
                  onChange={e => setNovaForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full bg-[#0f172a] border border-[#475569] text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00bcb6]"
                  required
                />
              </div>

              {/* CNPJ e E-mail */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1.5">CNPJ</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={novaForm.cnpj}
                    onChange={e => setNovaForm(f => ({ ...f, cnpj: e.target.value }))}
                    className="w-full bg-[#0f172a] border border-[#475569] text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00bcb6]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1.5">E-mail admin *</label>
                  <input
                    type="email"
                    placeholder="admin@empresa.com"
                    value={novaForm.email}
                    onChange={e => setNovaForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-[#0f172a] border border-[#475569] text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00bcb6]"
                    required
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">Senha de acesso *</label>
                <div className="relative">
                  <input
                    type={showSenha ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={novaForm.senha}
                    onChange={e => setNovaForm(f => ({ ...f, senha: e.target.value }))}
                    className="w-full bg-[#0f172a] border border-[#475569] text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#00bcb6]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nível + Limite */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1.5">Nível de acesso</label>
                  <select
                    value={novaForm.nivel_acesso}
                    onChange={e => handleNivelChange(e.target.value as NivelAcesso)}
                    className="w-full bg-[#0f172a] border border-[#475569] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00bcb6]"
                  >
                    <option value="basico">Básico</option>
                    <option value="avancado">Avançado</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1.5">
                    Limite de usuários
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={novaForm.limite_usuarios}
                    onChange={e => setNovaForm(f => ({ ...f, limite_usuarios: Number(e.target.value) }))}
                    className="w-full bg-[#0f172a] border border-[#475569] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00bcb6]"
                  />
                </div>
              </div>

              {/* Plano */}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">Nome do plano</label>
                <input
                  type="text"
                  placeholder="ex: Pro Mensal, Enterprise..."
                  value={novaForm.plano}
                  onChange={e => setNovaForm(f => ({ ...f, plano: e.target.value }))}
                  className="w-full bg-[#0f172a] border border-[#475569] text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00bcb6]"
                />
              </div>

              {/* Preview */}
              <div className="bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-slate-400 text-xs">Resumo</span>
                <span className="text-white text-sm font-semibold">
                  {NIVEL_LABEL[novaForm.nivel_acesso]} · {novaForm.limite_usuarios} usuário{novaForm.limite_usuarios !== 1 ? "s" : ""}
                </span>
              </div>

              {criarErro && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                  {criarErro}
                </div>
              )}

              {criarOk && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Empresa criada com sucesso!
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={criando || criarOk}
                  className="flex-1 flex items-center justify-center gap-2 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors"
                  style={{ backgroundColor: "#00bcb6" }}
                >
                  {criando ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</>
                  ) : (
                    <><Building2 className="w-4 h-4" /> Criar empresa</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
