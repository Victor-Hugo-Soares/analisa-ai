"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Plus,
  ShieldCheck,
  ScanSearch,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { isMaster, canManageUsers } from "@/lib/storage"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Eventos", href: "/sinistros", icon: FileText },
  { label: "Análise de Imagem", href: "/analise-imagem", icon: ScanSearch },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [master, setMaster] = useState(false)
  const [gestorOuMaster, setGestorOuMaster] = useState(false)

  useEffect(() => {
    setMaster(isMaster())
    setGestorOuMaster(canManageUsers())
  }, [])

  return (
    <aside className="w-64 bg-white border-r border-[#e2e8f0] min-h-[calc(100vh-4rem)] hidden md:flex flex-col">
      <div className="p-4">
        <Link
          href="/sinistros/novo"
          className="flex items-center justify-center gap-2 w-full text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
          style={{ backgroundColor: "#00bcb6" }}
        >
          <Plus className="w-4 h-4" />
          Novo Evento
        </Link>
      </div>

      <nav className="px-3 pb-4 flex-1">
        <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider px-3 mb-2">
          Navegação
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5",
                isActive
                  ? "font-semibold border-l-2"
                  : "text-[#64748b] hover:bg-[#f0fdfc]"
              )}
              style={
                isActive
                  ? { backgroundColor: "#f0fdfc", color: "#00a89e", borderColor: "#00bcb6" }
                  : undefined
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {gestorOuMaster && !master && (
        <nav className="px-3 pb-2 mt-2">
          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider px-3 mb-2">
            Gestão
          </p>
          <Link
            href="/usuarios"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5",
              pathname === "/usuarios" ? "text-white" : "hover:bg-[#f0fdfc]"
            )}
            style={
              pathname === "/usuarios"
                ? { backgroundColor: "#00bcb6" }
                : { color: "#00a89e" }
            }
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            Usuários
          </Link>
        </nav>
      )}

      {master && (
        <nav className="px-3 pb-2 mt-2">
          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider px-3 mb-2">
            Administração
          </p>
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5",
              pathname === "/admin" ? "text-white" : "hover:bg-[#f0fdfc]"
            )}
            style={
              pathname === "/admin"
                ? { backgroundColor: "#00bcb6" }
                : { color: "#00a89e" }
            }
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            Painel Master
          </Link>
          <Link
            href="/admin/usuarios"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5",
              pathname === "/admin/usuarios" ? "text-white" : "hover:bg-[#f0fdfc]"
            )}
            style={
              pathname === "/admin/usuarios"
                ? { backgroundColor: "#00bcb6" }
                : { color: "#00a89e" }
            }
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            Usuários
          </Link>
        </nav>
      )}

      <div className="mx-3 mb-4 p-3 rounded-lg" style={{ backgroundColor: "#f0fdfc", border: "1px solid #99ede9" }}>
        <p className="text-xs font-semibold mb-1" style={{ color: "#2e9c8f" }}>Plano Profissional</p>
        <p className="text-xs" style={{ color: "#00a89e" }}>Análises ilimitadas ativas</p>
      </div>
    </aside>
  )
}
