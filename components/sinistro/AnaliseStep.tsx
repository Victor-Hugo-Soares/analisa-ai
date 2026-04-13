"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface EtapaProcessamento {
  label: string
  duracao: number
}

const etapas: EtapaProcessamento[] = [
  { label: "Recebendo arquivos...", duracao: 500 },
  { label: "Transcrevendo áudio com Whisper AI...", duracao: 3000 },
  { label: "Analisando imagens com Vision AI...", duracao: 2500 },
  { label: "Processando documentos...", duracao: 1500 },
  { label: "Cruzando informações...", duracao: 1000 },
  { label: "Gerando análise com GPT-4o...", duracao: 4000 },
  { label: "Estruturando relatório...", duracao: 500 },
]

interface AnaliseStepProps {
  temAudio: boolean
  temImagens: boolean
  temDocumentos: boolean
  erro?: string | null
  onRetry?: () => void
}

export default function AnaliseStep({
  temAudio,
  temImagens,
  temDocumentos,
  erro,
  onRetry,
}: AnaliseStepProps) {
  const [etapaAtual, setEtapaAtual] = useState(0)
  const [progresso, setProgresso] = useState(0)

  const etapasFiltradas = etapas.filter((_, i) => {
    if (i === 0) return true
    if (i === 1) return temAudio
    if (i === 2) return temImagens
    if (i === 3) return temDocumentos
    return true
  })

  useEffect(() => {
    let etapa = 0
    const total = etapasFiltradas.length

    function avancar() {
      if (etapa >= total) return

      setEtapaAtual(etapa)
      setProgresso(Math.round((etapa / total) * 90))

      const duracao = etapasFiltradas[etapa].duracao

      setTimeout(() => {
        etapa++
        if (etapa < total) {
          avancar()
        } else {
          setProgresso(90)
        }
      }, duracao)
    }

    avancar()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (erro) {
    return (
      <div className="flex flex-col items-center text-center py-10">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-5">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-[#0f172a] mb-2">Falha na Análise</h2>
        <p className="text-[#64748b] text-sm mb-2 max-w-md">
          Ocorreu um erro ao processar a análise. Isso pode acontecer por timeout ou tamanho dos arquivos.
        </p>
        <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-6 max-w-md font-mono">
          {erro}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 bg-[#1a2744] hover:bg-[#243459] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center py-8">
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-[#1a2744]/10 rounded-full flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#1a2744] animate-spin" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#0f172a] mb-2">
        Analisando Evento
      </h2>
      <p className="text-[#64748b] text-sm mb-8 max-w-md">
        Nossa IA está processando todos os dados e evidências para gerar uma
        análise detalhada. Isso pode levar até 2 minutos.
      </p>

      <div className="w-full max-w-md mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#64748b]">Progresso</span>
          <span className="text-sm font-semibold text-[#1a2744]">
            {progresso}%
          </span>
        </div>
        <Progress value={progresso} className="h-2.5 bg-[#e2e8f0]" />
      </div>

      <div className="w-full max-w-md space-y-2">
        {etapasFiltradas.map((etapa, index) => {
          const isCompleted = index < etapaAtual
          const isActive = index === etapaAtual

          return (
            <div
              key={etapa.label}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all",
                isActive
                  ? "bg-[#1a2744] text-white"
                  : isCompleted
                  ? "bg-[#f0fdf4] text-[#15803d]"
                  : "bg-[#f8fafc] text-[#94a3b8]"
              )}
            >
              {isCompleted ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-current flex-shrink-0" />
              )}
              <span className="text-left">{etapa.label}</span>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-[#94a3b8] mt-6">
        Isso pode levar alguns segundos dependendo do tamanho dos arquivos
      </p>
    </div>
  )
}
