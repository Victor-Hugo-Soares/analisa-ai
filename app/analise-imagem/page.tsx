"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Upload, X, ScanSearch, ShieldCheck, ShieldAlert, ShieldX,
  ChevronDown, ChevronUp, ImageIcon, AlertTriangle, ArrowLeftRight, CheckCircle2, XCircle, MinusCircle,
} from "lucide-react"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import { getSession, getAccessToken } from "@/lib/storage"
import type { EmpresaSession } from "@/lib/types"
import type {
  ResultadoAnaliseImagem,
  ResultadoImagemIndividual,
  ResultadoComparacao,
  ChecklistItem,
} from "@/app/api/analyze-image/route"

interface ImagemLocal {
  id: string
  nome: string
  base64: string
  previewUrl: string
  tamanho: number
  papel?: "original" | "suspeita" // apenas no modo comparação
}

const MAX_IMAGENS = 10
const MAX_TAMANHO_MB = 10

export default function AnaliseImagemPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [session, setSession] = useState<EmpresaSession | null>(null)
  const [imagens, setImagens] = useState<ImagemLocal[]>([])
  const [contexto, setContexto] = useState("")
  const [modoComparacao, setModoComparacao] = useState(false)
  const [analisando, setAnalisando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoAnaliseImagem | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.push("/login"); return }
    setSession(s)
  }, [router])

  // Quando ativa o modo comparação com 2 imagens, atribui papéis automaticamente
  useEffect(() => {
    if (modoComparacao && imagens.length === 2) {
      setImagens((prev) => prev.map((img, i) => ({
        ...img,
        papel: i === 0 ? "original" : "suspeita",
      })))
    } else if (!modoComparacao) {
      setImagens((prev) => prev.map((img) => ({ ...img, papel: undefined })))
    }
  }, [modoComparacao, imagens.length])

  function toggleExpandido(chave: string) {
    setExpandidos((prev) => {
      const next = new Set(prev)
      if (next.has(chave)) next.delete(chave)
      else next.add(chave)
      return next
    })
  }

  function trocarPapeis() {
    setImagens((prev) => prev.map((img) => ({
      ...img,
      papel: img.papel === "original" ? "suspeita" : "original",
    })))
  }

  async function processarArquivos(files: FileList | File[]) {
    const lista = Array.from(files).filter(
      (f) => f.type.startsWith("image/") && f.size <= MAX_TAMANHO_MB * 1024 * 1024
    )
    const novas: ImagemLocal[] = []
    for (const file of lista) {
      if (imagens.length + novas.length >= MAX_IMAGENS) break
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })
      novas.push({
        id: crypto.randomUUID(),
        nome: file.name,
        base64,
        previewUrl: URL.createObjectURL(file),
        tamanho: file.size,
      })
    }
    setImagens((prev) => [...prev, ...novas])
  }

  function removerImagem(id: string) {
    setImagens((prev) => {
      const img = prev.find((i) => i.id === id)
      if (img) URL.revokeObjectURL(img.previewUrl)
      return prev.filter((i) => i.id !== id)
    })
  }

  async function analisar() {
    if (imagens.length === 0) return
    if (modoComparacao && imagens.length !== 2) {
      setErro("No modo comparação, selecione exatamente 2 imagens.")
      return
    }
    setAnalisando(true)
    setErro(null)
    setResultado(null)

    try {
      const token = getAccessToken()

      // No modo comparação, ordena para que "original" seja índice 0
      const imagensOrdenadas = modoComparacao
        ? [...imagens].sort((a) => (a.papel === "original" ? -1 : 1))
        : imagens

      const payload = {
        imagens: imagensOrdenadas.map((img) => ({ nome: img.nome, base64: img.base64 })),
        contexto: contexto.trim() || undefined,
        modo_comparacao: modoComparacao && imagens.length === 2,
        indice_original: 0,
      }

      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? "Erro ao analisar imagens.")
      }

      const data = (await res.json()) as ResultadoAnaliseImagem
      setResultado(data)
      // Expande tudo por padrão
      if (data.resultados) setExpandidos(new Set(data.resultados.map((r) => r.arquivo)))
      if (data.comparacao) setExpandidos(new Set(["comparacao"]))
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido.")
    } finally {
      setAnalisando(false)
    }
  }

  function limpar() {
    imagens.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    setImagens([])
    setContexto("")
    setResultado(null)
    setErro(null)
    setExpandidos(new Set())
    setModoComparacao(false)
  }

  const podeComparar = imagens.length === 2

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      <Header session={session} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 max-w-4xl">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <ScanSearch className="w-6 h-6" style={{ color: "#00bcb6" }} />
              <h1 className="text-2xl font-bold" style={{ color: "#0f172a" }}>Análise de Imagem</h1>
            </div>
            <p className="text-sm" style={{ color: "#64748b" }}>
              Verifique se uma imagem foi adulterada digitalmente antes de processar um evento.
            </p>
          </div>

          {!resultado ? (
            <div className="space-y-5">
              {/* Modo comparação toggle */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => {
                      if (!modoComparacao && !podeComparar) {
                        setErro("Adicione exatamente 2 imagens para usar o modo comparação.")
                        return
                      }
                      setErro(null)
                      setModoComparacao((v) => !v)
                    }}
                    className={`mt-0.5 w-10 h-6 rounded-full transition-colors flex-shrink-0 relative ${modoComparacao ? "bg-[#00bcb6]" : "bg-[#e2e8f0]"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${modoComparacao ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "#0f172a" }}>
                      <ArrowLeftRight className="w-4 h-4" style={{ color: "#00bcb6" }} />
                      Modo Comparação
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                      Envie o original + a imagem suspeita juntos. A IA compara as duas diretamente — muito mais preciso para detectar dano inserido digitalmente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${dragOver ? "border-[#00bcb6] bg-[#f0fdfc]" : "border-[#e2e8f0] bg-white hover:border-[#00bcb6] hover:bg-[#f0fdfc]"}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); processarArquivos(e.dataTransfer.files) }}
                onClick={() => inputRef.current?.click()}
              >
                <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => e.target.files && processarArquivos(e.target.files)} />
                <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "#00bcb6" }} />
                <p className="font-medium text-sm" style={{ color: "#0f172a" }}>
                  {modoComparacao ? "Adicione 2 imagens: original e suspeita" : "Arraste as imagens aqui ou clique para selecionar"}
                </p>
                <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                  JPG, PNG, WEBP · máx. {MAX_TAMANHO_MB} MB · {modoComparacao ? "exatamente 2 imagens" : `até ${MAX_IMAGENS} imagens`}
                </p>
              </div>

              {/* Thumbnails */}
              {imagens.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imagens.map((img) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-[#e2e8f0] bg-white aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.previewUrl} alt={img.nome} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <button
                        onClick={(e) => { e.stopPropagation(); removerImagem(img.id) }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {/* Badge de papel no modo comparação */}
                      {modoComparacao && img.papel && (
                        <div className={`absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${img.papel === "original" ? "bg-blue-500 text-white" : "bg-orange-500 text-white"}`}>
                          {img.papel === "original" ? "ORIGINAL" : "SUSPEITA"}
                        </div>
                      )}
                      <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 truncate">{img.nome}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Trocar papéis no modo comparação */}
              {modoComparacao && imagens.length === 2 && (
                <button
                  onClick={trocarPapeis}
                  className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f0fdfc] transition-colors"
                  style={{ color: "#00a89e" }}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Trocar papéis (original ↔ suspeita)
                </button>
              )}

              {/* Contexto */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
                <label className="block text-sm font-medium mb-2" style={{ color: "#0f172a" }}>
                  Contexto / suspeita (opcional)
                </label>
                <textarea
                  rows={3} value={contexto} onChange={(e) => setContexto(e.target.value)}
                  placeholder="Ex: Associado alega colisão traseira, mas a imagem parece editada. Placa FKP2J40."
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#00bcb6]"
                  style={{ color: "#0f172a" }}
                />
              </div>

              {erro && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {erro}
                </div>
              )}

              <button
                onClick={analisar}
                disabled={imagens.length === 0 || analisando || (modoComparacao && imagens.length !== 2)}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#00bcb6" }}
              >
                {analisando ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {modoComparacao ? "Comparando imagens..." : `Analisando ${imagens.length} imagem${imagens.length > 1 ? "ns" : ""}...`}</>
                ) : (
                  <><ScanSearch className="w-4 h-4" />
                    {modoComparacao ? "Comparar Imagens" : `Analisar ${imagens.length > 0 ? `${imagens.length} imagem${imagens.length > 1 ? "ns" : ""}` : "Imagens"}`}</>
                )}
              </button>
            </div>
          ) : (
            <ResultadoView
              resultado={resultado}
              imagens={imagens}
              expandidos={expandidos}
              onToggle={toggleExpandido}
              onLimpar={limpar}
            />
          )}
        </main>
      </div>
    </div>
  )
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function VeredictoBadge({ veredicto }: { veredicto: "AUTENTICA" | "SUSPEITA" | "ADULTERADA" }) {
  if (veredicto === "AUTENTICA")
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200"><ShieldCheck className="w-3.5 h-3.5" />Autêntica</span>
  if (veredicto === "SUSPEITA")
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200"><ShieldAlert className="w-3.5 h-3.5" />Suspeita</span>
  return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><ShieldX className="w-3.5 h-3.5" />Adulterada</span>
}

function ConfiancaBadge({ confianca }: { confianca: "ALTA" | "MEDIA" | "BAIXA" }) {
  return <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">Confiança {confianca.toLowerCase()}</span>
}

function ChecklistItemRow({ item }: { item: ChecklistItem }) {
  const config = {
    OK: { icon: <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />, bg: "bg-green-50", text: "text-green-700" },
    SUSPEITO: { icon: <ShieldAlert className="w-4 h-4 text-yellow-500 flex-shrink-0" />, bg: "bg-yellow-50", text: "text-yellow-700" },
    ADULTERADO: { icon: <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />, bg: "bg-red-50", text: "text-red-700" },
    "N/A": { icon: <MinusCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />, bg: "bg-slate-50", text: "text-slate-400" },
  }
  const c = config[item.resultado] ?? config["N/A"]
  return (
    <div className={`flex items-start gap-2.5 px-3 py-2 rounded-lg ${c.bg}`}>
      {c.icon}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${c.text}`}>{item.indicador}</p>
        <p className="text-xs text-slate-600 mt-0.5">{item.detalhe}</p>
      </div>
    </div>
  )
}

// ─── Resultado ────────────────────────────────────────────────────────────────

interface ResultadoViewProps {
  resultado: ResultadoAnaliseImagem
  imagens: ImagemLocal[]
  expandidos: Set<string>
  onToggle: (chave: string) => void
  onLimpar: () => void
}

function ResultadoView({ resultado, imagens, expandidos, onToggle, onLimpar }: ResultadoViewProps) {
  const previewMap = Object.fromEntries(imagens.map((img) => [img.nome, img.previewUrl]))

  const bgGeral = { AUTENTICA: "bg-green-50 border-green-200", SUSPEITA: "bg-yellow-50 border-yellow-200", ADULTERADA: "bg-red-50 border-red-200" }[resultado.veredicto_geral]
  const iconGeral = { AUTENTICA: <ShieldCheck className="w-6 h-6 text-green-600" />, SUSPEITA: <ShieldAlert className="w-6 h-6 text-yellow-600" />, ADULTERADA: <ShieldX className="w-6 h-6 text-red-600" /> }[resultado.veredicto_geral]

  return (
    <div className="space-y-5">
      {/* Veredicto geral */}
      <div className={`rounded-xl border p-5 ${bgGeral}`}>
        <div className="flex items-start gap-3">
          {iconGeral}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="font-bold text-base" style={{ color: "#0f172a" }}>Veredicto Geral:</h2>
              <VeredictoBadge veredicto={resultado.veredicto_geral} />
              {resultado.modo === "comparacao" && (
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium flex items-center gap-1">
                  <ArrowLeftRight className="w-3 h-3" /> Modo Comparação
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: "#334155" }}>{resultado.resumo}</p>
            <p className="text-sm font-medium mt-2" style={{ color: "#0f172a" }}>
              Recomendação: <span className="font-normal">{resultado.recomendacao}</span>
            </p>
          </div>
        </div>
      </div>

      {/* MODO COMPARAÇÃO */}
      {resultado.modo === "comparacao" && resultado.comparacao && (
        <ComparacaoCard
          comparacao={resultado.comparacao}
          previewMap={previewMap}
          expanded={expandidos.has("comparacao")}
          onToggle={() => onToggle("comparacao")}
        />
      )}

      {/* MODO INDIVIDUAL */}
      {resultado.modo === "individual" && resultado.resultados && (
        <div className="space-y-3">
          {resultado.resultados.map((r) => (
            <IndividualCard
              key={r.arquivo}
              resultado={r}
              preview={previewMap[r.arquivo]}
              expanded={expandidos.has(r.arquivo)}
              onToggle={() => onToggle(r.arquivo)}
            />
          ))}
        </div>
      )}

      <button
        onClick={onLimpar}
        className="w-full py-2.5 rounded-xl font-semibold text-sm border-2 transition-colors"
        style={{ borderColor: "#00bcb6", color: "#00bcb6" }}
      >
        Nova Análise
      </button>
    </div>
  )
}

function ComparacaoCard({ comparacao, previewMap, expanded, onToggle }: {
  comparacao: ResultadoComparacao
  previewMap: Record<string, string>
  expanded: boolean
  onToggle: () => void
}) {
  const previewOriginal = previewMap[comparacao.arquivo_original]
  const previewSuspeito = previewMap[comparacao.arquivo_suspeito]

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition-colors text-left" onClick={onToggle}>
        <div className="flex gap-1 flex-shrink-0">
          {previewOriginal
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={previewOriginal} alt="original" className="w-10 h-10 rounded object-cover border-2 border-blue-300" />
            : <div className="w-10 h-10 rounded bg-blue-50 border-2 border-blue-300 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-blue-400" /></div>
          }
          {previewSuspeito
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={previewSuspeito} alt="suspeita" className="w-10 h-10 rounded object-cover border-2 border-orange-300 -ml-3" />
            : <div className="w-10 h-10 rounded bg-orange-50 border-2 border-orange-300 -ml-3 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-orange-400" /></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: "#0f172a" }}>Análise comparativa</p>
          <div className="flex items-center gap-2 mt-0.5">
            <VeredictoBadge veredicto={comparacao.veredicto} />
            <ConfiancaBadge confianca={comparacao.confianca} />
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-slate-400" /> : <ChevronDown className="w-4 h-4 flex-shrink-0 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#f1f5f9] pt-3 space-y-4">
          <p className="text-sm" style={{ color: "#334155" }}>{comparacao.observacoes}</p>

          {comparacao.diferencas_detectadas.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#64748b" }}>Diferenças detectadas</p>
              <ul className="space-y-1">
                {comparacao.diferencas_detectadas.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#334155" }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {comparacao.areas_alteradas.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide text-orange-600">Áreas alteradas no veículo</p>
              <div className="flex flex-wrap gap-2">
                {comparacao.areas_alteradas.map((a, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function IndividualCard({ resultado, preview, expanded, onToggle }: {
  resultado: ResultadoImagemIndividual
  preview?: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition-colors text-left" onClick={onToggle}>
        {preview
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={preview} alt={resultado.arquivo} className="w-12 h-12 rounded-lg object-cover border border-[#e2e8f0] flex-shrink-0" />
          : <div className="w-12 h-12 rounded-lg bg-[#f0fdfc] border border-[#e2e8f0] flex items-center justify-center flex-shrink-0"><ImageIcon className="w-5 h-5" style={{ color: "#00bcb6" }} /></div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "#0f172a" }}>{resultado.arquivo}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <VeredictoBadge veredicto={resultado.veredicto} />
            <ConfiancaBadge confianca={resultado.confianca} />
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-slate-400" /> : <ChevronDown className="w-4 h-4 flex-shrink-0 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#f1f5f9] pt-3 space-y-4">
          <p className="text-sm" style={{ color: "#334155" }}>{resultado.observacoes}</p>

          {resultado.checklist.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#64748b" }}>Checklist forense</p>
              <div className="space-y-1.5">
                {resultado.checklist.map((item, i) => <ChecklistItemRow key={i} item={item} />)}
              </div>
            </div>
          )}

          {resultado.indicadores_fraude.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide text-red-600">Indicadores de adulteração</p>
              <ul className="space-y-1">
                {resultado.indicadores_fraude.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resultado.indicadores_autenticidade.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide text-green-600">Indicadores de autenticidade</p>
              <ul className="space-y-1">
                {resultado.indicadores_autenticidade.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
