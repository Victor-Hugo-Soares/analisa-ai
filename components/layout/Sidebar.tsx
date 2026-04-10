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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { isMaster } from "@/lib/storage"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Sinistros", href: "/sinistros", icon: FileText },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [master, setMaster] = useState(false)

  useEffect(() => {
    setMaster(isMaster())
  }, [])

  return (
    <aside className="w-64 bg-white border-r border-[#e2e8f0] min-h-[calc(100vh-4rem)] hidden md:flex flex-col">
      <div className="p-4">
        <Link
          href="/sinistros/novo"
          className="flex items-center justify-center gap-2 w-full bg-[#1a2744] hover:bg-[#243459] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Sinistro
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
                  ? "bg-[#1a2744] text-white"
                  : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {master && (
        <nav className="px-3 pb-2 mt-2">
          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider px-3 mb-2">
            Administração
          </p>
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5",
              pathname === "/admin"
                ? "bg-amber-500 text-white"
                : "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            )}
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            Painel Master
          </Link>
        </nav>
      )}

      <div className="mx-3 mb-4 p-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg">
        <p className="text-xs font-semibold text-[#15803d] mb-1">Plano Profissional</p>
        <p className="text-xs text-[#166534]">
          Análises ilimitadas ativas
        </p>
      </div>
    </aside>
  )
}
