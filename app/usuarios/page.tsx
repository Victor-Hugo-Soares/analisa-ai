"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Users, Plus, Pencil, Trash2, X, Eye, EyeOff, UserRound, ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import { getSession, getAccessToken, canManageUsers } from "@/lib/storage"
import type { EmpresaSession, RoleUsuario } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Usuario {
  id: string
  empresa_id: string
  nome: string
  email: string
  role: RoleUsuario
  criado_em: string
}

const roleBadge: Record<string, { label: string; className: string }> = {
  gestor:  { label: "Gestor",  className: "bg-blue-100 text-blue-800 border-blue-200" },
  admin:   { label: "Admin",   className: "bg-purple-100 text-purple-800 border-purple-200" },
  usuario: { label: "Usuário", className: "bg-green-100 text-green-800 border-green-200" },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}

export default function UsuariosPage() {
  const router = useRouter()
  const [session, setSession] = useState<EmpresaSession | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<"criar" | "editar" | null>(null)
  const [editTarget, setEditTarget] = useState<Usuario | null>(null)
  const [form, setForm] = useState({ nome: "", email: "", senha: "", role: "usuario" })
  const [showSenha, setShowSenha] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Usuario | null>(null)

  useEffect(() => {
    const s = getSession()
    if (!s || !canManageUsers()) { router.push("/dashboard"); return }
    setSession(s)
    carregarUsuarios()
  }, [router])

  async function carregarUsuarios() {
    setLoading(true)
    const token = getAccessToken()
    const res = await fetch("/api/usuarios", { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      const data = await res.json()
      setUsuarios(data.usuarios ?? [])
    }
    setLoading(false)
  }

  function abrirCriar() {
    setForm({ nome: "", email: "", senha: "", role: "usuario" })
    setErro(null)
    setShowSenha(false)
    setModal("criar")
  }

  function abrirEditar(u: Usuario) {
    setEditTarget(u)
    setForm({ nome: u.nome, email: u.email, senha: "", role: u.role })
    setErro(null)
    setShowSenha(false)
    setModal("editar")
  }

  async function salvar() {
    setSalvando(true)
    setErro(null)
    const token = getAccessToken()

    try {
      if (modal === "criar") {
        const res = await fetch("/api/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
      } else if (modal === "editar" && editTarget) {
        const body: Record<string, string> = { nome: form.nome, role: form.role }
        if (form.senha) body.senha = form.senha
        const res = await fetch(`/api/usuarios/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
      }
      setModal(null)
      await carregarUsuarios()
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(u: Usuario) {
    const token = getAccessToken()
    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      setConfirmDelete(null)
      await carregarUsuarios()
    }
  }

  const isMasterSession = session?.role === "master"

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header session={session} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 min-w-0">
          <div className="max-w-4xl mx-auto">
            {/* Cabeçalho */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-white rounded-lg border border-transparent hover:border-[#e2e8f0] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Usuários da Empresa
                </h1>
                <p className="text-sm text-[#64748b]">Gerencie os analistas e gestores da sua equipe</p>
              </div>
              <Button onClick={abrirCriar} className="bg-[#1a2744] hover:bg-[#243459] text-white gap-2">
                <Plus className="w-4 h-4" />
                Novo Usuário
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total de usuários", value: usuarios.length },
                { label: "Gestores", value: usuarios.filter(u => u.role === "gestor").length },
                { label: "Analistas", value: usuarios.filter(u => u.role === "usuario").length },
              ].map(stat => (
                <div key={stat.label} className="bg-white border border-[#e2e8f0] rounded-xl p-4">
                  <p className="text-2xl font-bold text-[#0f172a]">{stat.value}</p>
                  <p className="text-xs text-[#64748b] mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Lista */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
              {loading ? (
                <div className="py-16 text-center text-[#64748b] text-sm">Carregando...</div>
              ) : usuarios.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="w-8 h-8 text-[#cbd5e1] mx-auto mb-3" />
                  <p className="text-[#64748b] text-sm">Nenhum usuário cadastrado ainda.</p>
                  <Button onClick={abrirCriar} variant="outline" className="mt-3 gap-2 text-sm">
                    <Plus className="w-3.5 h-3.5" />
                    Criar primeiro usuário
                  </Button>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-[#64748b] text-xs uppercase tracking-wide">Usuário</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#64748b] text-xs uppercase tracking-wide">Perfil</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#64748b] text-xs uppercase tracking-wide">Criado em</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {usuarios.map(u => {
                      const badge = roleBadge[u.role] ?? { label: u.role, className: "bg-gray-100 text-gray-800 border-gray-200" }
                      const isMe = u.id === session?.usuario_id
                      return (
                        <tr key={u.id} className="hover:bg-[#f8fafc] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#1a2744]/10 flex items-center justify-center flex-shrink-0">
                                <UserRound className="w-4 h-4 text-[#1a2744]" />
                              </div>
                              <div>
                                <p className="font-medium text-[#0f172a]">
                                  {u.nome}
                                  {isMe && <span className="ml-2 text-xs text-[#94a3b8]">(você)</span>}
                                </p>
                                <p className="text-xs text-[#94a3b8]">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", badge.className)}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#94a3b8]">{formatDate(u.criado_em)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => abrirEditar(u)}
                                className="p-1.5 text-[#64748b] hover:text-[#1a2744] hover:bg-[#f1f5f9] rounded-lg transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {!isMe && (u.role === "usuario" || isMasterSession) && (
                                <button
                                  onClick={() => setConfirmDelete(u)}
                                  className="p-1.5 text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal criar/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-[#1a2744] rounded-t-2xl px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                {modal === "criar" ? "Novo Usuário" : "Editar Usuário"}
              </h2>
              <button onClick={() => setModal(null)} className="text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome completo"
                  className="w-full text-sm border border-[#e2e8f0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20"
                />
              </div>

              {modal === "criar" && (
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1">E-mail *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@empresa.com"
                    className="w-full text-sm border border-[#e2e8f0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1">
                  {modal === "criar" ? "Senha *" : "Nova senha (deixe em branco para manter)"}
                </label>
                <div className="relative">
                  <input
                    type={showSenha ? "text" : "password"}
                    value={form.senha}
                    onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                    placeholder={modal === "criar" ? "Senha inicial" : "Nova senha"}
                    className="w-full text-sm border border-[#e2e8f0] rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(v => !v)}
                    className="absolute right-2.5 top-2 text-[#94a3b8] hover:text-[#64748b]"
                  >
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Gestor pode apenas criar "usuario"; master pode criar "gestor" também */}
              {isMasterSession && (
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1">Perfil *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full text-sm border border-[#e2e8f0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20"
                  >
                    <option value="usuario">Usuário — acesso padrão</option>
                    <option value="gestor">Gestor — gerencia usuários</option>
                  </select>
                </div>
              )}

              {erro && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>
              )}
            </div>

            <div className="px-6 pb-5 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setModal(null)} disabled={salvando} className="border-[#e2e8f0] text-[#64748b]">
                Cancelar
              </Button>
              <Button
                onClick={salvar}
                disabled={salvando || !form.nome || (modal === "criar" && (!form.email || !form.senha))}
                className="bg-[#1a2744] hover:bg-[#243459] text-white"
              >
                {salvando ? "Salvando..." : modal === "criar" ? "Criar Usuário" : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="font-semibold text-[#0f172a]">Excluir usuário?</h2>
            </div>
            <p className="text-sm text-[#64748b] mb-5">
              <strong>{confirmDelete.nome}</strong> será removido permanentemente. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(null)} className="border-[#e2e8f0]">Cancelar</Button>
              <Button onClick={() => excluir(confirmDelete)} className="bg-red-600 hover:bg-red-700 text-white">Excluir</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
