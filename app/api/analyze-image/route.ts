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
  contexto?: string
  // Modo comparação: enviar duas imagens (original + suspeita) juntas
  modo_comparacao?: boolean
  indice_original?: number // qual índice é o original (default 0)
}

export interface ChecklistItem {
  indicador: string
  resultado: "OK" | "SUSPEITO" | "ADULTERADO" | "N/A"
  detalhe: string
}

export interface ResultadoImagemIndividual {
  arquivo: string
  veredicto: "AUTENTICA" | "SUSPEITA" | "ADULTERADA"
  confianca: "ALTA" | "MEDIA" | "BAIXA"
  checklist: ChecklistItem[]
  indicadores_fraude: string[]
  indicadores_autenticidade: string[]
  observacoes: string
}

export interface ResultadoComparacao {
  modo: "comparacao"
  arquivo_original: string
  arquivo_suspeito: string
  veredicto: "AUTENTICA" | "SUSPEITA" | "ADULTERADA"
  confianca: "ALTA" | "MEDIA" | "BAIXA"
  diferencas_detectadas: string[]
  areas_alteradas: string[]
  observacoes: string
}

export interface ResultadoAnaliseImagem {
  modo: "individual" | "comparacao"
  resultados?: ResultadoImagemIndividual[]
  comparacao?: ResultadoComparacao
  veredicto_geral: "AUTENTICA" | "SUSPEITA" | "ADULTERADA"
  resumo: string
  recomendacao: string
}

function getMimeType(nome: string): string {
  const ext = nome.split(".").pop()?.toLowerCase() ?? ""
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    webp: "image/webp", gif: "image/gif",
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
    } catch { return null }
  }
  return imagem.base64 ?? null
}

// ─── Prompt individual com checklist forçado ──────────────────────────────────
const PROMPT_INDIVIDUAL = `Você é um perito forense especializado em detecção de adulteração digital em imagens de sinistros veiculares.

POSTURA OBRIGATÓRIA: assuma que a imagem PODE ter sido manipulada. Seu trabalho é investigar cada indicador de forma independente, sem se deixar influenciar pela impressão geral. Muitos inpaintings modernos são quase perfeitos — procure as inconsistências sutis.

AVALIE CADA INDICADOR ABAIXO COM RIGOR:

1. LOCAL E CONTEXTO DA CENA
   - Onde o veículo está fotografado? Quintal residencial, garagem, estacionamento privado?
   - Dano severo de colisão (amassado profundo, destruição de para-choque, lanterna quebrada) fotografado em local privado e sem qualquer elemento típico de cena de acidente (escombros, pista, outro veículo, serviço de emergência) é ALTAMENTE SUSPEITO.
   - Acidente real geralmente é registrado no local do ocorrido, não em casa.
   - Veículo com dano grave estacionado em posição organizada, sem marcas no chão = suspeito de staging ou edição digital.
   Resultado: OK / SUSPEITO / ADULTERADO / N/A

2. COMPOSIÇÃO E STAGING DA FOTO
   - A foto foi tirada de forma deliberada para documentar o dano (enquadramento central, distância ideal, boa iluminação)? Isso pode indicar preparação prévia.
   - Foto tirada em local próprio com fundo neutro idêntico ao que seria o fundo original do veículo (parede, muro, piso de garagem) = fortíssimo indício de que o dano foi adicionado digitalmente sobre uma foto original.
   - Ausência total de contexto acidental (sem testemunhos visuais, sem marcas de freada, sem debris) em imagem de dano severo = suspeito.
   Resultado: OK / SUSPEITO / ADULTERADO / N/A

3. BORDAS DO DANO
   - Amassados reais têm bordas irregulares com micro-fissuras, tinta lascada em camadas e estilhaços de primer visíveis.
   - Inpainting gera bordas suaves, com gradiente artificial ou transição abrupta demais.
   Resultado: OK / SUSPEITO / ADULTERADO / N/A

4. SOMBRAS E ILUMINAÇÃO NO DANO
   - Compare a sombra projetada pelo dano com as sombras de outros elementos do veículo (pneus, espelhos, soleira, emblemas).
   - A fonte de luz deve ser única e consistente. Sombra do dano em direção diferente = manipulação.
   Resultado: OK / SUSPEITO / ADULTERADO / N/A

5. TEXTURA E REFLEXOS NA ÁREA DO DANO
   - Metal amassado real gera reflexos complexos, variados e fragmentados.
   - Inpainting gera reflexos uniformes, "limpos demais" ou com brilho artificial na região editada.
   Resultado: OK / SUSPEITO / ADULTERADO / N/A

6. CONSISTÊNCIA DO RUÍDO DIGITAL (GRAIN)
   - A câmera gera ruído uniforme em toda a imagem.
   - Regiões editadas por IA têm padrão de noise visivelmente diferente — a área do dano pode parecer "mais limpa" ou "mais processada" que o entorno.
   Resultado: OK / SUSPEITO / ADULTERADO / N/A

7. ELEMENTOS ADJACENTES AO DANO
   - Dano estrutural profundo implica deformação em elementos físicos vizinhos (para-choque, pinos, molduras, dobradiças, aba de metal).
   - Dano profundo com tudo ao redor intacto e perfeito = fisicamente inconsistente.
   Resultado: OK / SUSPEITO / ADULTERADO / N/A

8. SUJEIRA E ACÚMULO AO REDOR DO DANO
   - Inpainting frequentemente apaga sujeira, poeira ou marcas de uso ao redor da área editada.
   - Se o restante do veículo está sujo/usado e a área do dano está estranhamente limpa = suspeito.
   Resultado: OK / SUSPEITO / ADULTERADO / N/A

9. COERÊNCIA FÍSICA DO DANO COM O VEÍCULO
   - O dano faz sentido para a física da colisão declarada? A direção da força, a profundidade e a extensão são coerentes?
   - Dano que parece "colado" sem integração com a estrutura do veículo = gerado artificialmente.
   Resultado: OK / SUSPEITO / ADULTERADO / N/A

10. ARTEFATOS DE GERAÇÃO POR IA
    - Verifique elementos próximos ao dano: placa, emblema, faróis, grade. Distorções, texto borrado ou geometria estranha nessas áreas indicam geração por IA.
    Resultado: OK / SUSPEITO / ADULTERADO / N/A

REGRA DE VEREDICTO:
- 1+ indicador ADULTERADO → veredicto ADULTERADA
- 1+ indicador SUSPEITO nos itens 1 ou 2 (LOCAL, STAGING) → veredicto mínimo SUSPEITA, independente dos demais
- 2+ indicadores SUSPEITO em qualquer item → veredicto SUSPEITA
- Todos OK ou N/A → veredicto AUTENTICA
- Confiança: ALTA se 3+ indicadores convergem, MEDIA se 1-2 convergem, BAIXA se apenas 1 com dúvida.

RESPONDA OBRIGATORIAMENTE em JSON exato (sem markdown):
{
  "checklist": [
    { "indicador": "LOCAL E CONTEXTO DA CENA", "resultado": "OK|SUSPEITO|ADULTERADO|N/A", "detalhe": "..." },
    { "indicador": "COMPOSIÇÃO E STAGING", "resultado": "OK|SUSPEITO|ADULTERADO|N/A", "detalhe": "..." },
    { "indicador": "BORDAS DO DANO", "resultado": "OK|SUSPEITO|ADULTERADO|N/A", "detalhe": "..." },
    { "indicador": "SOMBRAS E ILUMINAÇÃO", "resultado": "OK|SUSPEITO|ADULTERADO|N/A", "detalhe": "..." },
    { "indicador": "TEXTURA E REFLEXOS", "resultado": "OK|SUSPEITO|ADULTERADO|N/A", "detalhe": "..." },
    { "indicador": "RUÍDO DIGITAL", "resultado": "OK|SUSPEITO|ADULTERADO|N/A", "detalhe": "..." },
    { "indicador": "ELEMENTOS ADJACENTES", "resultado": "OK|SUSPEITO|ADULTERADO|N/A", "detalhe": "..." },
    { "indicador": "SUJEIRA AO REDOR", "resultado": "OK|SUSPEITO|ADULTERADO|N/A", "detalhe": "..." },
    { "indicador": "COERÊNCIA FÍSICA", "resultado": "OK|SUSPEITO|ADULTERADO|N/A", "detalhe": "..." },
    { "indicador": "ARTEFATOS DE IA", "resultado": "OK|SUSPEITO|ADULTERADO|N/A", "detalhe": "..." }
  ],
  "veredicto": "AUTENTICA|SUSPEITA|ADULTERADA",
  "confianca": "ALTA|MEDIA|BAIXA",
  "indicadores_fraude": ["apenas os indicadores com resultado ADULTERADO ou SUSPEITO"],
  "indicadores_autenticidade": ["apenas os indicadores com resultado OK"],
  "observacoes": "parágrafo técnico final explicando o raciocínio e o veredicto"
}`

// ─── Prompt de comparação (original vs suspeita) ──────────────────────────────
const PROMPT_COMPARACAO = `Você é um perito forense especializado em detecção de adulteração digital em imagens de sinistros veiculares.

Você receberá DUAS imagens do mesmo veículo:
- IMAGEM 1: original (referência de como o veículo estava antes)
- IMAGEM 2: suspeita (a que está sendo investigada)

Sua tarefa é comparar as duas imagens e identificar qualquer diferença — especialmente danos que aparecem na IMAGEM 2 mas não existem na IMAGEM 1 e que podem ter sido inseridos digitalmente.

ANALISE AS DIFERENÇAS:

1. NOVAS ÁREAS DANIFICADAS: quais regiões têm dano na imagem 2 mas não na imagem 1?
2. CONSISTÊNCIA DO DANO NOVO: as novas avarias têm bordas, sombras e texturas coerentes com dano físico real ou parecem inseridas?
3. ELEMENTOS ALTERADOS: há mudanças além dos danos (cor, acessórios, placa, fundo)?
4. QUALIDADE DA EDIÇÃO: o dano inserido integra-se naturalmente com o restante ou há sinais de inpainting (sombra errada, textura artificial, ruído diferente)?

REGRA DE VEREDICTO:
- Se há dano na imagem 2 ausente na 1 E com sinais de inserção digital → ADULTERADA
- Se há diferenças mas a causa é incerta → SUSPEITA
- Se as diferenças são explicáveis por ângulo/iluminação diferentes e o dano parece real → AUTENTICA

RESPONDA em JSON exato (sem markdown):
{
  "veredicto": "AUTENTICA|SUSPEITA|ADULTERADA",
  "confianca": "ALTA|MEDIA|BAIXA",
  "diferencas_detectadas": ["lista de todas as diferenças encontradas entre as imagens"],
  "areas_alteradas": ["lista das regiões do veículo que diferem entre as imagens"],
  "observacoes": "parágrafo técnico explicando o raciocínio e o veredicto final"
}`

async function analyzeIndividual(
  base64: string,
  nome: string,
  contexto?: string
): Promise<ResultadoImagemIndividual> {
  const imageUrl = base64.startsWith("data:") ? base64 : `data:image/jpeg;base64,${base64}`

  const textoParts = [PROMPT_INDIVIDUAL]
  if (contexto) textoParts.push(`\nCONTEXTO DO ANALISTA: ${contexto}`)
  textoParts.push(`\nArquivo em análise: ${nome}`)

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: textoParts.join("\n") },
        { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
      ],
    }],
    max_tokens: 1500,
    response_format: { type: "json_object" },
  })

  const content = response.choices[0]?.message?.content ?? "{}"
  let parsed: {
    checklist?: ChecklistItem[]
    veredicto?: string
    confianca?: string
    indicadores_fraude?: string[]
    indicadores_autenticidade?: string[]
    observacoes?: string
  }
  try { parsed = JSON.parse(content) } catch { parsed = {} }

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
    checklist: Array.isArray(parsed.checklist) ? parsed.checklist : [],
    indicadores_fraude: Array.isArray(parsed.indicadores_fraude) ? parsed.indicadores_fraude : [],
    indicadores_autenticidade: Array.isArray(parsed.indicadores_autenticidade)
      ? parsed.indicadores_autenticidade : [],
    observacoes: typeof parsed.observacoes === "string" ? parsed.observacoes : content,
  }
}

async function analyzeComparacao(
  base64Original: string,
  base64Suspeita: string,
  nomeOriginal: string,
  nomeSuspeita: string,
  contexto?: string
): Promise<ResultadoComparacao> {
  const urlOriginal = base64Original.startsWith("data:") ? base64Original : `data:image/jpeg;base64,${base64Original}`
  const urlSuspeita = base64Suspeita.startsWith("data:") ? base64Suspeita : `data:image/jpeg;base64,${base64Suspeita}`

  const textoParts = [PROMPT_COMPARACAO]
  if (contexto) textoParts.push(`\nCONTEXTO DO ANALISTA: ${contexto}`)
  textoParts.push(`\nIMAGEM 1 (original): ${nomeOriginal}\nIMAGEM 2 (suspeita): ${nomeSuspeita}`)

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: textoParts.join("\n") },
        { type: "image_url", image_url: { url: urlOriginal, detail: "high" } },
        { type: "image_url", image_url: { url: urlSuspeita, detail: "high" } },
      ],
    }],
    max_tokens: 1500,
    response_format: { type: "json_object" },
  })

  const content = response.choices[0]?.message?.content ?? "{}"
  let parsed: {
    veredicto?: string
    confianca?: string
    diferencas_detectadas?: string[]
    areas_alteradas?: string[]
    observacoes?: string
  }
  try { parsed = JSON.parse(content) } catch { parsed = {} }

  const veredictos = ["AUTENTICA", "SUSPEITA", "ADULTERADA"] as const
  const confiancas = ["ALTA", "MEDIA", "BAIXA"] as const

  return {
    modo: "comparacao",
    arquivo_original: nomeOriginal,
    arquivo_suspeito: nomeSuspeita,
    veredicto: veredictos.includes(parsed.veredicto as never)
      ? (parsed.veredicto as ResultadoComparacao["veredicto"])
      : "SUSPEITA",
    confianca: confiancas.includes(parsed.confianca as never)
      ? (parsed.confianca as ResultadoComparacao["confianca"])
      : "BAIXA",
    diferencas_detectadas: Array.isArray(parsed.diferencas_detectadas) ? parsed.diferencas_detectadas : [],
    areas_alteradas: Array.isArray(parsed.areas_alteradas) ? parsed.areas_alteradas : [],
    observacoes: typeof parsed.observacoes === "string" ? parsed.observacoes : content,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeImagePayload
    const { imagens, contexto, modo_comparacao, indice_original = 0 } = body

    if (!imagens || !Array.isArray(imagens) || imagens.length === 0) {
      return NextResponse.json({ error: "Nenhuma imagem enviada." }, { status: 400 })
    }
    if (imagens.length > 10) {
      return NextResponse.json({ error: "Máximo de 10 imagens por análise." }, { status: 400 })
    }

    // ─── MODO COMPARAÇÃO ──────────────────────────────────────────────────────
    if (modo_comparacao && imagens.length === 2) {
      const indSuspeito = indice_original === 0 ? 1 : 0
      const [b64Original, b64Suspeita] = await Promise.all([
        resolveBase64(imagens[indice_original]),
        resolveBase64(imagens[indSuspeito]),
      ])

      if (!b64Original || !b64Suspeita) {
        return NextResponse.json({ error: "Não foi possível carregar as imagens." }, { status: 400 })
      }

      const comparacao = await analyzeComparacao(
        b64Original, b64Suspeita,
        imagens[indice_original].nome, imagens[indSuspeito].nome,
        contexto
      )

      const resumo = {
        ADULTERADA: "Comparação detectou dano ausente na imagem original que foi inserido digitalmente na imagem suspeita.",
        SUSPEITA: "Comparação identificou diferenças entre as imagens com elementos inconsistentes que requerem verificação adicional.",
        AUTENTICA: "Comparação não detectou inserção digital de danos. As diferenças são coerentes com dano físico real.",
      }[comparacao.veredicto]

      const recomendacao = {
        ADULTERADA: "Solicitar vistoria presencial imediata. Não processar o sinistro.",
        SUSPEITA: "Solicitar fotos adicionais e/ou vídeo. Considerar vistoria presencial.",
        AUTENTICA: "Imagens consistentes. Prosseguir análise normal do evento.",
      }[comparacao.veredicto]

      return NextResponse.json({
        modo: "comparacao",
        comparacao,
        veredicto_geral: comparacao.veredicto,
        resumo,
        recomendacao,
      } satisfies ResultadoAnaliseImagem)
    }

    // ─── MODO INDIVIDUAL ──────────────────────────────────────────────────────
    const resultados: ResultadoImagemIndividual[] = []

    for (const imagem of imagens) {
      const base64 = await resolveBase64(imagem)
      if (!base64) {
        resultados.push({
          arquivo: imagem.nome,
          veredicto: "SUSPEITA",
          confianca: "BAIXA",
          checklist: [],
          indicadores_fraude: [],
          indicadores_autenticidade: [],
          observacoes: "Não foi possível carregar a imagem para análise.",
        })
        continue
      }
      try {
        resultados.push(await analyzeIndividual(base64, imagem.nome, contexto))
      } catch (e) {
        console.error(`[AnaliseImagem] Erro ao analisar ${imagem.nome}:`, e)
        resultados.push({
          arquivo: imagem.nome,
          veredicto: "SUSPEITA",
          confianca: "BAIXA",
          checklist: [],
          indicadores_fraude: [],
          indicadores_autenticidade: [],
          observacoes: "Erro ao processar a imagem.",
        })
      }
    }

    const veredito_geral: ResultadoAnaliseImagem["veredicto_geral"] =
      resultados.some((r) => r.veredicto === "ADULTERADA") ? "ADULTERADA" :
      resultados.some((r) => r.veredicto === "SUSPEITA") ? "SUSPEITA" : "AUTENTICA"

    const adulteradas = resultados.filter((r) => r.veredicto === "ADULTERADA").length
    const suspeitas = resultados.filter((r) => r.veredicto === "SUSPEITA").length
    const total = resultados.length

    const resumo = veredito_geral === "ADULTERADA"
      ? `Análise detectou ${adulteradas} imagem(ns) com sinais claros de adulteração digital em ${total} analisada(s).`
      : veredito_geral === "SUSPEITA"
      ? `Análise identificou ${suspeitas} imagem(ns) com elementos inconsistentes em ${total} analisada(s).`
      : `Todas as ${total} imagem(ns) apresentam características de autenticidade.`

    const recomendacao = veredito_geral === "ADULTERADA"
      ? "Solicitar vistoria presencial imediata. Não processar o sinistro."
      : veredito_geral === "SUSPEITA"
      ? "Solicitar fotos adicionais em outros ângulos e/ou vídeo curto. Considerar vistoria presencial."
      : "Imagens consistentes com autenticidade. Prosseguir análise normal do evento."

    return NextResponse.json({
      modo: "individual",
      resultados,
      veredicto_geral: veredito_geral,
      resumo,
      recomendacao,
    } satisfies ResultadoAnaliseImagem)
  } catch (e) {
    console.error("[AnaliseImagem] Erro geral:", e)
    return NextResponse.json({ error: "Erro interno ao processar análise." }, { status: 500 })
  }
}
