"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Upload, X, ScanSearch, ShieldCheck, ShieldAlert, ShieldX,
  ChevronDown, ChevronUp, ImageIcon, AlertTriangle,
  CheckCircle2, XCircle, MinusCircle, Microscope, Info, Sliders, Video,
} from "lucide-react"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import { getSession, getAccessToken } from "@/lib/storage"
import type { EmpresaSession } from "@/lib/types"
import type {
  ResultadoAnaliseImagem,
  ResultadoImagemIndividual,
  ChecklistItem,
} from "@/app/api/analyze-image/route"
import { computeEla, type ElaResult } from "@/lib/ela"
import { useDarkMode } from "@/lib/useTheme"

interface VideoFrame {
  base64: string   // data:image/jpeg;base64,…
  time: number     // seconds in the video
  nome: string     // e.g. "video_frame_01_00m05s.jpg"
}

interface ImagemLocal {
  id: string
  nome: string
  base64: string       // for images: full image; for videos: first frame (thumbnail)
  previewUrl: string   // for images: blob URL; for videos: blob URL of the video file
  tamanho: number
  tipo: "imagem" | "video"
  frames?: VideoFrame[]  // only for video items
}

interface ElaState {
  computing: boolean
  result: ElaResult | null
  error: string | null
}

const MAX_IMAGENS = 10       // max media items in the upload list
const MAX_TAMANHO_MB = 10    // image limit
const MAX_VIDEO_MB = 100     // video limit
const FRAMES_POR_VIDEO = 3   // frames extracted per video

// ─── Helpers para detecção de tipo de arquivo ────────────────────────────────

const IMAGE_EXTS = /\.(jpe?g|png|webp|gif|bmp|avif)$/i
const VIDEO_EXTS = /\.(mp4|mov|webm|avi|mkv|m4v|3gp)$/i

function isImageFile(file: File) {
  return file.type.startsWith("image/") || IMAGE_EXTS.test(file.name)
}
function isVideoFile(file: File) {
  return file.type.startsWith("video/") || VIDEO_EXTS.test(file.name)
}

// ─── Video frame extraction (client-side) ─────────────────────────────────────

async function extractVideoFrames(file: File, count = FRAMES_POR_VIDEO): Promise<VideoFrame[]> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement("video")
    video.src = url
    video.muted = true
    video.playsInline = true
    video.preload = "metadata"

    const frames: VideoFrame[] = []
    let times: number[] = []
    let idx = 0
    let done = false

    function finish() {
      if (done) return
      done = true
      clearTimeout(watchdog)
      video.pause()
      video.src = ""
      URL.revokeObjectURL(url)
      resolve(frames)
    }

    // Safety: if nothing happens in 30 s, give up
    const watchdog = setTimeout(finish, 30_000)

    video.onerror = finish

    video.onloadedmetadata = () => {
      const d = video.duration
      if (!isFinite(d) || d <= 0) { finish(); return }
      // Distribute between 10% and 90% of the video to avoid black/transition frames
      times = Array.from({ length: count }, (_, i) =>
        d * (0.1 + (0.8 * i) / Math.max(count - 1, 1))
      )
      seekNext()
    }

    video.onseeked = () => {
      const canvas = document.createElement("canvas")
      const maxDim = 1280
      let w = video.videoWidth || 1280
      let h = video.videoHeight || 720
      if (w > maxDim || h > maxDim) {
        const r = Math.min(maxDim / w, maxDim / h)
        w = Math.round(w * r)
        h = Math.round(h * r)
      }
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0, w, h)
        const t = times[idx]
        const mins = Math.floor(t / 60).toString().padStart(2, "0")
        const secs = Math.floor(t % 60).toString().padStart(2, "0")
        const base = file.name.replace(/\.[^.]+$/, "")
        frames.push({
          base64: canvas.toDataURL("image/jpeg", 0.85),
          time: t,
          nome: `${base}_frame${String(idx + 1).padStart(2, "0")}_${mins}m${secs}s.jpg`,
        })
      }
      idx++
      if (idx >= times.length) finish()
      else seekNext()
    }

    function seekNext() {
      // Small delay to let the browser process the seek request
      setTimeout(() => { video.currentTime = times[idx] }, 50)
    }
  })
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AnaliseImagemPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [session, setSession] = useState<EmpresaSession | null>(null)
  const [itens, setItens] = useState<ImagemLocal[]>([])
  const [contexto, setContexto] = useState("")
  const [analisando, setAnalisando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoAnaliseImagem | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [dragOver, setDragOver] = useState(false)
  const [extraindoVideo, setExtraindoVideo] = useState(false)
  const isDark = useDarkMode()

  // ELA state (images only)
  const [modoEla, setModoEla] = useState(false)
  const [elaScale, setElaScale] = useState(15)
  const [elaQuality, setElaQuality] = useState(75)
  const [elaStates, setElaStates] = useState<Record<string, ElaState>>({})
  const [elaSelectedId, setElaSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.push("/login"); return }
    setSession(s)
  }, [router])

  // Auto-select first image (not video) when entering ELA mode
  useEffect(() => {
    if (modoEla && !elaSelectedId) {
      const primeiraImagem = itens.find((i) => i.tipo === "imagem")
      if (primeiraImagem) setElaSelectedId(primeiraImagem.id)
    }
    if (!modoEla) setElaSelectedId(null)
  }, [modoEla, itens, elaSelectedId])

  const runEla = useCallback(async (img: ImagemLocal, scale: number, quality: number) => {
    setElaStates((prev) => ({ ...prev, [img.id]: { computing: true, result: null, error: null } }))
    try {
      const result = await computeEla(img.previewUrl, { scale, quality: quality / 100 })
      setElaStates((prev) => ({ ...prev, [img.id]: { computing: false, result, error: null } }))
    } catch {
      setElaStates((prev) => ({ ...prev, [img.id]: { computing: false, result: null, error: "Falha ao processar ELA." } }))
    }
  }, [])

  useEffect(() => {
    if (!modoEla || !elaSelectedId) return
    const img = itens.find((i) => i.id === elaSelectedId)
    if (!img || img.tipo !== "imagem") return
    runEla(img, elaScale, elaQuality)
  }, [modoEla, elaSelectedId, elaScale, elaQuality, itens, runEla])

  function toggleExpandido(chave: string) {
    setExpandidos((prev) => {
      const next = new Set(prev)
      if (next.has(chave)) next.delete(chave)
      else next.add(chave)
      return next
    })
  }

  async function processarArquivos(files: FileList | File[]) {
    const novos: ImagemLocal[] = []
    const lista = Array.from(files)

    for (const file of lista) {
      if (itens.length + novos.length >= MAX_IMAGENS) break

      if (isImageFile(file) && file.size <= MAX_TAMANHO_MB * 1024 * 1024) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
        novos.push({
          id: crypto.randomUUID(),
          nome: file.name,
          base64,
          previewUrl: URL.createObjectURL(file),
          tamanho: file.size,
          tipo: "imagem",
        })
      } else if (isVideoFile(file) && file.size > MAX_VIDEO_MB * 1024 * 1024) {
        setErro(`O vídeo "${file.name}" excede o limite de ${MAX_VIDEO_MB} MB.`)
      } else if (isVideoFile(file)) {
        setExtraindoVideo(true)
        try {
          const frames = await extractVideoFrames(file)
          if (frames.length > 0) {
            novos.push({
              id: crypto.randomUUID(),
              nome: file.name,
              base64: frames[0].base64,
              previewUrl: URL.createObjectURL(file),
              tamanho: file.size,
              tipo: "video",
              frames,
            })
          } else {
            setErro(`Não foi possível extrair frames do vídeo "${file.name}". Tente converter para MP4 H.264.`)
          }
        } catch {
          setErro(`Erro ao processar vídeo "${file.name}".`)
        }
        setExtraindoVideo(false)
      }
    }

    setItens((prev) => [...prev, ...novos])
    if (modoEla && novos.some((n) => n.tipo === "imagem") && !elaSelectedId) {
      const primeira = novos.find((n) => n.tipo === "imagem")
      if (primeira) setElaSelectedId(primeira.id)
    }
  }

  function removerItem(id: string) {
    setItens((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((i) => i.id !== id)
    })
    setElaStates((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (elaSelectedId === id) setElaSelectedId(null)
  }

  async function analisar() {
    if (itens.length === 0) return
    setAnalisando(true)
    setErro(null)
    setResultado(null)

    try {
      const token = getAccessToken()

      // Expand videos into frames
      const todasImagens: Array<{ nome: string; base64: string }> = []
      for (const item of itens) {
        if (item.tipo === "imagem") {
          todasImagens.push({ nome: item.nome, base64: item.base64 })
        } else if (item.frames && item.frames.length > 0) {
          for (const frame of item.frames) {
            todasImagens.push({ nome: frame.nome, base64: frame.base64 })
          }
        }
      }

      // Cap at 10 (API limit)
      const imagensPayload = todasImagens.slice(0, 10)

      const temVideo = itens.some((i) => i.tipo === "video")
      const contextoFinal = [
        contexto.trim(),
        temVideo ? "Algumas imagens são frames extraídos de vídeos enviados pelo associado." : "",
      ].filter(Boolean).join(" ") || undefined

      const payload = {
        imagens: imagensPayload,
        contexto: contextoFinal,
        modo_comparacao: false,
      }

      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? "Erro ao analisar.")
      }

      const data = (await res.json()) as ResultadoAnaliseImagem
      setResultado(data)
      if (data.resultados) setExpandidos(new Set(data.resultados.map((r) => r.arquivo)))
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido.")
    } finally {
      setAnalisando(false)
    }
  }

  function limpar() {
    itens.forEach((i) => URL.revokeObjectURL(i.previewUrl))
    setItens([])
    setContexto("")
    setResultado(null)
    setErro(null)
    setExpandidos(new Set())
    setModoEla(false)
    setElaStates({})
    setElaSelectedId(null)
  }

  // Counts for UI
  const nImagens = itens.filter((i) => i.tipo === "imagem").length
  const nVideos = itens.filter((i) => i.tipo === "video").length
  const totalFrames = itens.filter((i) => i.tipo === "video").reduce((acc, i) => acc + (i.frames?.length ?? 0), 0)

  const botaoLabel = () => {
    if (itens.length === 0) return "Analisar com IA"
    const partes: string[] = []
    if (nImagens > 0) partes.push(`${nImagens} imagem${nImagens > 1 ? "ns" : ""}`)
    if (nVideos > 0) partes.push(`${nVideos} vídeo${nVideos > 1 ? "s" : ""} (${totalFrames} frames)`)
    return `Analisar ${partes.join(" + ")} com IA`
  }

  const elaAtual = elaSelectedId ? elaStates[elaSelectedId] : null
  const imagemElaAtual = elaSelectedId ? itens.find((i) => i.id === elaSelectedId) : null

  return (
    <div className="min-h-screen" style={{ backgroundColor: isDark ? "#0f172a" : "#f8fafc" }}>
      <Header session={session} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 max-w-4xl">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <ScanSearch className="w-6 h-6" style={{ color: "#00bcb6" }} />
              <h1 className="text-2xl font-bold" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>Análise de Imagem</h1>
            </div>
            <p className="text-sm" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              Verifique se uma imagem ou vídeo foi adulterado digitalmente antes de processar um evento.
            </p>
          </div>

          {!resultado ? (
            <div className="space-y-5">
              {/* ELA toggle */}
              <div className={`bg-white rounded-xl border p-4 transition-colors ${modoEla ? "border-[#00bcb6]" : "border-[#e2e8f0]"}`}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => {
                      const temImagens = itens.some((i) => i.tipo === "imagem")
                      if (!modoEla && !temImagens) {
                        setErro("Adicione ao menos uma imagem para usar a análise ELA. (ELA não é aplicável a vídeos.)")
                        return
                      }
                      setErro(null)
                      setModoEla((v) => !v)
                    }}
                    className={`mt-0.5 w-10 h-6 rounded-full transition-colors flex-shrink-0 relative ${modoEla ? "bg-[#00bcb6]" : "bg-[#e2e8f0]"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${modoEla ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>
                      <Microscope className="w-4 h-4" style={{ color: "#00bcb6" }} />
                      Análise ELA
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f0fdfc] text-[#00a89e] border border-[#b2f0ed]">FORENSE</span>
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                      Mapa de erro de compressão JPEG — áreas editadas ficam brilhantes no mapa térmico. Aplica-se apenas a imagens.
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
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*,video/mp4,video/quicktime,video/webm,video/x-msvideo,video/avi,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && processarArquivos(e.target.files)}
                />
                <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "#00bcb6" }} />
                <p className="font-medium text-sm" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>
                  Arraste imagens ou vídeos aqui, ou clique para selecionar
                </p>
                <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                  Imagens: JPG, PNG, WEBP · máx. {MAX_TAMANHO_MB} MB
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                  Vídeos: MP4, MOV, WEBM · máx. {MAX_VIDEO_MB} MB · {FRAMES_POR_VIDEO} frames extraídos por vídeo
                </p>
              </div>

              {/* Extracting indicator */}
              {extraindoVideo && (
                <div className="flex items-center gap-2 p-3 bg-[#f0fdfc] border border-[#b2f0ed] rounded-lg text-sm text-[#00a89e]">
                  <div className="w-4 h-4 border-2 border-[#00bcb6] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Extraindo frames do vídeo…
                </div>
              )}

              {/* Thumbnails */}
              {itens.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {itens.map((item) => {
                    const thumbnailSrc = item.tipo === "video" ? item.base64 : item.previewUrl
                    const isElaSelected = modoEla && elaSelectedId === item.id
                    const elaClickable = modoEla && item.tipo === "imagem"

                    return (
                      <div
                        key={item.id}
                        className={`relative group rounded-lg overflow-hidden border bg-white aspect-square transition-all ${
                          isElaSelected
                            ? "border-[#00bcb6] ring-2 ring-[#00bcb6]/40"
                            : "border-[#e2e8f0]"
                        } ${elaClickable ? "cursor-pointer" : "cursor-default"}`}
                        onClick={() => { if (elaClickable) setElaSelectedId(item.id) }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumbnailSrc} alt={item.nome} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <button
                          onClick={(e) => { e.stopPropagation(); removerItem(item.id) }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>

                        {/* Video badge */}
                        {item.tipo === "video" && (
                          <div className="absolute top-1 left-1 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white">
                            <Video className="w-2.5 h-2.5" />
                            {item.frames?.length ?? 0} frames
                          </div>
                        )}

                        {/* ELA selected badge */}
                        {isElaSelected && (
                          <div className="absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00bcb6] text-white">
                            ELA
                          </div>
                        )}

                        <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 truncate">{item.nome}</p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ELA Panel */}
              {modoEla && imagemElaAtual && imagemElaAtual.tipo === "imagem" && (
                <ElaPanel
                  imagem={imagemElaAtual}
                  elaState={elaAtual}
                  scale={elaScale}
                  quality={elaQuality}
                  onScaleChange={setElaScale}
                  onQualityChange={setElaQuality}
                />
              )}

              {/* Context */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
                <label className="block text-sm font-medium mb-2" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>
                  Contexto / suspeita (opcional)
                </label>
                <textarea
                  rows={3} value={contexto} onChange={(e) => setContexto(e.target.value)}
                  placeholder="Ex: Associado alega colisão traseira, mas a imagem parece editada. Placa FKP2J40."
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#00bcb6]"
                  style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
                />
              </div>

              {erro && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {erro}
                </div>
              )}

              <button
                onClick={analisar}
                disabled={itens.length === 0 || analisando || extraindoVideo}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#00bcb6" }}
              >
                {analisando ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analisando…</>
                ) : (
                  <><ScanSearch className="w-4 h-4" />
                    {botaoLabel()}</>
                )}
              </button>
            </div>
          ) : (
            <ResultadoView
              resultado={resultado}
              itens={itens}
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

// ─── ELA Panel ────────────────────────────────────────────────────────────────

function ElaPanel({
  imagem,
  elaState,
  scale,
  quality,
  onScaleChange,
  onQualityChange,
}: {
  imagem: ImagemLocal
  elaState: ElaState | null | undefined
  scale: number
  quality: number
  onScaleChange: (v: number) => void
  onQualityChange: (v: number) => void
}) {
  const isDark = useDarkMode()
  const [showInfo, setShowInfo] = useState(false)
  const [view, setView] = useState<"ela" | "original">("ela")

  const anomalyPct = elaState?.result
    ? (elaState.result.anomalyRatio * 100).toFixed(1)
    : null

  const riskLevel = elaState?.result
    ? elaState.result.anomalyRatio > 0.08 ? "ALTO"
      : elaState.result.anomalyRatio > 0.03 ? "MÉDIO"
      : "BAIXO"
    : null

  const riskColor = {
    ALTO: "text-red-600 bg-red-50 border-red-200",
    MÉDIO: "text-yellow-600 bg-yellow-50 border-yellow-200",
    BAIXO: "text-green-600 bg-green-50 border-green-200",
  }

  return (
    <div className="bg-white rounded-xl border border-[#00bcb6]/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#f0fdfc] border-b border-[#b2f0ed]">
        <div className="flex items-center gap-2">
          <Microscope className="w-4 h-4" style={{ color: "#00a89e" }} />
          <span className="text-sm font-semibold" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>
            Error Level Analysis — <span className="font-normal text-slate-500">{imagem.nome}</span>
          </span>
        </div>
        <button onClick={() => setShowInfo((v) => !v)} className="text-slate-400 hover:text-slate-600 transition-colors" title="O que é ELA?">
          <Info className="w-4 h-4" />
        </button>
      </div>

      {showInfo && (
        <div className="px-4 py-3 bg-slate-50 border-b border-[#e2e8f0] text-xs text-slate-600 space-y-1">
          <p><strong>Como funciona:</strong> A imagem é re-salva em JPEG com qualidade reduzida e a diferença pixel a pixel é amplificada.</p>
          <p><strong>Áreas brilhantes/quentes</strong> (ciano → amarelo → vermelho) indicam que aquela região foi editada mais recentemente e não se integrou ao nível de erro do restante.</p>
          <p><strong>Áreas escuras</strong> têm erro uniforme, característico de conteúdo original não adulterado.</p>
          <p className="text-slate-400">Funciona melhor em arquivos JPEG. PNG e WebP apresentam baseline mais alta de erro por não terem artefatos de compressão prévia.</p>
        </div>
      )}

      <div className="px-4 py-3 border-b border-[#f1f5f9] flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Amplificação <span className="text-[#00a89e] font-bold">×{scale}</span>
          </label>
          <input type="range" min={5} max={40} step={1} value={scale}
            onChange={(e) => onScaleChange(Number(e.target.value))}
            className="w-full accent-[#00bcb6] h-1.5" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5"><span>Sutil</span><span>Máximo</span></div>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Qualidade de re-save <span className="text-[#00a89e] font-bold">{quality}%</span>
          </label>
          <input type="range" min={50} max={95} step={5} value={quality}
            onChange={(e) => onQualityChange(Number(e.target.value))}
            className="w-full accent-[#00bcb6] h-1.5" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5"><span>+ sensível</span><span>– sensível</span></div>
        </div>
      </div>

      <div className="px-4 pt-3 flex gap-2">
        <button onClick={() => setView("ela")}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${view === "ela" ? "bg-[#00bcb6] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
          Mapa ELA
        </button>
        <button onClick={() => setView("original")}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${view === "original" ? "bg-[#00bcb6] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
          Imagem original
        </button>
      </div>

      <div className="px-4 pb-4 pt-3">
        {elaState?.computing ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-6 h-6 border-2 border-[#00bcb6] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Calculando ELA…</p>
          </div>
        ) : elaState?.error ? (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {elaState.error}
          </div>
        ) : elaState?.result ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={view === "ela" ? elaState.result.dataUrl : imagem.previewUrl}
              alt={view === "ela" ? "ELA map" : "Original"}
              className="w-full rounded-lg border border-[#e2e8f0] object-contain max-h-[420px]"
              style={{ backgroundColor: "#0d1117" }}
            />
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-slate-50 border border-[#e2e8f0] px-3 py-2 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Erro médio</p>
                <p className="text-sm font-bold text-slate-700">{elaState.result.meanError.toFixed(1)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-[#e2e8f0] px-3 py-2 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Erro máx.</p>
                <p className="text-sm font-bold text-slate-700">{elaState.result.maxError.toFixed(1)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-[#e2e8f0] px-3 py-2 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Anomalias</p>
                <p className="text-sm font-bold text-slate-700">{anomalyPct}%</p>
              </div>
            </div>
            {riskLevel && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${riskColor[riskLevel as keyof typeof riskColor]}`}>
                {riskLevel === "ALTO" ? <ShieldX className="w-3.5 h-3.5" /> : riskLevel === "MÉDIO" ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Risco de adulteração: {riskLevel}
                <span className="font-normal">
                  {riskLevel === "ALTO" ? " — regiões com erro elevado detectadas" : riskLevel === "MÉDIO" ? " — algumas anomalias presentes" : " — padrão de erro uniforme"}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <p className="text-[10px] text-slate-400 flex-shrink-0">Legenda:</p>
              <div className="flex-1 h-2 rounded-full" style={{ background: "linear-gradient(to right, #0d1117, #0ea5e9, #facc15, #ef4444)" }} />
              <div className="flex justify-between w-full max-w-[160px] text-[10px] text-slate-400">
                <span>Original</span><span>Suspeito</span><span>Adulterado</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-xs text-slate-400">
            Selecione uma imagem para ver o mapa ELA.
          </div>
        )}
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
  itens: ImagemLocal[]
  expandidos: Set<string>
  onToggle: (chave: string) => void
  onLimpar: () => void
}

function ResultadoView({ resultado, itens, expandidos, onToggle, onLimpar }: ResultadoViewProps) {
  const isDark = useDarkMode()
  // Build preview map: image name → thumbnail src
  const previewMap: Record<string, string> = {}
  for (const item of itens) {
    if (item.tipo === "imagem") {
      previewMap[item.nome] = item.previewUrl
    } else if (item.frames) {
      for (const frame of item.frames) {
        previewMap[frame.nome] = frame.base64
      }
    }
  }

  const bgGeral = { AUTENTICA: "bg-green-50 border-green-200", SUSPEITA: "bg-yellow-50 border-yellow-200", ADULTERADA: "bg-red-50 border-red-200" }[resultado.veredicto_geral]
  const iconGeral = {
    AUTENTICA: <ShieldCheck className="w-6 h-6 text-green-600" />,
    SUSPEITA: <ShieldAlert className="w-6 h-6 text-yellow-600" />,
    ADULTERADA: <ShieldX className="w-6 h-6 text-red-600" />,
  }[resultado.veredicto_geral]

  return (
    <div className="space-y-5">
      <div className={`rounded-xl border p-5 ${bgGeral}`}>
        <div className="flex items-start gap-3">
          {iconGeral}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="font-bold text-base" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>Veredicto Geral:</h2>
              <VeredictoBadge veredicto={resultado.veredicto_geral} />
            </div>
            <p className="text-sm" style={{ color: isDark ? "#cbd5e1" : "#334155" }}>{resultado.resumo}</p>
            <p className="text-sm font-medium mt-2" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>
              Recomendação: <span className="font-normal">{resultado.recomendacao}</span>
            </p>
          </div>
        </div>
      </div>

      {resultado.resultados && (
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

function IndividualCard({ resultado, preview, expanded, onToggle }: {
  resultado: ResultadoImagemIndividual
  preview?: string
  expanded: boolean
  onToggle: () => void
}) {
  const isDark = useDarkMode()
  const isVideoFrame = resultado.arquivo.includes("_frame")

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition-colors text-left" onClick={onToggle}>
        {preview
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={preview} alt={resultado.arquivo} className="w-12 h-12 rounded-lg object-cover border border-[#e2e8f0] flex-shrink-0" />
          : <div className="w-12 h-12 rounded-lg bg-[#f0fdfc] border border-[#e2e8f0] flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-5 h-5" style={{ color: "#00bcb6" }} />
            </div>
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {isVideoFrame && <Video className="w-3 h-3 text-slate-400 flex-shrink-0" />}
            <p className="text-sm font-medium truncate" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>{resultado.arquivo}</p>
          </div>
          <div className="flex items-center gap-2">
            <VeredictoBadge veredicto={resultado.veredicto} />
            <ConfiancaBadge confianca={resultado.confianca} />
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-slate-400" /> : <ChevronDown className="w-4 h-4 flex-shrink-0 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#f1f5f9] pt-3 space-y-4">
          <p className="text-sm" style={{ color: isDark ? "#cbd5e1" : "#334155" }}>{resultado.observacoes}</p>

          {resultado.checklist.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Checklist forense</p>
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
