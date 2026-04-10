"use client"

import { useRouter } from "next/navigation"
import { Shield, LogOut, Bell, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
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
      <div className="flex items-center gap-2.5">
        <div className="bg-[#1a2744] p-1.5 rounded-lg">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-[#1a2744] tracking-tight">
          Analisa Aí
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#f59e0b] rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-[#e2e8f0]">
          <div className="w-8 h-8 bg-[#1a2744] rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-white">
              {session?.nome?.charAt(0) ?? "E"}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-[#0f172a] leading-tight max-w-[150px] truncate">
              {session?.nome ?? "Empresa"}
            </p>
            <p className="text-xs text-[#64748b] leading-tight max-w-[150px] truncate">
              {session?.email ?? ""}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-[#64748b]" />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Sair</span>
        </Button>
      </div>
    </header>
  )
}
