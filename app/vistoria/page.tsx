"use client"

import { useState, useEffect, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"
import {
  Upload, X, CheckCircle2, XCircle, AlertTriangle,
  ClipboardCheck, Car, FileText, RefreshCw, ImageIcon,
} from "lucide-react"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import { getSession, getAccessToken } from "@/lib/storage"
import type { EmpresaSession } from "@/lib/types"

interface ArquivoLocal {
  id: string
  nome: string
  tipo: "documento" | "imagem"
  base64: string
  tamanho: number
}

interface FotoRepetir {
  nome: string
  motivo: string
}

interface DadosExtraidos {
  associado?: string
  cpf?: string
  placa?: string
  chassi?: string
  modelo?: string
  ano?: string
  km?: string
  cambio?: string
  gnv?: boolean
  acessorios?: string[]
}

interface VistoriaAnalise {
  veredicto: "Aprovada" | "Não Aprovada" | "Repetir Foto"
  fotos_repetir: FotoRepetir[]
  dados_extraidos: DadosExtraidos
  pontos_aprovados: string[]
  pontos_atencao: string[]
  alertas: string[]
  resumo: string
}

interface VistoriaResult {
  id: string | null
  protocolo: string
  veredicto: "Aprovada" | "Não Aprovada" | "Repetir Foto"
  analise: VistoriaAnalise
  criado_em: string
}

interface VistoriaRecord {
  id: string
  protocolo: string
  associado_nome: string | null
  placa: string | null
  veiculo_modelo: string | null
  veiculo_ano: string | null
  veredicto: string
  criado_em: string
}

const MAX_SIZE_MB = 15

const VEREDICTO_CONFIG = {
  "Aprovada": {
    color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0",
    Icon: CheckCircle2, label: "APROVADA",
  },
  "Não Aprovada": {
    color: "#dc2626", bg: "#fef2f2", border: "#fecaca",
    Icon: XCircle, label: "NÃO APROVADA",
  },
  "Repetir Foto": {
    color: "#d97706", bg: "#fffbeb", border: "#fde68a",
    Icon: RefreshCw, label: "REPETIR FOTO",
  },
}

export default function VistoriaPage() {
  const router = useRouter()
  const [session, setSession] = useState<EmpresaSession | null>(null)
  const [arquivos, setArquivos] = useState<ArquivoLocal[]>([])
  const [analisando, setAnalisando] = useState(false)
  const [resultado, setResultado] = useState<VistoriaResult | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [historico, setHistorico] = useState<VistoriaRecord[]>([])

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace("/login"); return }
    setSession(s)
    carregarHistorico()
  }, [router])

  async function carregarHistorico() {
    try {
      const token = getAccessToken()
      const res = await fetch("/api/vistoria", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return
      const data = await res.json()
      setHistorico(data.vistorias ?? [])
    } catch { /* silent */ }
  }

  const onDrop = useCallback(
    (accepted: File[]) => {
      accepted.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const base64 = e.target?.result as string
          const isPdf =
            file.type === "application/pdf" ||
            file.name.toLowerCase().endsWith(".pdf")
          setArquivos((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              nome: file.name,
              tipo: isPdf ? "documento" : "imagem",
              base64,
              tamanho: file.size,
            },
          ])
        }
        reader.readAsDataURL(file)
      })
    },
    []
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: MAX_SIZE_MB * 1024 * 1024,
    multiple: true,
  })

  function remover(id: string) {
    setArquivos((prev) => prev.filter((a) => a.id !== id))
  }

  function limpar() {
    setArquivos([])
    setResultado(null)
    setErro(null)
  }

  async function analisar() {
    if (!arquivos.length || !session?.id) return
    setAnalisando(true)
    setErro(null)
    setResultado(null)

    try {
      const token = getAccessToken()
      const res = await fetch("/api/vistoria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          arquivos: arquivos.map((a) => ({
            nome: a.nome,
            tipo: a.tipo,
            base64: a.base64,
          })),
          empresaId: session.id,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? "Erro na análise")
      setResultado(data.vistoria)
      carregarHistorico()
    } catch (e) {
      setErro(String(e))
    } finally {
      setAnalisando(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      <Header session={session} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6" style={{ maxWidth: "900px" }}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ color: "#1a2744" }}>
              Análise de Vistoria
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Suba o laudo PDF e/ou as fotos do veículo para análise automática de pré-cadastro
            </p>
          </div>

          {/* Upload */}
          <div
            className="rounded-xl border p-6 mb-6"
            style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
          >
            <div
              {...getRootProps()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
              style={{
                borderColor: isDragActive ? "#0f766e" : "#e2e8f0",
                backgroundColor: isDragActive ? "#f0fdfc" : "transparent",
              }}
            >
              <input {...getInputProps()} />
              <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "#94a3b8" }} />
              <p className="font-medium" style={{ color: "#1a2744" }}>
                {isDragActive
                  ? "Solte os arquivos aqui"
                  : "Arraste o laudo PDF ou as fotos do veículo"}
              </p>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                PDF, JPG, PNG, WEBP · Máx. {MAX_SIZE_MB}MB por arquivo
              </p>
            </div>

            {arquivos.length > 0 && (
              <div className="mt-4 space-y-2">
                {arquivos.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ backgroundColor: "#f8fafc" }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {a.tipo === "documento" ? (
                        <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "#0f766e" }} />
                      ) : (
                        <ImageIcon className="w-4 h-4 flex-shrink-0" style={{ color: "#0f766e" }} />
                      )}
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: "#1a2744" }}
                      >
                        {a.nome}
                      </span>
                      <span className="text-xs flex-shrink-0" style={{ color: "#94a3b8" }}>
                        {(a.tamanho / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    <button
                      onClick={() => remover(a.id)}
                      className="ml-2 flex-shrink-0 transition-colors"
                      style={{ color: "#94a3b8" }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={analisar}
                disabled={!arquivos.length || analisando}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#0f766e" }}
              >
                <ClipboardCheck className="w-4 h-4" />
                {analisando ? "Analisando..." : "Analisar Vistoria"}
              </button>
              {arquivos.length > 0 && (
                <button
                  onClick={limpar}
                  className="px-4 py-2.5 rounded-lg text-sm transition-colors"
                  style={{ color: "#64748b" }}
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {analisando && (
            <div
              className="rounded-xl border p-8 mb-6 text-center"
              style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
            >
              <div
                className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4"
                style={{ borderColor: "#0f766e", borderTopColor: "transparent" }}
              />
              <p className="font-semibold" style={{ color: "#1a2744" }}>
                Analisando vistoria...
              </p>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                Isso leva alguns segundos
              </p>
            </div>
          )}

          {/* Error */}
          {erro && (
            <div
              className="rounded-xl border p-4 mb-6 flex items-start gap-3"
              style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca" }}
            >
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#dc2626" }} />
              <p className="text-sm" style={{ color: "#991b1b" }}>
                {erro}
              </p>
            </div>
          )}

          {/* Result */}
          {resultado && <VistoriaResultado resultado={resultado} />}

          {/* History */}
          {historico.length > 0 && (
            <div
              className="rounded-xl border p-6"
              style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
            >
              <h2 className="text-base font-semibold mb-4" style={{ color: "#1a2744" }}>
                Vistorias Recentes
              </h2>
              <div className="space-y-0">
                {historico.map((v) => {
                  const cfg =
                    VEREDICTO_CONFIG[v.veredicto as keyof typeof VEREDICTO_CONFIG]
                  return (
                    <div
                      key={v.id}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                      style={{ borderColor: "#f1f5f9" }}
                    >
                      <div className="flex items-center gap-3">
                        <Car className="w-4 h-4" style={{ color: "#94a3b8" }} />
                        <div>
                          <p className="text-sm font-medium" style={{ color: "#1a2744" }}>
                            {v.associado_nome ?? "—"} · {v.placa ?? "Sem placa"}
                          </p>
                          <p className="text-xs" style={{ color: "#94a3b8" }}>
                            {v.protocolo}
                            {v.veiculo_modelo ? ` · ${v.veiculo_modelo}` : ""}
                            {v.veiculo_ano ? ` ${v.veiculo_ano}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {cfg && (
                          <span
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{ color: cfg.color, backgroundColor: cfg.bg }}
                          >
                            {v.veredicto}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: "#94a3b8" }}>
                          {new Date(v.criado_em).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function VistoriaResultado({ resultado }: { resultado: VistoriaResult }) {
  const analise = resultado.analise
  const cfg = VEREDICTO_CONFIG[analise.veredicto] ?? VEREDICTO_CONFIG["Aprovada"]
  const { Icon } = cfg
  const dados = analise.dados_extraidos

  return (
    <div className="space-y-4 mb-6">
      {/* Verdict */}
      <div
        className="rounded-xl p-6 border-2"
        style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
      >
        <div className="flex items-start gap-3">
          <Icon className="w-8 h-8 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
          <div className="flex-1">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: cfg.color }}
            >
              Resultado da Vistoria
            </p>
            <p className="text-2xl font-bold" style={{ color: cfg.color }}>
              {cfg.label}
            </p>
          </div>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            {resultado.protocolo}
          </p>
        </div>
        <p className="text-sm mt-3" style={{ color: "#1a2744" }}>
          {analise.resumo}
        </p>
      </div>

      {/* Fotos para repetir */}
      {analise.fotos_repetir?.length > 0 && (
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}
        >
          <h3
            className="font-semibold flex items-center gap-2 mb-3"
            style={{ color: "#92400e" }}
          >
            <RefreshCw className="w-4 h-4" />
            Fotos que precisam ser refeitas ({analise.fotos_repetir.length})
          </h3>
          <div className="space-y-2">
            {analise.fotos_repetir.map((f, i) => (
              <div key={i} className="text-sm">
                <span className="font-semibold" style={{ color: "#b45309" }}>
                  {f.nome}:
                </span>{" "}
                <span style={{ color: "#78350f" }}>{f.motivo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertas */}
      {analise.alertas?.length > 0 && (
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca" }}
        >
          <h3
            className="font-semibold flex items-center gap-2 mb-3"
            style={{ color: "#991b1b" }}
          >
            <AlertTriangle className="w-4 h-4" />
            Alertas ({analise.alertas.length})
          </h3>
          <ul className="space-y-1">
            {analise.alertas.map((a, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "#7f1d1d" }}>
                <span className="mt-0.5 flex-shrink-0">•</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dados extraídos */}
        {dados && Object.values(dados).some(Boolean) && (
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
          >
            <h3
              className="font-semibold flex items-center gap-2 mb-3"
              style={{ color: "#1a2744" }}
            >
              <Car className="w-4 h-4" style={{ color: "#0f766e" }} />
              Dados Extraídos
            </h3>
            <div className="space-y-1.5">
              {dados.associado && <DataRow label="Associado" value={dados.associado} />}
              {dados.cpf && <DataRow label="CPF" value={dados.cpf} />}
              {dados.placa && <DataRow label="Placa" value={dados.placa} />}
              {dados.chassi && <DataRow label="Chassi" value={dados.chassi} />}
              {dados.modelo && <DataRow label="Modelo" value={dados.modelo} />}
              {dados.ano && <DataRow label="Ano" value={dados.ano} />}
              {dados.km && <DataRow label="KM" value={dados.km} />}
              {dados.cambio && <DataRow label="Câmbio" value={dados.cambio} />}
              {dados.gnv !== undefined && (
                <DataRow label="GNV" value={dados.gnv ? "Sim" : "Não"} />
              )}
              {dados.acessorios && dados.acessorios.length > 0 && (
                <DataRow label="Acessórios" value={dados.acessorios.join(", ")} />
              )}
            </div>
          </div>
        )}

        {/* Pontos aprovados + atenção */}
        <div className="space-y-3">
          {analise.pontos_aprovados?.length > 0 && (
            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
            >
              <h3
                className="font-semibold flex items-center gap-2 mb-3"
                style={{ color: "#166534" }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Aprovados ({analise.pontos_aprovados.length})
              </h3>
              <ul className="space-y-1">
                {analise.pontos_aprovados.slice(0, 7).map((p, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: "#1a2744" }}>
                    <span className="flex-shrink-0 mt-0.5" style={{ color: "#16a34a" }}>
                      ✓
                    </span>
                    {p}
                  </li>
                ))}
                {analise.pontos_aprovados.length > 7 && (
                  <li className="text-xs" style={{ color: "#94a3b8" }}>
                    +{analise.pontos_aprovados.length - 7} itens
                  </li>
                )}
              </ul>
            </div>
          )}

          {analise.pontos_atencao?.length > 0 && (
            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
            >
              <h3
                className="font-semibold flex items-center gap-2 mb-3"
                style={{ color: "#92400e" }}
              >
                <AlertTriangle className="w-4 h-4" />
                Atenção ({analise.pontos_atencao.length})
              </h3>
              <ul className="space-y-1">
                {analise.pontos_atencao.map((p, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: "#1a2744" }}>
                    <span className="flex-shrink-0 mt-0.5" style={{ color: "#d97706" }}>
                      ⚠
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span style={{ color: "#64748b" }}>{label}</span>
      <span className="font-medium text-right" style={{ color: "#1a2744" }}>
        {value}
      </span>
    </div>
  )
}
