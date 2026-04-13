import { NextRequest, NextResponse } from "next/server"
import { openai, SYSTEM_PROMPT, AUDIO_TONE_PROMPT } from "@/lib/openai"
import { createServerClient } from "@/lib/supabase"
import type { TipoEvento, DadosSinistro } from "@/lib/types"

export const maxDuration = 300

interface ArquivoPayload {
  nome: string
  tipo: "audio" | "documento" | "imagem"
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
      if (!base64) continue
      try {
        console.log(`[Audio] Transcrevendo: ${audio.nome}`)
        const transcricao = await transcribeAudio(base64, audio.nome)
        console.log(`[Audio] Transcrição concluída (${transcricao.length} chars)`)

        // Segunda etapa: análise de tom e comportamento vocal via GPT-4o
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
      if (!base64) continue
      try {
        console.log(`[Imagem] Analisando: ${imagem.nome}`)
        const descricao = await analyzeImage(base64, imagem.nome, tipoEventoLabel[tipoEvento])
        descricoesImagens.push({ arquivo: imagem.nome, descricao })
        console.log(`[Imagem] Análise concluída`)
      } catch (e) {
        console.error("[Imagem] Erro:", e)
        descricoesImagens.push({
          arquivo: imagem.nome,
          descricao: "[Erro ao processar imagem]",
        })
      }
    }

    // ─── 3. Montar contexto completo para análise final ──────────────────────
    const contexto = buildContexto({
      tipoEvento,
      dados,
      transcricoesComAnalise,
      descricoesImagens,
      arquivosDoc,
    })

    console.log(`[Análise] Enviando contexto ao GPT-4o (${contexto.length} chars)`)

    // ─── 4. Análise final com GPT-4o ─────────────────────────────────────────
    const analiseResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: contexto },
      ],
      temperature: 0.15,
      max_tokens: 5000,
      response_format: { type: "json_object" },
    })

    const analiseText = analiseResponse.choices[0]?.message?.content ?? "{}"
    console.log(`[Análise] Resposta recebida (${analiseText.length} chars)`)

    const analise = JSON.parse(analiseText)

    // Injetar transcrição completa na analise_audio se houver
    if (transcricoesComAnalise.length > 0 && analise.analise_audio) {
      analise.analise_audio.transcricao_completa = transcricoesComAnalise
        .map((t) => `=== ${t.arquivo} ===\n${t.transcricao}`)
        .join("\n\n")
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
// ─────────────────────────────────────────────────────────────────────────────
async function resolveArquivoBase64(arquivo: ArquivoPayload): Promise<string | null> {
  if (arquivo.storagePath) {
    const supabase = createServerClient()
    const { data, error } = await supabase.storage
      .from("sinistros-arquivos")
      .createSignedUrl(arquivo.storagePath, 300)
    if (error || !data?.signedUrl) {
      console.error("[Storage] Erro ao gerar signed URL:", error)
      return null
    }
    const res = await fetch(data.signedUrl)
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    const mimeType = getMimeType(arquivo.nome)
    return `data:${mimeType};base64,${Buffer.from(arrayBuffer).toString("base64")}`
  }
  return arquivo.base64 ?? null
}

function getMimeType(nome: string): string {
  const ext = nome.split(".").pop()?.toLowerCase() ?? ""
  const map: Record<string, string> = {
    mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4",
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
// GPT-4o: Análise de tom e comportamento vocal
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeAudioTone(
  transcricao: string
): Promise<Record<string, unknown> | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: AUDIO_TONE_PROMPT },
        {
          role: "user",
          content: `Analise esta transcrição da ligação do segurado:\n\n${transcricao}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 2500,
      response_format: { type: "json_object" },
    })

    const content = response.choices[0]?.message?.content
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
    model: "gpt-4o",
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
  arquivosDoc: ArquivoPayload[]
}

function buildContexto({
  tipoEvento,
  dados,
  transcricoesComAnalise,
  descricoesImagens,
  arquivosDoc,
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
    partes.push(`Instruções: Avalie se os danos visíveis são coerentes com o tipo "${tipoEventoLabel[tipoEvento]}" e com o relato.`)
    partes.push(`Identifique sinais de oxidação nas bordas (dano antigo), ângulos suspeitos e inconsistências entre fotos.`)
  }

  // ── Documentos ────────────────────────────────────────────────────────────
  if (arquivosDoc.length > 0) {
    partes.push(``)
    partes.push(`════════════════════════════════════════`)
    partes.push(`DOCUMENTOS APRESENTADOS`)
    partes.push(`════════════════════════════════════════`)
    partes.push(`Arquivos: ${arquivosDoc.map((d) => d.nome).join(", ")}`)
    partes.push(`Avalie se os documentos são coerentes com o tipo de sinistro e se os nomes/tipos fazem sentido.`)
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
