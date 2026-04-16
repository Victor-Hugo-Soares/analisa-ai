"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import StepIndicator from "@/components/sinistro/StepIndicator"
import TipoEventoStep from "@/components/sinistro/TipoEventoStep"
import DadosStep from "@/components/sinistro/DadosStep"
import DocumentosStep from "@/components/sinistro/DocumentosStep"
import AnaliseStep from "@/components/sinistro/AnaliseStep"
import {
  getSession,
  saveSinistro,
  generateId,
  getAccessToken,
  getEmpresaIdFromSession,
  fetchWithAuth,
} from "@/lib/storage"
import { createClient } from "@/lib/supabase"
import type {
  TipoEvento,
  DadosSinistro,
  ArquivoAnexo,
  EmpresaSession,
  Sinistro,
} from "@/lib/types"

const steps = [
  { number: 1, label: "Tipo de Evento" },
  { number: 2, label: "Dados" },
  { number: 3, label: "Documentos" },
  { number: 4, label: "Análise" },
]

const dadosIniciais: DadosSinistro = {
  nomeSegurado: "",
  cpf: "",
  placa: "",
  dataHora: "",
  local: "",
  relato: "",
}

export default function NovoEventoPage() {
  const router = useRouter()
  const [session, setSession] = useState<EmpresaSession | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [tipoEvento, setTipoEvento] = useState<TipoEvento | null>(null)
  const [dados, setDados] = useState<DadosSinistro>(dadosIniciais)
  const [arquivos, setArquivos] = useState<ArquivoAnexo[]>([])
  const [analisando, setAnalisando] = useState(false)
  const [erroAnalise, setErroAnalise] = useState<string | null>(null)
  const [sinistroId, setEventoId] = useState<string | null>(null)
  const [rawFiles, setRawFiles] = useState<Map<string, File>>(new Map())

  useEffect(() => {
    const s = getSession()
    if (!s) {
      router.push("/login")
      return
    }
    setSession(s)
    setEventoId(generateId())
  }, [router])

  function canProceed(): boolean {
    if (currentStep === 1) return tipoEvento !== null
    if (currentStep === 2) {
      return !!(
        dados.nomeSegurado &&
        dados.cpf &&
        dados.placa &&
        dados.dataHora &&
        dados.local &&
        dados.relato
      )
    }
    return true
  }

  async function handleNext() {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
      return
    }

    if (currentStep === 3) {
      setCurrentStep(4)
      setAnalisando(true)
      setErroAnalise(null)
      await runAnalise()
    }
  }

  async function uploadArquivos(): Promise<ArquivoAnexo[]> {
    if (rawFiles.size === 0) return arquivos

    const accessToken = getAccessToken()
    const empresaId = getEmpresaIdFromSession()
    const updated = [...arquivos]

    for (const [nome, file] of rawFiles.entries()) {
      const idx = updated.findIndex((a) => a.nome === nome)
      if (idx < 0) continue

      let uploadedToStorage = false

      if (accessToken && empresaId) {
        try {
          // 1. Pede signed upload URL ao nosso servidor (service_role)
          const urlRes = await fetch("/api/sinistros/upload-url", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ fileName: nome, sinistroId, empresaId }),
          })

          if (urlRes.ok) {
            const { signedUrl, token: uploadToken, path } = await urlRes.json()

            // 2. Upload direto: browser → Supabase Storage (não passa pela Vercel)
            const supabase = createClient()
            const { error: uploadError } = await supabase.storage
              .from("sinistros-arquivos")
              .uploadToSignedUrl(path, uploadToken, file, { contentType: file.type })

            if (!uploadError) {
              updated[idx] = { ...updated[idx], storagePath: path }
              uploadedToStorage = true
            } else {
              console.warn(`[Storage] uploadToSignedUrl falhou para ${nome}:`, uploadError.message)
            }
          }
        } catch (e) {
          console.warn("[Storage] Erro ao obter signed URL:", e)
        }
      }

      // Fallback: base64 (apenas para arquivos pequenos < 2MB)
      if (!uploadedToStorage) {
        if (file.size < 2 * 1024 * 1024) {
          const base64 = await fileToBase64(file)
          updated[idx] = { ...updated[idx], base64 }
        } else {
          console.warn(`[Storage] Arquivo ${nome} é grande demais para fallback base64 (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
        }
      }
    }

    return updated
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
    })
  }

  async function runAnalise() {
    try {
      const arquivosComPath = await uploadArquivos()

      const payload = {
        tipoEvento,
        dados,
        arquivos: arquivosComPath.map((a) => ({
          nome: a.nome,
          tipo: a.tipo,
          tipoDoc: a.tipoDoc,
          tamanho: a.tamanho,
          storagePath: a.storagePath,
          base64: a.base64,
        })),
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error ?? "Erro na análise")
      }

      const sinistro: Sinistro = {
        id: sinistroId!,
        tipoEvento: tipoEvento!,
        dados,
        arquivos: arquivosComPath.map(({ base64: _, ...rest }) => rest),
        status: "em_analise",
        criadoEm: new Date().toISOString(),
        analise: result.analise,
      }

      saveSinistro(sinistro)

      // Persiste no Supabase de forma síncrona antes de redirecionar
      const empresaId = getEmpresaIdFromSession()
      if (getAccessToken() && empresaId) {
        try {
          await fetchWithAuth("/api/sinistros/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sinistro, empresaId }),
          }, router)
        } catch (e) {
          console.error("Erro ao salvar no banco:", e)
        }
      }

      router.push(`/sinistros/${sinistroId}`)
    } catch (error) {
      console.error("Erro na análise:", error)
      const msg = error instanceof Error ? error.message : "Erro desconhecido na análise"
      setErroAnalise(msg)
      setAnalisando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header session={session} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 min-w-0">
          <div className="max-w-3xl mx-auto">
            {/* Cabeçalho */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-white rounded-lg border border-transparent hover:border-[#e2e8f0] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-[#0f172a]">
                  Novo Evento
                </h1>
                <p className="text-sm text-[#64748b]">
                  {sinistroId} &middot; Preencha os dados para análise
                </p>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 mb-6">
              <StepIndicator steps={steps} currentStep={currentStep} />
            </div>

            {/* Conteúdo do Step */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-6">
              {currentStep === 1 && (
                <TipoEventoStep
                  selected={tipoEvento}
                  onSelect={setTipoEvento}
                />
              )}
              {currentStep === 2 && (
                <DadosStep dados={dados} onChange={setDados} />
              )}
              {currentStep === 3 && (
                <DocumentosStep
                  arquivos={arquivos}
                  onChange={setArquivos}
                  onRawFile={(nome, file) =>
                    setRawFiles((prev) => new Map(prev).set(nome, file))
                  }
                  onRemoveRawFile={(nome) =>
                    setRawFiles((prev) => {
                      const next = new Map(prev)
                      next.delete(nome)
                      return next
                    })
                  }
                />
              )}
              {currentStep === 4 && (
                <AnaliseStep
                  temAudio={arquivos.some((a) => a.tipo === "audio")}
                  temImagens={arquivos.some((a) => a.tipo === "imagem")}
                  temDocumentos={arquivos.some((a) => a.tipo === "documento")}
                  erro={erroAnalise}
                  onRetry={async () => {
                    setErroAnalise(null)
                    setAnalisando(true)
                    await runAnalise()
                  }}
                />
              )}
            </div>

            {/* Navegação */}
            {currentStep < 4 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={currentStep === 1}
                  className="gap-2 border-[#e2e8f0] text-[#64748b]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </Button>

                <span className="text-sm text-[#94a3b8]">
                  Etapa {currentStep} de {steps.length}
                </span>

                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || analisando}
                  className="bg-[#1a2744] hover:bg-[#243459] text-white gap-2"
                >
                  {currentStep === 3 ? (
                    <>
                      <Check className="w-4 h-4" />
                      Iniciar Análise
                    </>
                  ) : (
                    <>
                      Próximo
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
