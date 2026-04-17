import { Car, Siren, Search, CloudLightning, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TipoEvento } from "@/lib/types"

interface TipoEventoConfig {
  id: TipoEvento
  label: string
  description: string
  icon: React.ElementType
  color: string
}

const tipos: TipoEventoConfig[] = [
  {
    id: "colisao",
    label: "Colisão",
    description: "Batida, abalroamento ou capotamento",
    icon: Car,
    color: "text-blue-600",
  },
  {
    id: "roubo",
    label: "Roubo",
    description: "Subtração com violência ou grave ameaça",
    icon: Siren,
    color: "text-red-600",
  },
  {
    id: "furto",
    label: "Furto",
    description: "Subtração sem violência ou ameaça",
    icon: Search,
    color: "text-orange-600",
  },
  {
    id: "natureza",
    label: "Eventos da Natureza",
    description: "Granizo, enchente, vendaval, alagamento",
    icon: CloudLightning,
    color: "text-teal-600",
  },
  {
    id: "vidros",
    label: "Vidros",
    description: "Danos em para-brisa, janelas ou retrovisores",
    icon: Layers,
    color: "text-purple-600",
  },
]

interface TipoEventoStepProps {
  selected: TipoEvento | null
  onSelect: (tipo: TipoEvento) => void
}

export default function TipoEventoStep({
  selected,
  onSelect,
}: TipoEventoStepProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#0f172a] mb-1">
        Tipo de Evento
      </h2>
      <p className="text-[#64748b] text-sm mb-6">
        Selecione a categoria do evento a ser analisado
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tipos.map((tipo) => {
          const Icon = tipo.icon
          const isSelected = selected === tipo.id

          return (
            <button
              key={tipo.id}
              onClick={() => onSelect(tipo.id)}
              className={cn(
                "flex flex-col items-start p-5 rounded-xl border-2 text-left transition-all hover:shadow-sm cursor-pointer",
                isSelected
                  ? "border-[#1a2744] bg-[#1a2744]/5 shadow-sm"
                  : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
              )}
            >
              <div
                className={cn(
                  "p-2.5 rounded-lg mb-3",
                  isSelected ? "bg-[#1a2744]/10" : "bg-[#f1f5f9]"
                )}
              >
                <Icon
                  className={cn(
                    "w-6 h-6",
                    isSelected ? "text-[#1a2744]" : tipo.color
                  )}
                />
              </div>
              <p
                className={cn(
                  "font-semibold mb-1",
                  isSelected ? "text-[#1a2744]" : "text-[#0f172a]"
                )}
              >
                {tipo.label}
              </p>
              <p className="text-sm text-[#64748b] leading-snug">
                {tipo.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
