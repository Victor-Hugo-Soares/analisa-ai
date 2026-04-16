import { NextRequest, NextResponse } from "next/server"
import { openai, buildSystemPrompt, buildSystemPromptDocumental, PROMPT_INTEGRACAO_AUDIO, AUDIO_TONE_PROMPT, DIARIZATION_PROMPT, fetchAprendizadosRegistrados } from "@/lib/openai"
import { createServerClient } from "@/lib/supabase"
import type { TipoEvento, DadosSinistro, TipoDocumento } from "@/lib/types"
import { TIPO_DOCUMENTO_LABEL } from "@/lib/types"
export const maxDuration = 300
export const dynamic = "force-dynamic"

interface ArquivoPayload {
  nome: string
  tipo: "audio" | "documento" | "imagem"
  tipoDoc?: TipoDocumento
  tamanho: number
  base64?: string
  storagePath?: string
}

interface AnalyzePayload {
  tipoEvento: TipoEvento
  dados: DadosSinistro
  arquivos: ArquivoPayload[]
}

const tipoEventoLabel: Record<TipoEvento, string> = {
  colisao: "Colisão",
  roubo: "Roubo",
  furto: "Furto",
  natureza: "Eventos da Natureza",
  vidros: "Vidros",
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzePayload
    const { tipoEvento, dados, arquivos } = body

    const tiposValidos = Object.keys(tipoEventoLabel) as TipoEvento[]
    if (!tipoEvento || !tiposValidos.includes(tipoEvento)) {
      return NextResponse.json(
        { error: `tipoEvento inválido: "${tipoEvento}". Tipos aceitos: ${tiposValidos.join(", ")}` },
        { status: 400 }
      )
    }
    if (!dados || !arquivos || !Array.isArray(arquivos)) {
      return NextResponse.json(
        { error: "Payload inválido: campos obrigatórios ausentes (dados, arquivos)" },
        { status: 400 }
      )
    }

    const arquivosAudio = arquivos.filter((a) => a.tipo === "audio")
    const arquivosImagem = arquivos.filter((a) => a.tipo === "imagem")
    const arquivosDoc = arquivos.filter((a) => a.tipo === "documento")

    // ─── 1. Transcrever áudio com Whisper + Analisar tom com GPT-4o ──────────
    const transcricoesComAnalise: Array<{
      arquivo: string
      transcricao: string
      analise_tom: Record<string, unknown> | null
    }> = []

    for (const audio of arquivosAudio) {
      const base64 = await resolveArquivoBase64(audio)
      if (!base64) {
        const erroSistema = !!audio.storagePath
        console.error(`[Audio] Arquivo não resolvido: ${audio.nome} — ${erroSistema ? "ERRO DE SISTEMA" : "não foi anexado"}`)
        transcricoesComAnalise.push({
          arquivo: audio.nome,
          transcricao: erroSistema
            ? "[ERRO DO SISTEMA: o arquivo de áudio foi enviado mas não pôde ser lido por falha técnica — oriente o analista a reenviar]"
            : "[PENDÊNCIA: arquivo de áudio não foi anexado]",
          analise_tom: null,
        })
        continue
      }
      try {
        console.log(`[Audio] Transcrevendo: ${audio.nome}`)
        const transcricaoBruta = await transcribeAudio(base64, audio.nome)
        console.log(`[Audio] Transcrição bruta (${transcricaoBruta.length} chars)`)

        // Segunda etapa: diarização — separa interlocutores e limpa ruído
        let transcricao = transcricaoBruta
        if (transcricaoBruta.length > 50) {
          transcricao = await diarizeTranscription(transcricaoBruta)
          console.log(`[Audio] Diarização concluída (${transcricao.length} chars)`)
        }

        // Terceira etapa: análise de tom e comportamento vocal via GPT-4o
        let analiseTom: Record<string, unknown> | null = null
        if (transcricao && transcricao.length > 50) {
          analiseTom = await analyzeAudioTone(transcricao)
        }

        transcricoesComAnalise.push({
          arquivo: audio.nome,
          transcricao,
          analise_tom: analiseTom,
        })
      } catch (e) {
        console.error("[Audio] Erro:", e)
        transcricoesComAnalise.push({
          arquivo: audio.nome,
          transcricao: "[Erro ao transcrever - formato de áudio pode não ser suportado]",
          analise_tom: null,
        })
      }
    }

    // ─── 2. Analisar imagens com GPT-4o Vision ───────────────────────────────
    const descricoesImagens: Array<{ arquivo: string; descricao: string }> = []

    for (const imagem of arquivosImagem) {
      const base64 = await resolveArquivoBase64(imagem)
      if (!base64) {
        const erroSistema = !!imagem.storagePath
        console.error(`[Imagem] Arquivo não resolvido: ${imagem.nome} — ${erroSistema ? "ERRO DE SISTEMA" : "não foi anexado"}`)
        descricoesImagens.push({
          arquivo: imagem.nome,
          descricao: erroSistema
            ? "[ERRO DO SISTEMA: a imagem foi enviada mas não pôde ser lida por falha técnica — oriente o analista a reenviar]"
            : "[PENDÊNCIA: imagem não foi anexada]",
        })
        continue
      }
      try {
        console.log(`[Imagem] Analisando: ${imagem.nome}`)
        const descricao = await analyzeImage(base64, imagem.nome, tipoEventoLabel[tipoEvento])
        descricoesImagens.push({ arquivo: imagem.nome, descricao })
        console.log(`[Imagem] Análise concluída`)
      } catch (e) {
        console.error("[Imagem] Erro:", e)
        const errorMsg = e instanceof Error ? e.message : String(e)
        descricoesImagens.push({
          arquivo: imagem.nome,
          descricao: errorMsg.toLowerCase().includes("content_policy")
            ? "[Imagem rejeitada pelo modelo: conteúdo sensível]"
            : "[Erro ao processar imagem: formato inválido ou corrompido]",
        })
      }
    }

    // ─── 3. Resolver e extrair texto dos documentos (PDFs) ───────────────────
    const docsResolvidos: Array<{
      nome: string
      tipoDoc?: TipoDocumento
      base64: string | null
      textoPdf: string | null
      erroSistema: boolean  // true = arquivo foi enviado mas falhou por problema técnico
    }> = []

    for (const doc of arquivosDoc) {
      const base64 = await resolveArquivoBase64(doc)
      let textoPdf: string | null = null

      if (!base64) {
        // Distingue: tinha storagePath (arquivo enviado, sistema falhou) vs nunca teve (não anexado)
        const erroSistema = !!doc.storagePath
        console.error(`[Doc] Arquivo não resolvido: ${doc.nome} — ${erroSistema ? "ERRO DE SISTEMA (storagePath existia)" : "não foi anexado"}`)
        docsResolvidos.push({ nome: doc.nome, tipoDoc: doc.tipoDoc, base64: null, textoPdf: null, erroSistema })
        continue
      }

      if (doc.nome.toLowerCase().endsWith(".pdf")) {
        try {
          const raw = base64.includes(",") ? base64.split(",")[1] : base64
          const buffer = Buffer.from(raw, "base64")
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>
          const parsed = await pdfParse(buffer)
          textoPdf = parsed.text?.trim() ?? null
          console.log(`[PDF] Texto extraído de ${doc.nome}: ${textoPdf?.length ?? 0} chars`)
        } catch (e) {
          console.error(`[PDF] Falha ao extrair texto de ${doc.nome}:`, e)
        }
      }

      docsResolvidos.push({ nome: doc.nome, tipoDoc: doc.tipoDoc, base64, textoPdf, erroSistema: false })
    }

    // ─── 4. Montar contexto completo para análise final ──────────────────────
    const contexto = buildContexto({
      tipoEvento,
      dados,
      transcricoesComAnalise,
      descricoesImagens,
      docsResolvidos,
    })

    console.log(`[Análise] Enviando contexto ao GPT-4o (${contexto.length} chars, ${docsResolvidos.filter(d => d.base64).length} docs anexados)`)

    // ─── 5. Análise final ────────────────────────────────────────────────────
    const aprendizados = await fetchAprendizadosRegistrados()

    const ehFurtoRoubo = tipoEvento === "furto" || tipoEvento === "roubo"
    const temAudio = transcricoesComAnalise.some(
      (t) => !t.transcricao.startsWith("[ERRO") && !t.transcricao.startsWith("[PENDÊNCIA")
    )

    // Helper: monta userContentParts com PDFs escaneados anexados para visão
    function montarUserContent(textoContexto: string) {
      const parts: Array<
        | { type: "text"; text: string }
        | { type: "file"; file: { filename: string; file_data: string } }
      > = [{ type: "text", text: textoContexto }]

      for (const doc of docsResolvidos) {
        if (!doc.base64 || !doc.nome.toLowerCase().endsWith(".pdf")) continue
        const eFotosPdf = doc.tipoDoc === "fotos_pdf"
        const eEscaneado = !doc.textoPdf || doc.textoPdf.length <= 10
        if (eFotosPdf || eEscaneado) {
          const raw = doc.base64.includes(",") ? doc.base64.split(",")[1] : doc.base64
          parts.push({ type: "file", file: { filename: doc.nome, file_data: `data:application/pdf;base64,${raw}` } })
          console.log(`[Análise] PDF "${doc.nome}" (${eFotosPdf ? "fotos" : "escaneado"}) enviado para visão`)
        }
      }
      return parts
    }

    let analise: Record<string, unknown>

    if (ehFurtoRoubo && temAudio) {
      // ── FLUXO DE DUAS CHAMADAS: furto/roubo com áudio ─────────────────────
      // Chamada 1: documentos + imagens (sem áudio) com gpt-4.1 — ~25K tokens
      console.log("[Análise] Furto/roubo com áudio — iniciando fluxo de 2 chamadas com gpt-4.1")

      const contextoDocs = buildContexto({
        tipoEvento,
        dados,
        transcricoesComAnalise: [], // sem áudio nesta chamada
        descricoesImagens,
        docsResolvidos,
      })

      const systemCall1 = buildSystemPromptDocumental(tipoEvento) + aprendizados
      console.log(`[Análise] Chamada 1 — system: ${systemCall1.length} chars, contexto: ${contextoDocs.length} chars`)

      const resp1 = await openai.chat.completions.create({
        model: "gpt-4.1",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: [
          { role: "system", content: systemCall1 },
          { role: "user", content: montarUserContent(contextoDocs) as any },
        ],
        temperature: 0.15,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      })

      const analiseParcial = resp1.choices[0]?.message?.content ?? "{}"
      console.log(`[TPM] Chamada 1 — prompt: ${resp1.usage?.prompt_tokens ?? '?'} | completion: ${resp1.usage?.completion_tokens ?? '?'} | total: ${resp1.usage?.total_tokens ?? '?'} tokens`)
      console.log(`[Análise] Chamada 1 concluída (${analiseParcial.length} chars)`)

      // Chamada 2: integração do áudio + veredicto final com gpt-4.1 — ~15K tokens
      const contextoAudio = buildContextoAudio({ transcricoesComAnalise })
      const userCall2 = `ANÁLISE DOCUMENTAL PARCIAL (Chamada 1):
${analiseParcial}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÁUDIO PARA INTEGRAÇÃO:
${contextoAudio}`

      console.log(`[Análise] Chamada 2 — contexto áudio: ${userCall2.length} chars`)

      const resp2 = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: PROMPT_INTEGRACAO_AUDIO },
          { role: "user", content: userCall2 },
        ],
        temperature: 0.15,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      })

      const analiseText2 = resp2.choices[0]?.message?.content ?? "{}"
      console.log(`[TPM] Chamada 2 — prompt: ${resp2.usage?.prompt_tokens ?? '?'} | completion: ${resp2.usage?.completion_tokens ?? '?'} | total: ${resp2.usage?.total_tokens ?? '?'} tokens`)
      console.log(`[TPM] Total 2 chamadas — ${(resp1.usage?.total_tokens ?? 0) + (resp2.usage?.total_tokens ?? 0)} tokens`)
      console.log(`[Análise] Chamada 2 concluída (${analiseText2.length} chars)`)
      analise = JSON.parse(analiseText2)

    } else {
      // ── FLUXO ÚNICO: todos os outros casos com gpt-4.1-mini ───────────────
      // Furto/roubo sem áudio: usa prompt documental (sem IANALISTA_LINGUISTICA)
      // pois não há análise vocal a fazer — economiza ~1.400 tokens
      const systemPromptFinal = (ehFurtoRoubo
        ? buildSystemPromptDocumental(tipoEvento as "furto" | "roubo")
        : buildSystemPrompt(tipoEvento)
      ) + aprendizados
      console.log(`[Análise] Fluxo único gpt-4.1-mini — system: ${systemPromptFinal.length} chars`)

      const resp = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: [
          { role: "system", content: systemPromptFinal },
          { role: "user", content: montarUserContent(contexto) as any },
        ],
        temperature: 0.15,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      })

      const analiseText = resp.choices[0]?.message?.content ?? "{}"
      console.log(`[TPM] Fluxo único — prompt: ${resp.usage?.prompt_tokens ?? '?'} | completion: ${resp.usage?.completion_tokens ?? '?'} | total: ${resp.usage?.total_tokens ?? '?'} tokens`)
      console.log(`[Análise] Resposta recebida (${analiseText.length} chars)`)
      analise = JSON.parse(analiseText)
    }

    // Injetar transcrição completa na analise_audio se houver
    // Se havia áudio mas a IA retornou analise_audio: null, cria o objeto mínimo
    if (transcricoesComAnalise.length > 0 && !analise.analise_audio) {
      console.warn("[Análise] analise_audio retornou null apesar de haver transcrição — criando objeto mínimo")
      analise.analise_audio = { transcricao_completa: null } as Record<string, unknown>
    }
    if (transcricoesComAnalise.length > 0 && analise.analise_audio) {
      const LIMITE_CHARS = 50000
      const transcricaoFull = transcricoesComAnalise
        .map((t) => `=== ${t.arquivo} ===\n${t.transcricao}`)
        .join("\n\n")

      const audioObj = analise.analise_audio as Record<string, unknown>
      audioObj.transcricao_completa =
        transcricaoFull.length > LIMITE_CHARS
          ? transcricaoFull.substring(0, LIMITE_CHARS) +
            `\n\n[... transcrição truncada — ${transcricaoFull.length.toLocaleString("pt-BR")} caracteres no total, exibindo os primeiros ${LIMITE_CHARS.toLocaleString("pt-BR")}]`
          : transcricaoFull

      if (transcricaoFull.length > LIMITE_CHARS) {
        console.warn(`[Análise] Transcrição truncada no JSON de resposta: ${transcricaoFull.length} chars → ${LIMITE_CHARS} chars`)
      }
    }

    // Fallback para analise_bo — se havia BO mas IA retornou null
    const temBO = docsResolvidos.some((d) => d.tipoDoc === "bo" && d.base64)
    if (temBO && !analise.analise_bo) {
      console.warn("[Análise] analise_bo retornou null apesar de haver BO — criando objeto mínimo")
      analise.analise_bo = {
        numero_bo: null, data_registro: null, data_evento_declarado: null,
        intervalo_registro: null, narrativa_bo: null, consistencia_relato: null, alertas: [],
      }
    }

    // Fallback para analise_imagens — se havia imagens mas IA retornou null
    const temImagens = descricoesImagens.some((i) => !i.descricao.startsWith("[ERRO") && !i.descricao.startsWith("[PENDÊNCIA"))
    if (temImagens && !analise.analise_imagens) {
      console.warn("[Análise] analise_imagens retornou null apesar de haver imagens — criando objeto mínimo")
      analise.analise_imagens = {
        descricao: null, consistencia_relato: null, observacoes: [], indicadores_autenticidade: null,
      }
    }

    return NextResponse.json({ analise }, { status: 200 })
  } catch (error) {
    console.error("[API] Erro geral:", error)
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve arquivo: storagePath → signed URL → buffer  |  base64 → buffer
// Retenta até 3 vezes com backoff para absorver instabilidades transitórias
// ─────────────────────────────────────────────────────────────────────────────
async function resolveArquivoBase64(arquivo: ArquivoPayload): Promise<string | null> {
  if (arquivo.storagePath) {
    const MAX_TENTATIVAS = 3
    const BACKOFF_MS = [500, 1500, 3000]

    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
      try {
        // Gera uma nova signed URL a cada tentativa (a anterior pode ter expirado)
        const supabase = createServerClient()
        const { data, error } = await supabase.storage
          .from("sinistros-arquivos")
          .createSignedUrl(arquivo.storagePath, 300)

        if (error || !data?.signedUrl) {
          console.error(`[Storage] Tentativa ${tentativa}/${MAX_TENTATIVAS} — erro ao gerar signed URL para "${arquivo.nome}":`, error)
          if (tentativa < MAX_TENTATIVAS) {
            await new Promise((r) => setTimeout(r, BACKOFF_MS[tentativa - 1]))
            continue
          }
          return null
        }

        const res = await fetch(data.signedUrl)
        if (!res.ok) {
          console.error(`[Storage] Tentativa ${tentativa}/${MAX_TENTATIVAS} — fetch falhou para "${arquivo.nome}": HTTP ${res.status} ${res.statusText}`)
          if (tentativa < MAX_TENTATIVAS) {
            await new Promise((r) => setTimeout(r, BACKOFF_MS[tentativa - 1]))
            continue
          }
          return null
        }

        const arrayBuffer = await res.arrayBuffer()
        const mimeType = getMimeType(arquivo.nome)
        if (tentativa > 1) {
          console.log(`[Storage] "${arquivo.nome}" resolvido na tentativa ${tentativa}`)
        }
        return `data:${mimeType};base64,${Buffer.from(arrayBuffer).toString("base64")}`
      } catch (e) {
        console.error(`[Storage] Tentativa ${tentativa}/${MAX_TENTATIVAS} — exceção ao resolver "${arquivo.nome}":`, e)
        if (tentativa < MAX_TENTATIVAS) {
          await new Promise((r) => setTimeout(r, BACKOFF_MS[tentativa - 1]))
        }
      }
    }

    console.error(`[Storage] Todas as ${MAX_TENTATIVAS} tentativas falharam para "${arquivo.nome}"`)
    return null
  }
  return arquivo.base64 ?? null
}

function getMimeType(nome: string): string {
  const ext = nome.split(".").pop()?.toLowerCase() ?? ""
  const map: Record<string, string> = {
    mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4", mp4: "audio/mp4",
    ogg: "audio/ogg", opus: "audio/ogg", webm: "audio/webm", flac: "audio/flac",
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    pdf: "application/pdf",
  }
  return map[ext] ?? "application/octet-stream"
}

// ─────────────────────────────────────────────────────────────────────────────
// Whisper: Transcrição de áudio
// ─────────────────────────────────────────────────────────────────────────────
async function transcribeAudio(base64: string, nome: string): Promise<string> {
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64
  const mimeType = base64.includes("data:")
    ? base64.split(";")[0].replace("data:", "")
    : "audio/mpeg"

  const buffer = Buffer.from(base64Data, "base64")

  // Determinar extensão válida para o Whisper
  const ext = nome.split(".").pop()?.toLowerCase() ?? "mp3"
  const whisperExts = ["mp3", "wav", "m4a", "mp4", "webm", "mpeg", "mpga", "ogg", "flac"]
  const fileExt = whisperExts.includes(ext) ? ext : "mp3"
  const fileName = `audio.${fileExt}`

  // Criar File com nome correto (name é read-only, deve ser passado no constructor)
  const file = new File([buffer], fileName, { type: mimeType })

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "pt",
    response_format: "verbose_json",
    timestamp_granularities: ["word", "segment"],
    prompt: "Ligação telefônica de atendimento a sinistro veicular. Termos esperados: boletim de ocorrência, CRLV, CNH, sinistro, roubo, furto, colisão, rastreador, franquia, proteção veicular, associação, indenização, ressarcimento, guincho.",
  })

  // Preferência: word-level timestamps (mais precisos que segment)
  if (
    typeof transcription === "object" &&
    "words" in transcription &&
    Array.isArray(transcription.words) &&
    transcription.words.length > 0
  ) {
    return buildTranscricaoFromWords(
      transcription.words as { word: string; start: number; end: number }[]
    )
  }

  // Fallback: segment-level
  if (
    typeof transcription === "object" &&
    "segments" in transcription &&
    Array.isArray(transcription.segments)
  ) {
    const comTimestamps = transcription.segments
      .map((seg: { start: number; end: number; text: string }) =>
        `[${formatTimestamp(seg.start)} → ${formatTimestamp(seg.end)}] ${seg.text.trim()}`
      )
      .join("\n")
    return comTimestamps
  }

  return typeof transcription === "string"
    ? transcription
    : (transcription as { text: string }).text ?? ""
}

// Agrupa palavras em segmentos de até 8s ou por pausa > 0.6s
// Resultado: timestamps precisos ao nível de palavra
function buildTranscricaoFromWords(
  words: { word: string; start: number; end: number }[]
): string {
  if (words.length === 0) return ""

  const MAX_DURATION = 8   // segundos máximos por segmento
  const PAUSE_THRESHOLD = 0.6  // pausa que força novo segmento

  const linhas: string[] = []
  let segStart = words[0].start
  let segWords: string[] = []
  let prevEnd = words[0].start

  for (const w of words) {
    const pause = w.start - prevEnd
    const segDuration = w.end - segStart

    // Fecha segmento se pausa grande ou segmento muito longo
    if (segWords.length > 0 && (pause > PAUSE_THRESHOLD || segDuration > MAX_DURATION)) {
      linhas.push(`[${formatTimestamp(segStart)} → ${formatTimestamp(prevEnd)}] ${segWords.join(" ")}`)
      segStart = w.start
      segWords = []
    }

    segWords.push(w.word.trim())
    prevEnd = w.end
  }

  // Último segmento
  if (segWords.length > 0) {
    linhas.push(`[${formatTimestamp(segStart)} → ${formatTimestamp(prevEnd)}] ${segWords.join(" ")}`)
  }

  return linhas.join("\n")
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

// ─────────────────────────────────────────────────────────────────────────────
// GPT-4o: Diarização — separa interlocutores e limpa ruído da transcrição
// ─────────────────────────────────────────────────────────────────────────────
async function diarizeTranscription(transcricaoBruta: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: DIARIZATION_PROMPT },
        {
          role: "user",
          content: `Processe esta transcrição bruta de ligação de atendimento a sinistro:\n\n${transcricaoBruta}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    })

    const content = response.choices[0]?.message?.content
    console.log(`[TPM] Diarização — prompt: ${response.usage?.prompt_tokens ?? '?'} | completion: ${response.usage?.completion_tokens ?? '?'} | total: ${response.usage?.total_tokens ?? '?'} tokens`)
    if (!content || content.length < 20) {
      console.warn("[Diarização] Resposta vazia — usando transcrição bruta")
      return transcricaoBruta
    }
    return content
  } catch (e) {
    console.error("[Diarização] Erro — usando transcrição bruta:", e)
    return transcricaoBruta
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GPT-4o: Análise de tom e comportamento vocal
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeAudioTone(
  transcricao: string
): Promise<Record<string, unknown> | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: AUDIO_TONE_PROMPT },
        {
          role: "user",
          content: `Analise esta transcrição diarizada da ligação (interlocutores já identificados com [ATENDENTE] e [ASSOCIADO]):\n\n${transcricao}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 2500,
      response_format: { type: "json_object" },
    })

    const content = response.choices[0]?.message?.content
    console.log(`[TPM] Tom de Voz — prompt: ${response.usage?.prompt_tokens ?? '?'} | completion: ${response.usage?.completion_tokens ?? '?'} | total: ${response.usage?.total_tokens ?? '?'} tokens`)
    if (!content) return null
    return JSON.parse(content)
  } catch (e) {
    console.error("[TomVoz] Erro:", e)
    return null
  }
}

// Extrai lista de timestamps reais presentes na transcrição
function extractTimestamps(transcricao: string): string[] {
  const regex = /\[(\d{2}:\d{2}) → (\d{2}:\d{2})\]/g
  const timestamps: string[] = []
  let match
  while ((match = regex.exec(transcricao)) !== null) {
    timestamps.push(match[0])
  }
  return timestamps
}

// ─────────────────────────────────────────────────────────────────────────────
// GPT-4o Vision: Análise de imagens
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeImage(
  base64: string,
  nome: string,
  tipoEvento: string
): Promise<string> {
  const imageUrl = base64.startsWith("data:") ? base64 : `data:image/jpeg;base64,${base64}`

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Você é um perito em sinistros veiculares. Analise esta imagem do sinistro de tipo "${tipoEvento}" (arquivo: ${nome}).

Forneça uma análise técnica e detalhada incluindo:

1. **O QUE ESTÁ VISÍVEL**: Descreva todos os elementos presentes (veículo, danos, ambiente, contexto)
2. **EXTENSÃO DOS DANOS**: Classifique os danos (leve/moderado/grave) e as partes afetadas
3. **CONSISTÊNCIA**: Os danos são compatíveis com o tipo de sinistro "${tipoEvento}"? Por quê?
4. **INDÍCIOS DE ANTIGUIDADE**: Os danos parecem recentes? Há ferrugem, oxidação ou sujeira nas bordas que indiquem dano pré-existente?
5. **AUTENTICIDADE DA IMAGEM**: A imagem parece autêntica e tirada no momento do sinistro? Há algo suspeito na cena?
6. **PONTOS DE ATENÇÃO**: Identifique qualquer elemento que mereça investigação adicional

Seja objetivo, técnico e específico.`,
          },
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "high" },
          },
        ],
      },
    ],
    max_tokens: 1200,
  })

  console.log(`[TPM] Vision imagem — prompt: ${response.usage?.prompt_tokens ?? '?'} | completion: ${response.usage?.completion_tokens ?? '?'} | total: ${response.usage?.total_tokens ?? '?'} tokens`)
  return response.choices[0]?.message?.content ?? "Não foi possível analisar a imagem."
}

// ─────────────────────────────────────────────────────────────────────────────
// Montagem do contexto para o GPT-4o final
// ─────────────────────────────────────────────────────────────────────────────
interface TranscricaoComAnalise {
  arquivo: string
  transcricao: string
  analise_tom: Record<string, unknown> | null
}

interface ContextoParams {
  tipoEvento: TipoEvento
  dados: DadosSinistro
  transcricoesComAnalise: TranscricaoComAnalise[]
  descricoesImagens: Array<{ arquivo: string; descricao: string }>
  docsResolvidos: Array<{ nome: string; tipoDoc?: TipoDocumento; base64: string | null; textoPdf: string | null; erroSistema: boolean }>
}

/**
 * Monta apenas a seção de áudio para a Chamada 2 do fluxo de duas etapas.
 * Inclui transcrição completa + pré-análise de tom para cada arquivo.
 */
function buildContextoAudio({ transcricoesComAnalise }: { transcricoesComAnalise: TranscricaoComAnalise[] }): string {
  const partes: string[] = []
  for (const t of transcricoesComAnalise) {
    const timestampsReais = extractTimestamps(t.transcricao)
    partes.push(`ARQUIVO: ${t.arquivo}`)
    partes.push(``)
    partes.push(`── TRANSCRIÇÃO COMPLETA COM TIMESTAMPS ──`)
    partes.push(`(Os timestamps abaixo são os ÚNICOS válidos para referência)`)
    partes.push(t.transcricao)
    partes.push(``)
    partes.push(`── TIMESTAMPS DISPONÍVEIS ──`)
    partes.push(timestampsReais.length > 0 ? timestampsReais.join("  |  ") : "(Sem timestamps)")
    if (t.analise_tom) {
      partes.push(``)
      partes.push(`── PRÉ-ANÁLISE DE COMPORTAMENTO VOCAL ──`)
      partes.push(`Use como referência. Valide com a transcrição acima.`)
      partes.push(JSON.stringify(t.analise_tom, null, 2))
    }
    partes.push(``)
  }
  return partes.join("\n")
}

function buildContexto({
  tipoEvento,
  dados,
  transcricoesComAnalise,
  descricoesImagens,
  docsResolvidos,
}: ContextoParams): string {
  const partes: string[] = []

  // ── Dados do sinistro ──────────────────────────────────────────────────────
  partes.push(`════════════════════════════════════════`)
  partes.push(`SINISTRO PARA ANÁLISE`)
  partes.push(`════════════════════════════════════════`)
  partes.push(`TIPO DE EVENTO: ${tipoEventoLabel[tipoEvento]}`)
  partes.push(``)
  partes.push(`── DADOS DO SEGURADO ──`)
  partes.push(`Nome: ${dados.nomeSegurado}`)
  partes.push(`CPF: ${dados.cpf}`)
  partes.push(`Placa: ${dados.placa}`)
  partes.push(`Data/Hora declarada do sinistro: ${dados.dataHora}`)
  partes.push(`Local declarado: ${dados.local}`)
  partes.push(``)
  partes.push(`── RELATO ESCRITO DO SEGURADO ──`)
  partes.push(dados.relato)

  // ── Áudio: transcrição + pré-análise de tom ───────────────────────────────
  if (transcricoesComAnalise.length > 0) {
    partes.push(``)
    partes.push(`════════════════════════════════════════`)
    partes.push(`ÁUDIO: TRANSCRIÇÃO E PRÉ-ANÁLISE`)
    partes.push(`════════════════════════════════════════`)

    for (const t of transcricoesComAnalise) {
      const timestampsReais = extractTimestamps(t.transcricao)

      partes.push(``)
      partes.push(`ARQUIVO: ${t.arquivo}`)
      partes.push(``)
      partes.push(`── TRANSCRIÇÃO COMPLETA COM TIMESTAMPS ──`)
      partes.push(`(Os timestamps abaixo são os ÚNICOS válidos para referência)`)
      partes.push(t.transcricao)
      partes.push(``)
      partes.push(`── TIMESTAMPS DISPONÍVEIS NESTA TRANSCRIÇÃO ──`)
      partes.push(
        timestampsReais.length > 0
          ? timestampsReais.join("  |  ")
          : "(Sem timestamps — transcrição em texto simples)"
      )

      if (t.analise_tom) {
        partes.push(``)
        partes.push(`── PRÉ-ANÁLISE DE COMPORTAMENTO VOCAL (use como referência) ──`)
        partes.push(`ATENÇÃO: Esta pré-análise identificou os seguintes momentos e padrões.`)
        partes.push(`Ao preencher "momentos_alterados", use APENAS timestamps da lista acima.`)
        partes.push(JSON.stringify(t.analise_tom, null, 2))
      }
    }

    partes.push(``)
    partes.push(`── INSTRUÇÕES PARA ANÁLISE DO ÁUDIO ──`)
    partes.push(`1. Compare cada trecho da ligação com o relato escrito`)
    partes.push(`2. Descreva o ARCO EMOCIONAL COMPLETO — como o tom evoluiu do início ao fim`)
    partes.push(`3. Em "momentos_alterados": cite APENAS timestamps que aparecem na lista acima`)
    partes.push(`4. Se não houver timestamp para um momento, descreva o TRECHO DE TEXTO em vez do tempo`)
    partes.push(`5. Diferencie: calma atípica vs. agitação real vs. hesitação vs. autocorreção`)
  }

  // ── Imagens ───────────────────────────────────────────────────────────────
  if (descricoesImagens.length > 0) {
    partes.push(``)
    partes.push(`════════════════════════════════════════`)
    partes.push(`IMAGENS: ANÁLISE PERICIAL`)
    partes.push(`════════════════════════════════════════`)
    for (const img of descricoesImagens) {
      partes.push(``)
      partes.push(`ARQUIVO: ${img.arquivo}`)
      partes.push(img.descricao)
    }
    partes.push(``)
    partes.push(`INSTRUÇÃO — ANÁLISE INDIVIDUAL:`)
    partes.push(`Avalie se os danos visíveis em cada imagem são coerentes com o tipo "${tipoEventoLabel[tipoEvento]}" e com o relato.`)
    partes.push(`Identifique sinais de oxidação nas bordas (dano antigo), ângulos suspeitos e ausência de fragmentos esperados.`)

    if (descricoesImagens.length > 1) {
      partes.push(``)
      partes.push(`INSTRUÇÃO ADICIONAL — CONSISTÊNCIA ENTRE IMAGENS (${descricoesImagens.length} fotos recebidas):`)
      partes.push(`Compare TODAS as imagens entre si e verifique obrigatoriamente:`)
      partes.push(`1. ILUMINAÇÃO: a luz e as sombras são compatíveis entre as fotos? Iluminação diferente no mesmo dano indica fotos tiradas em momentos distintos ou montagem.`)
      partes.push(`2. POSIÇÃO DO DANO: o dano aparece na mesma posição relativa no veículo em todas as fotos? Se o dano "muda de lugar" entre fotos, são veículos diferentes.`)
      partes.push(`3. ESTADO DO DANO: o dano parece igual em todas as fotos (mesma extensão, mesma profundidade)? Variação de tamanho é red flag.`)
      partes.push(`4. SUJEIRA E CONTEXTO: a sujeira do veículo, o ambiente ao fundo e as condições climáticas são consistentes entre as fotos?`)
      partes.push(`5. REFLEXOS: reflexos e brilhos no veículo são coerentes com a mesma fonte de luz e o mesmo ambiente?`)
      partes.push(`Se qualquer inconsistência for encontrada entre as fotos, registre em "indicadores_fraude" — não em "pontos_atencao".`)
    }
  }

  // ── Documentos ────────────────────────────────────────────────────────────
  if (docsResolvidos.length > 0) {
    partes.push(``)
    partes.push(`════════════════════════════════════════`)
    partes.push(`CONTEÚDO DOS DOCUMENTOS EXTRAÍDOS`)
    partes.push(`════════════════════════════════════════`)
    partes.push(`ATENÇÃO: Os textos abaixo foram extraídos diretamente dos PDFs enviados.`)
    partes.push(`USE APENAS as datas, nomes, números e informações que aparecem nestes textos.`)
    partes.push(`NÃO invente, NÃO presuma, NÃO use dados do relato para preencher campos do documento.`)
    partes.push(``)

    for (const doc of docsResolvidos) {
      const tipoLabel = doc.tipoDoc ? TIPO_DOCUMENTO_LABEL[doc.tipoDoc] : "Documento"
      partes.push(`──── ${tipoLabel.toUpperCase()}: ${doc.nome} ────`)

      if (doc.textoPdf && doc.textoPdf.length > 10) {
        partes.push(`CONTEÚDO EXTRAÍDO DO PDF:`)
        partes.push(doc.textoPdf)

        // Instrução de extração específica por tipo
        partes.push(``)
        if (doc.tipoDoc === "bo") {
          partes.push(`INSTRUÇÃO: Com base no texto acima, preencha "analise_bo" com:`)
          partes.push(`  - numero_bo: número exato do BO conforme consta no documento`)
          partes.push(`  - data_registro: data e hora em que o BO foi registrado na delegacia`)
          partes.push(`  - data_evento_declarado: data e hora do evento conforme declarado no BO`)
          partes.push(`  - narrativa_bo: narrativa completa dos fatos conforme o documento`)
          partes.push(`  - consistencia_relato: compare o texto do BO com o relato do associado acima`)
          partes.push(`  CRÍTICO: use SOMENTE as datas que aparecem no texto extraído acima. Se a data no relato`)
          partes.push(`  do associado divergir da data no BO, registre essa divergência como contradição.`)
        } else if (doc.tipoDoc === "crlv") {
          partes.push(`INSTRUÇÃO: Extraia proprietário, placa, chassi, renavam, ano/modelo, restrições e data de emissão do licenciamento.`)
          partes.push(`CRÍTICO: Leia datas EXATAMENTE como estão impressas no documento — NÃO corrija, NÃO interprete, NÃO converta formato.`)
          partes.push(`Ex: se o documento mostra "11/01/2026", registre "11/01/2026" — jamais converta para "11/03/2026" ou outro valor.`)
          partes.push(`Verifique se o proprietário bate com o associado declarado no relato.`)
        } else if (doc.tipoDoc === "cnh") {
          partes.push(`INSTRUÇÃO: Extraia nome, CPF, validade e categoria. Verifique se a CNH é válida.`)
        } else if (doc.tipoDoc === "rastreamento") {
          partes.push(`INSTRUÇÃO: Extraia localização, rota, velocidade e status de ignição no horário do sinistro.`)
          partes.push(`Compare com o local e horário declarados pelo associado.`)
        } else if (doc.tipoDoc === "orcamento") {
          partes.push(`INSTRUÇÃO: Extraia valor total e itens. Compare o valor com 75% da FIPE para avaliar perda total.`)
        } else if (doc.tipoDoc === "procuracao") {
          partes.push(`INSTRUÇÃO: Procuração em sinistros é RED FLAG de fraude organizada. Identifique outorgante e poderes.`)
        } else if (doc.tipoDoc === "croqui") {
          partes.push(`INSTRUÇÃO: Este é um croqui — desenho ou imagem simples que tenta representar a dinâmica do evento (posição dos veículos, sentido de movimento, ponto de impacto).`)
          partes.push(`REGRA CRÍTICA: O croqui é um documento extremamente básico, feito pelo próprio associado ou atendente sem valor probatório independente. NUNCA baseie conclusões, contradições ou indicadores de fraude exclusivamente no croqui.`)
          partes.push(`Use o croqui apenas como referência visual auxiliar para entender o que o associado declarou. Qualquer informação do croqui deve ser corroborada por outras fontes (fotos, BO, relato, telemetria) para ter peso analítico.`)
          partes.push(`Registre o croqui como "completo" se estiver legível, "parcial" se estiver incompleto ou confuso. Não exija detalhamento técnico de um croqui — ele é por natureza uma representação simplificada.`)
        } else if (doc.tipoDoc === "crv") {
          partes.push(`INSTRUÇÃO: Extraia proprietário, CPF, chassi, placa, ano/modelo.`)
          partes.push(`Verifique se o proprietário bate com o associado. Em caso de perda total, o CRV deve estar preenchido`)
          partes.push(`a favor da Loma com firma reconhecida — a ausência desse preenchimento é pendência crítica.`)
          partes.push(`Se o veículo estiver em nome de terceiro sem registro de transferência, registre como contradição.`)
        } else if (doc.tipoDoc === "laudo_pericial") {
          partes.push(`INSTRUÇÃO: Extraia: nome e registro do perito, data da vistoria, conclusão sobre causa do sinistro,`)
          partes.push(`partes danificadas identificadas e estimativa de danos.`)
          partes.push(`Verifique: (1) os danos descritos são compatíveis com o evento declarado? (2) há menção a danos`)
          partes.push(`pré-existentes ou oxidação nas bordas? (3) a causa apontada pelo perito bate com o relato do associado?`)
          partes.push(`(4) o laudo tem carimbo, assinatura e número de registro — ausência é red flag de documento adulterado.`)
          partes.push(`Compare os danos do laudo com os danos visíveis nas fotos recebidas.`)
        } else if (doc.tipoDoc === "nota_fiscal") {
          partes.push(`INSTRUÇÃO: Extraia: itens, valores unitários, valor total, CNPJ e nome da oficina, data de emissão.`)
          partes.push(`Verifique: (1) os itens cobrados são compatíveis com os danos declarados e visíveis nas fotos?`)
          partes.push(`(2) o valor total está próximo de 75% da FIPE? Se sim, avalie se há inflação para atingir perda total.`)
          partes.push(`(3) a data da nota é posterior ao evento? Nota emitida antes do evento é red flag crítico.`)
          partes.push(`(4) itens de som, rodas, acessórios não originais — não cobertos conforme regulamento Loma.`)
        } else if (doc.tipoDoc === "declaracao_segurado") {
          partes.push(`INSTRUÇÃO: Extraia a narrativa completa, datas e assinatura do associado.`)
          partes.push(`Compare CADA detalhe da declaração com o relato escrito fornecido no início deste contexto:`)
          partes.push(`divergências de horário, local, sequência de eventos ou detalhes dos criminosos são contradições`)
          partes.push(`que devem ser registradas explicitamente no campo "contradicoes".`)
          partes.push(`Verifique se a data de assinatura da declaração é compatível com o prazo regulamentar do evento.`)
        } else if (doc.tipoDoc === "laudo_medico") {
          partes.push(`INSTRUÇÃO: Extraia: diagnóstico, lesões identificadas, códigos CID, data do atendimento, médico responsável.`)
          partes.push(`Verifique: (1) as lesões são fisicamente compatíveis com a dinâmica do sinistro declarado?`)
          partes.push(`(ex: colisão traseira não gera fratura de costela sem cinto; queda de moto gera escoriações específicas)`)
          partes.push(`(2) a data do atendimento é coerente com a data do evento?`)
          partes.push(`(3) lesões antigas ou crônicas listadas junto às recentes são red flag de inflação de danos.`)
        } else if (doc.tipoDoc === "outro") {
          partes.push(`INSTRUÇÃO: Identifique o tipo de documento, extraia todas as informações relevantes (datas, nomes,`)
          partes.push(`valores, números de protocolo) e avalie sua relevância para a análise do sinistro.`)
          partes.push(`Se o documento não tiver relação clara com o evento, registre isso em "alertas_documentais".`)
        }
      } else if (!doc.base64 && doc.erroSistema) {
        partes.push(`⚠ ERRO DO SISTEMA: o arquivo "${doc.nome}" foi enviado pelo analista mas não pôde ser lido por falha técnica (não é ausência do associado).`)
        partes.push(`Registre a integridade como "parcial" e nos próximos_passos oriente o analista a reenviar o arquivo para nova tentativa de leitura.`)
        partes.push(`NÃO trate como documento pendente do associado — o problema é técnico, não documental.`)
      } else if (!doc.base64) {
        partes.push(`⚠ PENDÊNCIA CRÍTICA: arquivo NÃO foi recebido — o documento não foi anexado. Registre como "ausente".`)
      } else if (doc.tipoDoc === "fotos_pdf") {
        partes.push(`✓ PDF DE FOTOS DO SINISTRO — o arquivo "${doc.nome}" foi anexado a esta mensagem para análise visual.`)
        partes.push(`INSTRUÇÃO CRÍTICA: Analise TODAS as páginas/fotos deste PDF como se fossem imagens do sinistro.`)
        partes.push(`Para cada foto visível no PDF, avalie:`)
        partes.push(`  1. O que está visível (veículo, danos, ambiente, contexto)`)
        partes.push(`  2. Extensão e localização dos danos (leve/moderado/grave, partes afetadas)`)
        partes.push(`  3. Consistência com o tipo de evento "${tipoEvento}" declarado`)
        partes.push(`  4. Sinais de antiguidade: ferrugem, oxidação nas bordas, sujeira acumulada`)
        partes.push(`  5. Autenticidade: a foto parece tirada no momento do sinistro? Há edição ou montagem?`)
        partes.push(`  6. Consistência entre as fotos: iluminação, posição dos danos e ambiente são coerentes?`)
        partes.push(`Use os resultados para preencher "analise_imagens" no JSON de resposta.`)
        partes.push(`Se identificar inconsistências entre fotos, registre em "indicadores_fraude".`)
      } else {
        partes.push(`✓ DOCUMENTO RECEBIDO como PDF escaneado — o arquivo "${doc.nome}" foi anexado a esta mensagem para leitura visual direta.`)
        partes.push(`INSTRUÇÃO CRÍTICA: Leia o PDF "${doc.nome}" anexado e extraia TODAS as informações visíveis nele.`)
        if (doc.tipoDoc === "bo") {
          partes.push(`Extraia: número do BO, delegacia, data/hora do registro, data/hora declarada do evento, narrativa completa dos fatos.`)
          partes.push(`Compare a narrativa do BO com o relato do associado e registre qualquer divergência em "contradicoes".`)
        } else if (doc.tipoDoc === "crlv") {
          partes.push(`Extraia: proprietário, CPF/CNPJ, placa, chassi, RENAVAM, ano/modelo, município, restrições (alienação, furto, impedimento) e data de emissão.`)
          partes.push(`CRÍTICO: Leia todas as datas EXATAMENTE como estão impressas no documento — NÃO corrija, NÃO interprete, NÃO converta.`)
          partes.push(`Ex: se o documento mostra "11/01/2026", registre "11/01/2026" — jamais altere o mês ou qualquer dígito.`)
          partes.push(`Verifique se o proprietário bate com o associado declarado — discrepância é RED FLAG CRÍTICO.`)
        } else if (doc.tipoDoc === "cnh") {
          partes.push(`Extraia: nome, CPF, data de validade, categoria. Verifique se a CNH está dentro da validade.`)
        } else {
          partes.push(`Extraia todas as informações relevantes visíveis no documento (datas, nomes, números, valores).`)
        }
        partes.push(`Registre a integridade como "ok" se o documento estiver legível, ou "parcial" se apenas parte estiver legível.`)
      }
      partes.push(``)
    }
  }

  // ── Instrução final ───────────────────────────────────────────────────────
  partes.push(``)
  partes.push(`════════════════════════════════════════`)
  partes.push(`INSTRUÇÃO FINAL — LEIA COM ATENÇÃO`)
  partes.push(`════════════════════════════════════════`)
  partes.push(``)
  partes.push(`Produza uma análise COMPLETA, ESPECÍFICA e SEM REPETIÇÕES.`)
  partes.push(``)
  partes.push(`REGRAS ANTI-REPETIÇÃO (crítico):`)
  partes.push(`- "pontos_atencao" ≠ "indicadores_fraude" ≠ "contradicoes": cada um deve conter itens exclusivos`)
  partes.push(`- "analise_audio.contradicoes_com_relato" só deve conter contradições que NÃO estão em "contradicoes"`)
  partes.push(`- "analise_audio.padroes_suspeitos" ≠ "analise_audio.momentos_alterados": padrões são recorrentes, momentos são pontuais`)
  partes.push(``)
  partes.push(`REGRAS DE TIMESTAMP (crítico):`)
  partes.push(`- NUNCA cite um timestamp que não está na lista de timestamps disponíveis`)
  partes.push(`- Se precisar referenciar algo sem timestamp, cite o TRECHO DE TEXTO entre aspas`)
  partes.push(``)
  partes.push(`Aplique todos os red flags do tipo "${tipoEventoLabel[tipoEvento]}".`)
  partes.push(`Cruze todas as fontes: relato escrito, ligação, imagens, documentos.`)
  partes.push(`Retorne o JSON conforme especificado. Apenas o JSON — sem texto extra.`)

  return partes.join("\n")
}
