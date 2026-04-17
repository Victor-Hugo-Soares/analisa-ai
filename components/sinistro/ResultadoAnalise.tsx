"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileDown,
  Info,
  Mic,
  ImageIcon,
  FileText,
  Video,
  ChevronDown,
  ChevronUp,
  Car,
  MapPin,
  Calendar,
  User,
  CreditCard,
  Clock,
  ShieldAlert,
  ArrowRight,
  Volume2,
  Eye,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { saveSinistro, fetchWithAuth, getAccessToken } from "@/lib/storage"
import type { Sinistro, StatusSinistro, Recomendacao, TipoEvento } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ResultadoAnaliseProps {
  sinistro: Sinistro
}

const recomendacaoConfig: Record<
  Recomendacao,
  {
    label: string
    icon: React.ElementType
    color: string
    bgColor: string
    borderColor: string
    textColor: string
  }
> = {
  APROVACAO_RECOMENDADA: {
    label: "Aprovação Recomendada",
    icon: CheckCircle2,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
  },
  INVESTIGACAO_NECESSARIA: {
    label: "Investigação Necessária",
    icon: AlertTriangle,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-800",
  },
  APROVACAO_COM_RESSALVAS: {
    label: "Aprovação com Ressalvas",
    icon: AlertTriangle,
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    textColor: "text-teal-800",
  },
  AGUARDAR_DOCUMENTOS: {
    label: "Aguardar Documentos",
    icon: Info,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
  },
  RECUSA_RECOMENDADA: {
    label: "Recusa Recomendada",
    icon: XCircle,
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
  },
}

const nivelRiscoBadge = {
  BAIXO: "bg-green-100 text-green-800 border-green-200",
  MEDIO: "bg-amber-100 text-amber-800 border-amber-200",
  ALTO: "bg-red-100 text-red-800 border-red-200",
  CRITICO: "bg-red-900 text-red-100 border-red-800",
}

const tipoEventoLabel: Record<TipoEvento, string> = {
  colisao: "Colisão",
  roubo: "Roubo",
  furto: "Furto",
  natureza: "Evento da Natureza",
  vidros: "Vidros",
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className,
  headerClassName,
  icon: Icon,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  headerClassName?: string
  icon?: React.ElementType
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn("border rounded-xl overflow-hidden", className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-sm transition-colors",
          headerClassName ?? "hover:bg-black/5"
        )}
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 opacity-70" />}
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 opacity-50 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
        )}
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="w-4 h-4 text-[#64748b] flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-[#94a3b8] leading-none mb-0.5">{label}</p>
        <p className="text-[#0f172a] font-medium">{value}</p>
      </div>
    </div>
  )
}


function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-green-500"
      : score >= 45
      ? "bg-amber-500"
      : "bg-red-500"

  const label =
    score >= 70
      ? "Confiável"
      : score >= 45
      ? "Atenção"
      : "Suspeito"

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[#64748b]">Score de Confiabilidade</span>
        <span className="text-sm font-bold text-[#0f172a]">
          {score}/100 — {label}
        </span>
      </div>
      <div className="h-2.5 bg-[#e2e8f0] rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Normaliza um item de momentos_alterados que pode ser string ou objeto
type MomentoItem =
  | string
  | { timestamp?: string; trecho?: string; tipo_alteracao?: string; analise?: string }

function renderMomentoText(m: MomentoItem): string {
  if (typeof m === "string") return m
  const parts: string[] = []
  if (m.timestamp) parts.push(m.timestamp)
  if (m.trecho) parts.push(`"${m.trecho}"`)
  if (m.analise) parts.push(`— ${m.analise}`)
  return parts.join(" ") || JSON.stringify(m)
}

// Normaliza padrão suspeito que pode ser string ou objeto
type PadraoItem =
  | string
  | { padrao?: string; evidencia?: string; interpretacao?: string }

function renderPadraoText(p: PadraoItem): string {
  if (typeof p === "string") return p
  const parts: string[] = []
  if (p.padrao) parts.push(p.padrao)
  if (p.evidencia) parts.push(`Evidência: "${p.evidencia}"`)
  if (p.interpretacao) parts.push(p.interpretacao)
  return parts.join(" — ") || JSON.stringify(p)
}

const tipoIcone = {
  audio: Mic,
  documento: FileText,
  imagem: ImageIcon,
  video: Video,
}

type DecisaoConfig = {
  status: StatusSinistro
  label: string
  placeholder: string
  cor: string
  icon: React.ElementType
}

const decisaoConfig: Record<string, DecisaoConfig> = {
  concluido: {
    status: "concluido",
    label: "Aprovar Evento",
    placeholder: "Ex: Documentação completa, danos consistentes com o relato, sem indícios de fraude. Score da IA alinhado com minha avaliação.",
    cor: "bg-green-600",
    icon: CheckCircle2,
  },
  aguardando_informacoes: {
    status: "aguardando_informacoes",
    label: "Solicitar Informações",
    placeholder: "Ex: Faltam fotos do local do sinistro. O BO foi registrado 48h após o evento sem justificativa. Aguardando laudo pericial.",
    cor: "bg-amber-500",
    icon: AlertTriangle,
  },
  suspeito: {
    status: "suspeito",
    label: "Recusar Evento",
    placeholder: "Ex: Rastreador inativo 3 dias antes do furto. Histórico de 2 sinistros similares nos últimos 12 meses. Relato inconsistente com o BO.",
    cor: "bg-red-600",
    icon: XCircle,
  },
}

export default function ResultadoAnalise({ sinistro }: ResultadoAnaliseProps) {
  const router = useRouter()
  const analise = sinistro.analise
  const [transcricaoExpandida, setTranscricaoExpandida] = useState(false)
  const [modalDecisao, setModalDecisao] = useState<DecisaoConfig | null>(null)
  const [motivoDecisao, setMotivoDecisao] = useState("")
  const [salvando, setSalvando] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  if (!analise) {
    return (
      <div className="text-center py-12 text-[#64748b]">
        Análise não disponível para este sinistro.
      </div>
    )
  }

  const rec = recomendacaoConfig[analise.recomendacao]
  const RecIcon = rec.icon

  function abrirModalDecisao(chave: string) {
    setMotivoDecisao("")
    setModalDecisao(decisaoConfig[chave])
    // foca o textarea após render
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  async function confirmarDecisao() {
    if (!modalDecisao || !motivoDecisao.trim()) return
    setSalvando(true)

    const { status } = modalDecisao

    // 1. Salva decisão localmente e no banco
    const updated: Sinistro = { ...sinistro, status }
    saveSinistro(updated)
    try {
      await fetchWithAuth(`/api/sinistros/${sinistro.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }, router)
    } catch (e) {
      console.error("Erro ao atualizar status no banco:", e)
    }

    // 2. Cria aprendizado pendente automaticamente com o motivo
    try {
      const token = getAccessToken()
      const statusLabel = modalDecisao.label
      const conteudo = `[DECISÃO: ${statusLabel}] ${motivoDecisao.trim()}`
      await fetch("/api/aprendizados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sinistro_id: sinistro.id, conteudo }),
      })
    } catch (e) {
      console.error("Erro ao salvar aprendizado:", e)
    }

    setSalvando(false)
    setModalDecisao(null)
    router.push("/dashboard")
  }

  // Ícone do modal — definido aqui para ser válido como componente JSX (letra maiúscula)
  const ModalIcon = modalDecisao?.icon ?? CheckCircle2

  const temLinhaDoTempo =
    Array.isArray(analise.linha_do_tempo) && analise.linha_do_tempo.length > 0
  const temIndicadoresFraude =
    Array.isArray(analise.indicadores_fraude) &&
    analise.indicadores_fraude.length > 0
  const temProximosPassos =
    Array.isArray(analise.proximos_passos) && analise.proximos_passos.length > 0
  const scoreConfiabilidade =
    typeof analise.score_confiabilidade === "number"
      ? analise.score_confiabilidade
      : null

  return (
    <>
    <div className="space-y-5">
      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          <strong>Importante:</strong> Esta análise foi gerada por IA e serve
          como auxílio ao analista. A decisão final deve ser tomada pelo
          analista responsável após verificação das informações.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Coluna esquerda ── */}
        <div className="space-y-4">
          {/* Dados do Evento */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-3">
              Dados do Evento
            </p>
            <div className="space-y-3">
              <InfoRow icon={User} label="Associado" value={sinistro.dados.nomeSegurado} />
              <InfoRow icon={CreditCard} label="CPF" value={sinistro.dados.cpf} />
              <InfoRow icon={Car} label="Placa" value={sinistro.dados.placa} />
              <InfoRow
                icon={Calendar}
                label="Data e Hora"
                value={formatDate(sinistro.dados.dataHora)}
              />
              <InfoRow icon={MapPin} label="Local" value={sinistro.dados.local} />
            </div>
          </div>

          {/* Tipo de Evento */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-3">
              Tipo de Evento
            </p>
            <Badge className="bg-[#1a2744]/10 text-[#1a2744] border-[#1a2744]/20 border font-medium">
              {tipoEventoLabel[sinistro.tipoEvento]}
            </Badge>
          </div>

          {/* Score de Confiabilidade */}
          {scoreConfiabilidade !== null && (
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-3 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Score da IA
              </p>
              <ScoreBar score={scoreConfiabilidade} />
            </div>
          )}

          {/* Arquivos */}
          {sinistro.arquivos.length > 0 && (
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-3">
                Arquivos Enviados
              </p>
              <div className="space-y-2">
                {sinistro.arquivos.map((arquivo) => {
                  const Icon = tipoIcone[arquivo.tipo]
                  const handleDownload = arquivo.storagePath
                    ? async () => {
                        try {
                          const res = await fetch(
                            `/api/sinistros/${sinistro.id}/download-url?path=${encodeURIComponent(arquivo.storagePath!)}`
                          )
                          const json = await res.json()
                          if (json.url) {
                            window.open(json.url, '_blank')
                          }
                        } catch {
                          // silencioso
                        }
                      }
                    : undefined

                  return (
                    <div
                      key={arquivo.nome}
                      onClick={handleDownload}
                      className={cn(
                        "flex items-center gap-2.5 text-sm rounded-lg px-2 py-1.5 -mx-2",
                        handleDownload
                          ? "cursor-pointer hover:bg-[#f1f5f9] transition-colors"
                          : "cursor-default"
                      )}
                      title={handleDownload ? "Clique para abrir o arquivo" : undefined}
                    >
                      <Icon className="w-4 h-4 text-[#64748b] flex-shrink-0" />
                      <span className={cn(
                        "flex-1 truncate",
                        handleDownload ? "text-[#2563eb] hover:underline" : "text-[#0f172a]"
                      )}>
                        {arquivo.nome}
                      </span>
                      <span className="text-xs text-[#94a3b8]">
                        {formatSize(arquivo.tamanho)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Relato */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">
              Relato do Associado
            </p>
            <p className="text-sm text-[#0f172a] leading-relaxed">
              {sinistro.dados.relato}
            </p>
          </div>
        </div>

        {/* ── Coluna direita ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recomendação Principal */}
          <div
            className={cn(
              "border rounded-xl p-5",
              rec.bgColor,
              rec.borderColor
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <RecIcon className={cn("w-6 h-6 flex-shrink-0", rec.color)} />
              <div>
                <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
                  Recomendação da IA
                </p>
                <p className={cn("font-bold text-lg leading-tight", rec.color)}>
                  {rec.label}
                </p>
              </div>
              <div className="ml-auto flex-shrink-0">
                <Badge
                  className={cn(
                    "border font-semibold",
                    nivelRiscoBadge[analise.nivel_risco]
                  )}
                  variant="outline"
                >
                  Risco {analise.nivel_risco}
                </Badge>
              </div>
            </div>
            <p className={cn("text-sm leading-relaxed", rec.textColor)}>
              {analise.justificativa_recomendacao}
            </p>
          </div>

          {/* Resumo Executivo */}
          <CollapsibleSection
            title="Resumo Executivo"
            className="border-[#e2e8f0] bg-white"
          >
            <p className="text-sm text-[#0f172a] leading-relaxed">
              {analise.resumo}
            </p>
          </CollapsibleSection>

          {/* Linha do Tempo */}
          {temLinhaDoTempo && (
            <CollapsibleSection
              title={`Linha do Tempo Reconstruída (${analise.linha_do_tempo.length} eventos)`}
              className="border-[#e2e8f0] bg-white"
              icon={Clock}
              defaultOpen={false}
            >
              <ol className="space-y-2 mt-1">
                {analise.linha_do_tempo?.map((evento, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1a2744]/10 flex items-center justify-center mt-0.5">
                      <span className="text-[10px] font-bold text-[#1a2744]">
                        {i + 1}
                      </span>
                    </div>
                    <span className="text-[#0f172a] leading-relaxed">{evento}</span>
                  </li>
                ))}
              </ol>
            </CollapsibleSection>
          )}

          {/* Pontos Favoráveis */}
          {(analise.pontos_verdadeiros?.length ?? 0) > 0 && (
            <CollapsibleSection
              title={`Pontos Favoráveis (${analise.pontos_verdadeiros.length})`}
              className="border-green-200 bg-green-50"
              icon={CheckCircle2}
            >
              <ul className="space-y-2">
                {analise.pontos_verdadeiros?.map((ponto, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-green-800 leading-relaxed">{ponto}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Pontos de Atenção */}
          {(analise.pontos_atencao?.length ?? 0) > 0 && (
            <CollapsibleSection
              title={`Pontos de Atenção (${analise.pontos_atencao.length})`}
              className="border-amber-200 bg-amber-50"
              icon={AlertTriangle}
            >
              <ul className="space-y-2">
                {analise.pontos_atencao?.map((ponto, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-amber-800 leading-relaxed">{ponto}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Contradições */}
          {(analise.contradicoes?.length ?? 0) > 0 && (
            <CollapsibleSection
              title={`Contradições Identificadas (${analise.contradicoes.length})`}
              className="border-red-200 bg-red-50"
              icon={XCircle}
            >
              <ul className="space-y-2">
                {analise.contradicoes?.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-red-800 leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Indicadores de Fraude */}
          {temIndicadoresFraude && (
            <CollapsibleSection
              title={`Indicadores de Fraude (${analise.indicadores_fraude.length})`}
              className="border-red-300 bg-red-50"
              icon={ShieldAlert}
            >
              <div className="mb-2 px-3 py-2 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700 font-medium">
                  ⚠️ Red flags específicos que podem indicar fraude. Verifique
                  cuidadosamente antes de qualquer decisão.
                </p>
              </div>
              <ul className="space-y-2 mt-2">
                {analise.indicadores_fraude?.map((ind, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-red-900 leading-relaxed font-medium">
                      {ind}
                    </span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Análise da Ligação */}
          {analise.analise_audio && (
            <CollapsibleSection
              title="Análise da Ligação"
              className="border-blue-200 bg-blue-50"
              icon={Volume2}
            >
              <div className="space-y-4">
                {/* Resumo */}
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                    Resumo da Transcrição
                  </p>
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {analise.analise_audio.transcricao_resumo}
                  </p>
                </div>

                <Separator className="bg-blue-200" />

                {/* Tom de Voz */}
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                    Tom de Voz
                  </p>
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {analise.analise_audio.tom_voz}
                  </p>
                </div>

                {/* Perfil Emocional */}
                {analise.analise_audio.perfil_emocional && (
                  <>
                    <Separator className="bg-blue-200" />
                    <div>
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                        Perfil Emocional
                      </p>
                      <p className="text-sm text-blue-900 leading-relaxed">
                        {analise.analise_audio.perfil_emocional}
                      </p>
                    </div>
                  </>
                )}

                {/* Momentos Alterados */}
                {(analise.analise_audio.momentos_alterados?.length ?? 0) > 0 && (
                  <>
                    <Separator className="bg-blue-200" />
                    <div>
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
                        Momentos de Alteração Vocal
                      </p>
                      <ul className="space-y-2">
                        {(analise.analise_audio.momentos_alterados as MomentoItem[]).map((m, i) => (
                          <li
                            key={i}
                            className="text-sm text-blue-900 bg-blue-100/60 rounded-lg px-3 py-2.5"
                          >
                            <div className="flex items-start gap-2">
                              <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                              <span className="leading-relaxed font-mono text-xs bg-blue-200/60 px-1.5 py-0.5 rounded mr-1">
                                {typeof m === "object" && m.timestamp ? m.timestamp : ""}
                              </span>
                            </div>
                            {typeof m === "object" && m.trecho && (
                              <p className="text-xs text-blue-700 italic mt-1 ml-5 border-l-2 border-blue-300 pl-2">
                                &ldquo;{m.trecho}&rdquo;
                              </p>
                            )}
                            <p className="mt-1 ml-5 leading-relaxed">
                              {typeof m === "object"
                                ? (m.analise ?? renderMomentoText(m))
                                : m}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* Padrões Suspeitos */}
                {(analise.analise_audio.padroes_suspeitos?.length ?? 0) > 0 && (
                  <>
                    <Separator className="bg-blue-200" />
                    <div>
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
                        Padrões Linguísticos Suspeitos
                      </p>
                      <ul className="space-y-2">
                        {(analise.analise_audio.padroes_suspeitos as PadraoItem[]).map((p, i) => (
                          <li
                            key={i}
                            className="text-sm text-amber-900 bg-amber-50/80 rounded-lg px-3 py-2.5"
                          >
                            {typeof p === "object" ? (
                              <>
                                {p.padrao && (
                                  <p className="font-semibold text-amber-800 mb-1">
                                    {p.padrao}
                                  </p>
                                )}
                                {p.evidencia && (
                                  <p className="text-xs italic text-amber-700 border-l-2 border-amber-400 pl-2 mb-1">
                                    &ldquo;{p.evidencia}&rdquo;
                                  </p>
                                )}
                                {p.interpretacao && (
                                  <p className="text-xs text-amber-800 leading-relaxed">
                                    {p.interpretacao}
                                  </p>
                                )}
                              </>
                            ) : (
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{renderPadraoText(p)}</span>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* Contradições com Relato */}
                {(analise.analise_audio.contradicoes_com_relato?.length ?? 0) > 0 && (
                  <>
                    <Separator className="bg-blue-200" />
                    <div>
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
                        Contradições com o Relato Escrito
                      </p>
                      <ul className="space-y-1.5">
                        {analise.analise_audio.contradicoes_com_relato?.map(
                          (c, i) => (
                            <li
                              key={i}
                              className="text-sm text-red-800 flex items-start gap-2 bg-red-50 rounded-lg px-3 py-2"
                            >
                              <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{c}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </>
                )}

                {/* Transcrição Completa */}
                {analise.analise_audio.transcricao_completa && (
                  <>
                    <Separator className="bg-blue-200" />
                    <div>
                      <button
                        onClick={() =>
                          setTranscricaoExpandida(!transcricaoExpandida)
                        }
                        className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider hover:text-blue-900 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {transcricaoExpandida
                          ? "Ocultar Transcrição Completa"
                          : "Ver Transcrição Completa"}
                        {transcricaoExpandida ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                      {transcricaoExpandida && (
                        <div className="mt-2 p-3 bg-white/70 rounded-lg border border-blue-200">
                          <pre className="text-xs text-blue-900 whitespace-pre-wrap leading-relaxed font-mono">
                            {analise.analise_audio.transcricao_completa}
                          </pre>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Análise das Imagens */}
          {analise.analise_imagens && (
            <CollapsibleSection
              title="Análise das Imagens"
              className="border-purple-200 bg-purple-50"
              icon={Eye}
            >
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
                    O Que Foi Identificado
                  </p>
                  <p className="text-sm text-purple-900 leading-relaxed">
                    {analise.analise_imagens.descricao}
                  </p>
                </div>

                <Separator className="bg-purple-200" />

                <div>
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
                    Consistência com o Relato
                  </p>
                  <p className="text-sm text-purple-900 leading-relaxed">
                    {analise.analise_imagens.consistencia_relato}
                  </p>
                </div>

                {analise.analise_imagens.indicadores_autenticidade && (
                  <>
                    <Separator className="bg-purple-200" />
                    <div>
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
                        Autenticidade das Imagens
                      </p>
                      <p className="text-sm text-purple-900 leading-relaxed">
                        {analise.analise_imagens.indicadores_autenticidade}
                      </p>
                    </div>
                  </>
                )}

                {(analise.analise_imagens.observacoes?.length ?? 0) > 0 && (
                  <>
                    <Separator className="bg-purple-200" />
                    <div>
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-2">
                        Observações Técnicas
                      </p>
                      <ul className="space-y-1.5">
                        {analise.analise_imagens.observacoes?.map((o, i) => (
                          <li
                            key={i}
                            className="text-sm text-purple-900 flex items-start gap-2"
                          >
                            <span className="text-purple-400 mt-0.5">•</span>
                            <span className="leading-relaxed">{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </CollapsibleSection>
          )}


          {/* Próximos Passos */}
          {temProximosPassos && (
            <CollapsibleSection
              title={`Próximos Passos Recomendados (${analise.proximos_passos.length})`}
              className="border-[#1a2744]/20 bg-[#1a2744]/5"
              icon={ArrowRight}
            >
              <ol className="space-y-2">
                {analise.proximos_passos?.map((passo, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1a2744] flex items-center justify-center mt-0.5">
                      <span className="text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                    </div>
                    <span className="text-[#0f172a] leading-relaxed">{passo}</span>
                  </li>
                ))}
              </ol>
            </CollapsibleSection>
          )}

          {/* Decisão do Analista */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
            <h3 className="font-semibold text-[#0f172a] mb-1">
              Decisão do Analista
            </h3>
            <p className="text-xs text-[#64748b] mb-3">
              Após revisar a análise completa, registre sua decisão:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => abrirModalDecisao("concluido")}
                className="bg-green-600 hover:bg-green-700 text-white gap-2 flex-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                Aprovar Evento
              </Button>
              <Button
                onClick={() => abrirModalDecisao("aguardando_informacoes")}
                className="bg-amber-500 hover:bg-amber-600 text-white gap-2 flex-1"
              >
                <AlertTriangle className="w-4 h-4" />
                Solicitar Informações
              </Button>
              <Button
                onClick={() => abrirModalDecisao("suspeito")}
                className="bg-red-600 hover:bg-red-700 text-white gap-2 flex-1"
              >
                <XCircle className="w-4 h-4" />
                Recusar Evento
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-[#e2e8f0] text-[#64748b]"
                onClick={() => window.print()}
              >
                <FileDown className="w-4 h-4" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Modal de decisão com motivo obrigatório */}
    {modalDecisao && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          {/* Header */}
          <div className={cn("rounded-t-2xl px-6 py-4 flex items-center gap-3", modalDecisao.cor)}>
            <ModalIcon className="w-5 h-5 text-white flex-shrink-0" />
            <h2 className="text-white font-semibold text-base">{modalDecisao.label}</h2>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <p className="text-sm text-[#0f172a] font-medium mb-1">
              Qual o motivo desta decisão?
            </p>
            <p className="text-xs text-[#64748b] mb-3">
              Sua justificativa será usada para treinar a IA e melhorar futuras análises.
            </p>
            <textarea
              ref={textareaRef}
              value={motivoDecisao}
              onChange={e => setMotivoDecisao(e.target.value)}
              placeholder={modalDecisao.placeholder}
              rows={4}
              className="w-full text-sm border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20 focus:border-[#1a2744] resize-none"
            />
            <p className="text-xs text-[#94a3b8] mt-1.5">
              {motivoDecisao.trim().length}/500 caracteres
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 flex gap-2 justify-end">
            <Button
              variant="outline"
              className="border-[#e2e8f0] text-[#64748b]"
              onClick={() => setModalDecisao(null)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarDecisao}
              disabled={!motivoDecisao.trim() || salvando}
              className={cn("text-white gap-2", modalDecisao.cor, "hover:opacity-90")}
            >
              {salvando ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <ModalIcon className="w-4 h-4" />
                  Confirmar {modalDecisao.label}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
