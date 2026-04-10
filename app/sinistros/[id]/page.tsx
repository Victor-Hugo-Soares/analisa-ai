"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, AlertCircle } from "lucide-react"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import ResultadoAnalise from "@/components/sinistro/ResultadoAnalise"
import { getSession, getSinistro } from "@/lib/storage"
import type { EmpresaSession, Sinistro } from "@/lib/types"

export default function SinistroPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [session, setSession] = useState<EmpresaSession | null>(null)
  const [sinistro, setSinistro] = useState<Sinistro | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s) {
      router.push("/login")
      return
    }
    setSession(s)

    const found = getSinistro(id)
    if (!found) {
      setNotFound(true)
    } else {
      setSinistro(found)
    }
    setLoading(false)
  }, [id, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-8 h-8 border-2 border-[#1a2744]/20 border-t-[#1a2744] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header session={session} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 min-w-0">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-white rounded-lg border border-transparent hover:border-[#e2e8f0] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-[#0f172a]">
                  Sinistro {id}
                </h1>
                <p className="text-sm text-[#64748b]">
                  {sinistro?.dados?.nomeSegurado ?? ""}
                </p>
              </div>
            </div>

            {notFound ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="w-12 h-12 text-[#94a3b8] mb-4" />
                <h2 className="text-lg font-semibold text-[#0f172a] mb-2">
                  Sinistro não encontrado
                </h2>
                <p className="text-[#64748b] text-sm mb-6">
                  O sinistro {id} não existe ou foi removido.
                </p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-[#1a2744] font-medium hover:underline text-sm"
                >
                  Voltar ao Dashboard
                </button>
              </div>
            ) : sinistro ? (
              <ResultadoAnalise sinistro={sinistro} />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
