"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
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
    <header className="bg-[#1a2744] h-16 flex items-center px-6 gap-4 sticky top-0 z-50">
      <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
        <Image src="/favicon.png" alt="" width={26} height={26} priority />
        <span className="text-white font-bold text-lg tracking-tight">IAnalista</span>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-white/15">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {session?.nome?.charAt(0)?.toUpperCase() ?? "E"}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-white leading-tight max-w-[150px] truncate">
              {session?.nome ?? "Empresa"}
            </p>
            <p className="text-xs text-white/50 leading-tight max-w-[150px] truncate">
              {session?.email ?? ""}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors ml-1"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
