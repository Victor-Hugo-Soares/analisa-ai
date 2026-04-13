"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogOut, Bell } from "lucide-react"
import { clearSession } from "@/lib/storage"
import type { EmpresaSession } from "@/lib/types"

interface HeaderProps {
  session: EmpresaSession | null
}

export default function Header({ session }: HeaderProps) {
  const router = useRouter()

  function handleLogout() {
    clearSession()
    router.push("/login")
  }

  return (
    <header className="bg-white border-b border-[#e2e8f0] h-16 flex items-center px-6 gap-4 sticky top-0 z-50">
      <Link href="/dashboard" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
        <span className="text-lg font-bold leading-none" style={{ color: "#00bcb6" }}>Loma</span>
        <span className="text-sm font-medium text-[#64748b] leading-none hidden sm:inline">Proteção Veicular</span>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-[#94a3b8] hover:text-[#1a2744] hover:bg-[#f1f5f9] rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: "#00bcb6" }} />
        </button>

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
