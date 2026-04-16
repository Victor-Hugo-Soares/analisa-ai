import { NextRequest, NextResponse } from "next/server"
import { openai } from "@/lib/openai"
import { createServerClient } from "@/lib/supabase"

export const maxDuration = 120
export const dynamic = "force-dynamic"

interface ImagemPayload {
  nome: string
  base64?: string
  storagePath?: string
}

interface AnalyzeImagePayload {
  imagens: ImagemPayload[]
  contexto?: string // suspeita ou observação opcional do analista
}

export interface ResultadoImagemIndividual {
  arquivo: string
  veredicto: "AUTENTICA" | "SUSPEITA" | "ADULTERADA"
  confianca: "ALTA" | "MEDIA" | "BAIXA"
  indicadores_fraude: string[]
  indicadores_autenticidade: string[]
  observacoes: string
}

export interface ResultadoAnaliseImagem {
  resultados: ResultadoImagemIndividual[]
  veredicto_geral: "AUTENTICA" | "SUSPEITA" | "ADULTERADA"
  resumo: string
  recomendacao: string
}

function getMimeType(nome: string): string {
  const ext = nome.split(".").pop()?.toLowerCase() ?? ""
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  }
  return map[ext] ?? "image/jpeg"
}

async function resolveBase64(imagem: ImagemPayload): Promise<string | null> {
  if (imagem.storagePath) {
    try {
      const supabase = createServerClient()
      const { data, error } = await supabase.storage
        .from("sinistros-arquivos")
        .createSignedUrl(imagem.storagePath, 300)
      if (error || !data?.signedUrl) return null
      const res = await fetch(data.signedUrl)
      if (!res.ok) return null
      const arrayBuffer = await res.arrayBuffer()
      const mimeType = getMimeType(imagem.nome)
      return `data:${mimeType};base64,${Buffer.from(arrayBuffer).toString("base64")}`
    } catch {
      return null
    }
  }
  return imagem.base64 ?? null
}

const PROMPT_ANALISE_AUTENTICIDADE = `Você é um perito forense especializado em detecção de adulteração digital em imagens de sinistros veiculares.

Sua tarefa é analisar EXCLUSIVAMENTE a autenticidade da imagem — se ela foi manipulada digitalmente ou se o dano visível foi inserido por IA (inpainting, Photoshop, Stable Diffusion, etc.).

FOCO DA ANÁLISE:
Você deve investigar os seguintes vetores de adulteração:

(A) DANO INSERIDO DIGITALMENTE (inpainting) — foto real com dano adicionado por IA/editor:
- Borda do dano: amassados reais têm bordas irregulares com micro-fissuras e tinta lascada em camadas. Borda suave ou com gradiente artificial = suspeito.
- Sombra do dano: compare a direção da sombra projetada pelo dano com sombras de outros elementos (pneu, espelho, soleira). Inconsistência = manipulação.
- Textura: metal amassado real gera reflexos complexos e irregulares. Reflexos uniformes ou "limpos demais" no dano = gerado artificialmente.
- Ruído digital: regiões editadas por IA têm padrão de grain/noise diferente do entorno. Área do dano "mais limpa" ou "mais granulada" que o restante = suspeito.
- Elementos adjacentes: dano estrutural profundo com para-choque/pinos/molduras adjacentes completamente intactos = inconsistente fisicamente.
- Sujeira: inpainting frequentemente apaga sujeira ao redor do dano gerado. Área do dano limpa quando o restante está sujo = suspeito.
- ATENÇÃO: ausência de fragmentos no chão NÃO é indicador de fraude — fotos frequentemente são tiradas após o veículo ser removido da cena.

(B) IMAGEM 100% GERADA POR IA:
- Bordas com artefatos em pneus, rodas, antenas, retrovisores.
- Texto ilegível ou deformado em placas, cartazes ou fundo.
- Pixel repetido em texturas de asfalto, grama ou céu.
- EXIF ausente (se visível nos metadados).
- Iluminação perfeitamente uniforme sem imperfeições naturais.
- Mãos/pessoas com anatomia incorreta se visíveis.

(C) EDIÇÃO/CAPTURA SECUNDÁRIA:
- Baixa nitidez com pixel quadrado visível (foto de tela).
- Padrão moiré (foto de foto impressa).
- Metadados inconsistentes.

RESPONDA OBRIGATORIAMENTE neste formato JSON exato (sem markdown, sem texto fora do JSON):
{
  "veredicto": "AUTENTICA" | "SUSPEITA" | "ADULTERADA",
  "confianca": "ALTA" | "MEDIA" | "BAIXA",
  "indicadores_fraude": ["lista de indicadores de manipulação encontrados, vazia se nenhum"],
  "indicadores_autenticidade": ["lista de elementos que confirmam autenticidade"],
  "observacoes": "parágrafo técnico explicando o raciocínio do veredicto"
}

Use ADULTERADA quando há evidências claras de manipulação.
Use SUSPEITA quando há elementos inconsistentes mas sem certeza.
Use AUTENTICA quando a imagem não apresenta indicadores de manipulação.
A confiança deve refletir o nível de certeza do seu veredicto.`

async function analyzeImageAuthenticity(
  base64: string,
  nome: string,
  contextoAnalista?: string
): Promise<ResultadoImagemIndividual> {
  const imageUrl = base64.startsWith("data:") ? base64 : `data:image/jpeg;base64,${base64}`

  const textoParts: string[] = [PROMPT_ANALISE_AUTENTICIDADE]
  if (contextoAnalista) {
    textoParts.push(`\nCONTEXTO DO ANALISTA: ${contextoAnalista}`)
  }
  textoParts.push(`\nArquivo em análise: ${nome}`)

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: textoParts.join("\n") },
          { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
        ],
      },
    ],
    max_tokens: 1000,
    response_format: { type: "json_object" },
  })

  const content = response.choices[0]?.message?.content ?? "{}"
  let parsed: {
    veredicto?: string
    confianca?: string
    indicadores_fraude?: string[]
    indicadores_autenticidade?: string[]
    observacoes?: string
  }

  try {
    parsed = JSON.parse(content)
  } catch {
    parsed = {}
  }

  const veredictos = ["AUTENTICA", "SUSPEITA", "ADULTERADA"] as const
  const confiancas = ["ALTA", "MEDIA", "BAIXA"] as const

  return {
    arquivo: nome,
    veredicto: veredictos.includes(parsed.veredicto as never)
      ? (parsed.veredicto as ResultadoImagemIndividual["veredicto"])
      : "SUSPEITA",
    confianca: confiancas.includes(parsed.confianca as never)
      ? (parsed.confianca as ResultadoImagemIndividual["confianca"])
      : "BAIXA",
    indicadores_fraude: Array.isArray(parsed.indicadores_fraude) ? parsed.indicadores_fraude : [],
    indicadores_autenticidade: Array.isArray(parsed.indicadores_autenticidade)
      ? parsed.indicadores_autenticidade
      : [],
    observacoes: typeof parsed.observacoes === "string" ? parsed.observacoes : content,
  }
}

function calcularVeredito(
  resultados: ResultadoImagemIndividual[]
): ResultadoAnaliseImagem["veredicto_geral"] {
  if (resultados.some((r) => r.veredicto === "ADULTERADA")) return "ADULTERADA"
  if (resultados.some((r) => r.veredicto === "SUSPEITA")) return "SUSPEITA"
  return "AUTENTICA"
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeImagePayload
    const { imagens, contexto } = body

    if (!imagens || !Array.isArray(imagens) || imagens.length === 0) {
      return NextResponse.json({ error: "Nenhuma imagem enviada." }, { status: 400 })
    }
    if (imagens.length > 10) {
      return NextResponse.json({ error: "Máximo de 10 imagens por análise." }, { status: 400 })
    }

    const resultados: ResultadoImagemIndividual[] = []

    for (const imagem of imagens) {
      const base64 = await resolveBase64(imagem)
      if (!base64) {
        resultados.push({
          arquivo: imagem.nome,
          veredicto: "SUSPEITA",
          confianca: "BAIXA",
          indicadores_fraude: [],
          indicadores_autenticidade: [],
          observacoes: "Não foi possível carregar a imagem para análise.",
        })
        continue
      }

      try {
        const resultado = await analyzeImageAuthenticity(base64, imagem.nome, contexto)
        resultados.push(resultado)
      } catch (e) {
        console.error(`[AnaliseImagem] Erro ao analisar ${imagem.nome}:`, e)
        resultados.push({
          arquivo: imagem.nome,
          veredicto: "SUSPEITA",
          confianca: "BAIXA",
          indicadores_fraude: [],
          indicadores_autenticidade: [],
          observacoes: "Erro ao processar a imagem.",
        })
      }
    }

    const veredito_geral = calcularVeredito(resultados)

    const adulteradas = resultados.filter((r) => r.veredicto === "ADULTERADA").length
    const suspeitas = resultados.filter((r) => r.veredicto === "SUSPEITA").length
    const autenticas = resultados.filter((r) => r.veredicto === "AUTENTICA").length
    const total = resultados.length

    let resumo = ""
    if (veredito_geral === "ADULTERADA") {
      resumo = `Análise detectou ${adulteradas} imagem(ns) com sinais claros de adulteração digital em ${total} imagem(ns) analisada(s). Não recomendado prosseguir sem vistoria presencial.`
    } else if (veredito_geral === "SUSPEITA") {
      resumo = `Análise identificou ${suspeitas} imagem(ns) com elementos inconsistentes em ${total} imagem(ns) analisada(s). Recomendada verificação adicional antes de qualquer aprovação.`
    } else {
      resumo = `Todas as ${autenticas} imagem(ns) analisada(s) apresentam características de autenticidade. Nenhum indicador de manipulação digital detectado.`
    }

    const recomendacao =
      veredito_geral === "ADULTERADA"
        ? "Solicitar vistoria presencial imediata. Não processar o sinistro até confirmação física do dano."
        : veredito_geral === "SUSPEITA"
        ? "Solicitar fotos adicionais em outros ângulos e/ou vídeo curto circulando o veículo. Considerar vistoria presencial."
        : "Imagens consistentes com autenticidade. Prosseguir análise normal do evento."

    const resultado: ResultadoAnaliseImagem = {
      resultados,
      veredicto_geral: veredito_geral,
      resumo,
      recomendacao,
    }

    return NextResponse.json(resultado)
  } catch (e) {
    console.error("[AnaliseImagem] Erro geral:", e)
    return NextResponse.json({ error: "Erro interno ao processar análise." }, { status: 500 })
  }
}
