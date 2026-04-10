"use client"

import { useEffect, useState } from "react"
import { getSession, isMaster, getRole, getAccessToken } from "@/lib/storage"

export default function DebugPage() {
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null)
  const [token, setToken] = useState<string | null>(null)
  const [dbUser, setDbUser] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = getSession()
    const t = getAccessToken()
    setSession(s)
    setToken(t)

    if (t) {
      fetch("/api/debug/me", {
        headers: { Authorization: `Bearer ${t}` },
      })
        .then(r => r.json())
        .then(d => setDbUser(d))
        .catch(() => setDbUser({ error: "falha na requisição" }))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const labelClass = "text-xs text-slate-500 font-mono"
  const valueClass = "text-sm font-semibold font-mono"

  function Row({ label, value, highlight }: { label: string; value: string; highlight?: "green" | "red" | "yellow" }) {
    const color = highlight === "green" ? "text-emerald-600" : highlight === "red" ? "text-red-600" : highlight === "yellow" ? "text-amber-600" : "text-slate-900"
    return (
      <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
        <span className={labelClass}>{label}</span>
        <span className={`${valueClass} ${color}`}>{value}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm w-full max-w-lg p-6">
        <h1 className="text-lg font-bold text-slate-900 mb-1">🔍 Diagnóstico de Sessão</h1>
        <p className="text-slate-400 text-sm mb-6">Verifique os dados da sua sessão atual</p>

        <div className="space-y-4">
          {/* Sessão localStorage */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sessão (localStorage)</p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 divide-y divide-slate-100">
              {session ? (
                <>
                  <Row label="ID" value={session.id ?? "—"} />
                  <Row label="Nome" value={session.nome ?? "—"} />
                  <Row label="Email" value={session.email ?? "—"} />
                  <Row
                    label="Role"
                    value={session.role ?? "não definido"}
                    highlight={session.role === "master" ? "green" : session.role ? "yellow" : "red"}
                  />
                  <Row
                    label="isMaster()"
                    value={isMaster() ? "✅ SIM" : "❌ NÃO"}
                    highlight={isMaster() ? "green" : "red"}
                  />
                  <Row label="getRole()" value={getRole() ?? "null"} />
                </>
              ) : (
                <p className="py-3 text-sm text-red-500">Nenhuma sessão encontrada. Faça login primeiro.</p>
              )}
            </div>
          </div>

          {/* Token */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Token de Acesso</p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4">
              <Row label="access_token" value={token ? `${token.slice(0, 20)}...` : "❌ Sem token"} highlight={token ? "green" : "red"} />
            </div>
          </div>

          {/* Dado do banco */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Usuário no Banco (API)</p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4">
              {loading ? (
                <p className="py-3 text-sm text-slate-400">Carregando...</p>
              ) : dbUser ? (
                <pre className="text-xs font-mono text-slate-700 py-3 overflow-auto max-h-40 whitespace-pre-wrap">
                  {JSON.stringify(dbUser, null, 2)}
                </pre>
              ) : (
                <p className="py-3 text-sm text-slate-400">Sem token para buscar</p>
              )}
            </div>
          </div>

          {/* Correção */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-bold text-amber-800 mb-2">⚠️ Se o Role não for &quot;master&quot;</p>
            <p className="text-xs text-amber-700 mb-2">Execute este SQL no Supabase (SQL Editor):</p>
            <code className="block bg-amber-100 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-900 font-mono whitespace-pre">
              {`UPDATE usuarios\nSET role = 'master'\nWHERE email = '${session?.email ?? "seu-email@aqui.com"}';`}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
