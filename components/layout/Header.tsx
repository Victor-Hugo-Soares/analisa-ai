"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { LogOut, Bell, X } from "lucide-react"
import { clearSession, getAccessToken } from "@/lib/storage"
import type { EmpresaSession } from "@/lib/types"

interface Notificacao {
  id: string
  titulo: string
  mensagem: string
  lida: boolean
  criado_em: string
}

interface HeaderProps {
  session: EmpresaSession | null
}

export default function Header({ session }: HeaderProps) {
  const router = useRouter()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const naoLidas = notificacoes.filter((n) => !n.lida).length

  function handleLogout() {
    clearSession()
    router.push("/login")
  }

  async function fetchNotificacoes() {
    const token = getAccessToken()
    if (!token) return
    try {
      const res = await fetch("/api/notificacoes", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotificacoes(data.notificacoes ?? [])
      }
    } catch { /* sem conectividade */ }
  }

  async function marcarTodasLidas() {
    const token = getAccessToken()
    if (!token) return
    await fetch("/api/notificacoes", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
  }

  useEffect(() => {
    fetchNotificacoes()
    const interval = setInterval(fetchNotificacoes, 30000) // polling a cada 30s
    return () => clearInterval(interval)
  }, [])

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function formatarTempo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return "agora"
    if (min < 60) return `${min}min`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
  }

  return (
    <header className="bg-white border-b border-[#e2e8f0] h-16 flex items-center px-6 gap-4 sticky top-0 z-50">
      <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
        <Image src="/logo.png" alt="IAnalista" width={120} height={34} priority />
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {/* Sino de notificações */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => {
              setAberto((v) => !v)
              if (!aberto && naoLidas > 0) marcarTodasLidas()
            }}
            className="relative p-2 text-[#94a3b8] hover:text-[#1a2744] hover:bg-[#f1f5f9] rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {naoLidas > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: "#00bcb6" }}>
                {naoLidas > 9 ? "9+" : naoLidas}
              </span>
            )}
          </button>

          {aberto && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f1f5f9]">
                <span className="text-sm font-semibold text-[#0f172a]">Notificações</span>
                <button onClick={() => setAberto(false)} className="text-[#94a3b8] hover:text-[#0f172a]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notificacoes.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-[#94a3b8]">
                    Nenhuma notificação
                  </div>
                ) : (
                  notificacoes.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-[#f8fafc] last:border-0 ${!n.lida ? "bg-[#f0fdfc]" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0f172a] leading-snug">{n.titulo}</p>
                          <p className="text-xs text-[#64748b] mt-0.5 truncate">{n.mensagem}</p>
                        </div>
                        <span className="text-[10px] text-[#94a3b8] whitespace-nowrap mt-0.5">
                          {formatarTempo(n.criado_em)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-[#e2e8f0]">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#00bcb6" }}>
            <span className="text-xs font-bold text-white">
              {session?.nome?.charAt(0)?.toUpperCase() ?? "E"}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-[#0f172a] leading-tight max-w-[150px] truncate">
              {session?.nome ?? "Empresa"}
            </p>
            <p className="text-xs text-[#94a3b8] leading-tight max-w-[150px] truncate">
              {session?.email ?? ""}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[#94a3b8] hover:text-[#1a2744] text-sm transition-colors ml-1"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
