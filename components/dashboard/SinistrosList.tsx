"use client"

import Link from "next/link"
import { Car, MapPin, Calendar, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Sinistro, StatusSinistro, TipoEvento } from "@/lib/types"

interface SinistrosListProps {
  sinistros: Sinistro[]
}

const statusConfig: Record<
  StatusSinistro,
  { label: string; className: string }
> = {
  pendente: {
    label: "Pendente",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  em_analise: {
    label: "Em Análise",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  concluido: {
    label: "Concluído",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  suspeito: {
    label: "Suspeito",
    className: "bg-red-100 text-red-800 border-red-200",
  },
}

const tipoEventoLabel: Record<TipoEvento, string> = {
  colisao: "Colisão",
  roubo: "Roubo",
  furto: "Furto",
  natureza: "Evento da Natureza",
  vidros: "Vidros",
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function SinistrosList({ sinistros }: SinistrosListProps) {
  if (sinistros.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="w-12 h-12 text-[#94a3b8] mx-auto mb-3" />
        <p className="text-[#64748b] font-medium">Nenhum sinistro encontrado</p>
        <p className="text-sm text-[#94a3b8] mt-1">
          Clique em &ldquo;Novo Sinistro&rdquo; para começar
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#e2e8f0]">
      {sinistros.map((sinistro) => {
        const status = statusConfig[sinistro.status]
        return (
          <Link
            key={sinistro.id}
            href={`/sinistros/${sinistro.id}`}
            className="flex items-center gap-4 p-4 hover:bg-amber-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Car className="w-5 h-5 text-amber-600" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-[#0f172a] text-sm">
                  {sinistro.id}
                </span>
                <span className="text-[#94a3b8]">·</span>
                <span className="text-sm text-[#64748b]">
                  {tipoEventoLabel[sinistro.tipoEvento]}
                </span>
              </div>

              <p className="text-sm font-medium text-[#0f172a] truncate">
                {sinistro.dados.nomeSegurado}
              </p>

              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1 text-xs text-[#94a3b8]">
                  <Car className="w-3 h-3" />
                  {sinistro.dados.placa}
                </span>
                <span className="flex items-center gap-1 text-xs text-[#94a3b8]">
                  <MapPin className="w-3 h-3" />
                  {sinistro.dados.local}
                </span>
                <span className="flex items-center gap-1 text-xs text-[#94a3b8]">
                  <Calendar className="w-3 h-3" />
                  {formatDate(sinistro.criadoEm)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge
                className={`${status.className} border text-xs font-medium px-2.5 py-0.5`}
                variant="outline"
              >
                {status.label}
              </Badge>
              <ChevronRight className="w-4 h-4 text-[#94a3b8] group-hover:text-amber-500 transition-colors" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
