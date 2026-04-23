import { NextRequest, NextResponse } from "next/server"
import { openai } from "@/lib/openai"
import { createServerClient } from "@/lib/supabase"

// pdfjs-dist and pdf-parse need DOMMatrix — polyfill for Node.js
if (typeof globalThis.DOMMatrix === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).DOMMatrix = class DOMMatrix {
    constructor() { return new Proxy(this, { get: (_, p) => typeof p === "string" && p !== "then" ? 0 : undefined }) }
  }
}

export const maxDuration = 120
export const dynamic = "force-dynamic"

interface ArquivoPayload {
  nome: string
  tipo: "documento" | "imagem"
  base64?: string
  storagePath?: string
}

interface VistoriaPayload {
  arquivos: ArquivoPayload[]
  empresaId: string
}

const SYSTEM_PROMPT = `Você é um analista especializado em vistoria veicular da Loma Proteção Veicular.

REGRA FUNDAMENTAL SOBRE O LAUDO:
- O campo QUILOMETRAGEM do laudo é preenchido automaticamente e frequentemente aparece como 0.00 mesmo quando o odômetro mostra KM real. IGNORE completamente o campo KM do laudo. Use SOMENTE a foto do odômetro.
- Coordenadas GPS com valor 0.0000000 no laudo são erro de sistema — IGNORE-as e não gere alerta.
- Os demais campos do laudo (PLACA, CHASSI, NOME, ANO, CÂMBIO, GNV) SÃO confiáveis e devem ser usados para cruzar com as fotos.

Analise as fotos do veículo e determine se a vistoria deve ser aprovada.

FOTOS OBRIGATÓRIAS em uma vistoria Loma (verifique se todas estão presentes e corretas):
1. Rosto do associado com veículo ao fundo OU segurando documento com foto
2. Frente completa do veículo com placa visível
3. Lado motorista completo — vidros fechados, sem cortar frente/traseira
4. Câmbio (validação manual ou automático)
5. Painel completo (interior frontal do veículo)
6. Para-brisa interno — ângulo pelo banco traseiro, todo o vidro aparecendo
7. Odômetro com KM total — aguardar luzes de atenção apagarem
8. Traseira completa do veículo com placa visível
9. Porta-malas aberto e completamente vazio
10. Lado passageiro completo — vidros fechados, sem cortar frente/traseira
11. Motor completo mostrando placa do motor
12. Chassi gravação lataria com 17 dígitos legíveis
13. Chave original (mais reserva se houver)

CRITÉRIOS DE AVALIAÇÃO:
- Qualidade das fotos: nitidez, ângulo correto, iluminação adequada
- Veículo sem danos, avarias ou arranhados não declarados
- Placa visível e legível nas fotos de frente e traseira — conferir se a placa visível nas fotos bate com o campo PLACA do laudo e se frente e traseira mostram a mesma placa
- Chassi com 17 dígitos legíveis na lataria (não plaqueta ou outro tipo de marcação) — conferir se bate com campo CHASSI do laudo
- KM: leia exclusivamente da foto do odômetro. Nunca compare com o campo KM do laudo. Suspeito apenas se odômetro claramente zerado na foto para veículo com ano antigo.
- GPS: use as coordenadas do laudo (quando diferentes de 0.0000000) para verificar se as fotos foram tiradas no mesmo local. Fotos em locais muito distintos são suspeitas. GPS = 0.0000000 significa dado não disponível — não gerar alerta.
- Tipo de câmbio na foto deve bater com o declarado (manual x automático)
- GNV: se declarado "NÃO", verificar se não há kit GNV no motor
- Porta-malas deve estar aberto e VAZIO — qualquer objeto deve ser apontado
- Vidros laterais fechados nas fotos externas laterais
- Foto do associado deve mostrar claramente o rosto com veículo ao fundo ou documento com foto

DECISÃO DE VEREDICTO:
- "Aprovada": todos os itens em ordem, pode prosseguir com cadastro
- "Não Aprovada": problemas graves que impedem aprovação (danos no veículo, dados inconsistentes, suspeita de fraude, documentação incorreta)
- "Repetir Foto": uma ou mais fotos com qualidade ruim, ângulo errado ou conteúdo incorreto — sem problemas no veículo em si

Retorne APENAS JSON válido, sem texto, markdown ou código:
{
  "veredicto": "Aprovada",
  "fotos_repetir": [{"nome": "nome da foto conforme lista", "motivo": "motivo objetivo"}],
  "dados_extraidos": {
    "associado": "nome completo",
    "cpf": "cpf formatado",
    "placa": "placa",
    "chassi": "chassi 17 dígitos",
    "modelo": "fabricante + modelo completo",
    "ano": "ano modelo",
    "km": "km lido visualmente na foto do odômetro (ignorar campo de texto do laudo se 0.00)",
    "cambio": "Manual ou Automático",
    "gnv": false,
    "acessorios": ["acessório 1"]
  },
  "pontos_aprovados": ["descrição do ponto aprovado"],
  "pontos_atencao": ["descrição do ponto de atenção"],
  "alertas": ["alerta crítico — preencher apenas se houver problemas sérios"],
  "resumo": "parágrafo objetivo resumindo a análise e a decisão"
}`

async function resolveBase64(arquivo: ArquivoPayload): Promise<string | null> {
  if (arquivo.storagePath) {
    try {
      const supabase = createServerClient()
      const { data, error } = await supabase.storage
        .from("sinistros-arquivos")
        .createSignedUrl(arquivo.storagePath, 300)
      if (error || !data?.signedUrl) return null
      const res = await fetch(data.signedUrl)
      if (!res.ok) return null
      const arrayBuffer = await res.arrayBuffer()
      const ext = arquivo.nome.split(".").pop()?.toLowerCase() ?? ""
      const mimeMap: Record<string, string> = {
        jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
        webp: "image/webp", pdf: "application/pdf",
      }
      const mime = mimeMap[ext] ?? "application/octet-stream"
      return `data:${mime};base64,${Buffer.from(arrayBuffer).toString("base64")}`
    } catch { return null }
  }
  return arquivo.base64 ?? null
}

function generateProtocolo(): string {
  return `VST-${Date.now().toString(36).toUpperCase().slice(-6)}`
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", user.id)
      .single()

    if (!usuario?.empresa_id) return NextResponse.json({ vistorias: [] })

    const { data: vistorias } = await supabase
      .from("vistorias")
      .select("id, protocolo, associado_nome, placa, veiculo_modelo, veiculo_ano, veredicto, criado_em")
      .eq("empresa_id", usuario.empresa_id)
      .order("criado_em", { ascending: false })
      .limit(20)

    return NextResponse.json({ vistorias: vistorias ?? [] })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    const body = (await req.json()) as VistoriaPayload
    const { arquivos, empresaId } = body

    if (!arquivos?.length || !empresaId) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }


    type ContentPart =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }

    const messageContent: ContentPart[] = []
    const textParts: string[] = []

    for (const arquivo of arquivos) {
      const base64 = await resolveBase64(arquivo)
      if (!base64) continue

      const isPdf = arquivo.nome.toLowerCase().endsWith(".pdf") || arquivo.tipo === "documento"

      if (isPdf) {
        // PDFs chegam aqui apenas como fallback — normalmente o cliente
        // renderiza as páginas como imagens antes de enviar.
        // Extraímos o texto para metadados (associado, placa, chassi…).
        try {
          const rawData = base64.includes(",") ? base64.split(",")[1] : base64
          const uint8 = new Uint8Array(Buffer.from(rawData, "base64"))
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { PDFParse } = require("pdf-parse") as {
            PDFParse: new (opts: { data: Uint8Array }) => {
              getText: () => Promise<{ text: string }>
              destroy: () => Promise<void>
            }
          }
          const parser = new PDFParse({ data: uint8 })
          const parsed = await parser.getText()
          await parser.destroy()
          textParts.push(`=== LAUDO DE VISTORIA (${arquivo.nome}) ===\n${parsed.text}`)
        } catch (pdfErr) {
          console.error("[Vistoria] pdf-parse falhou:", String(pdfErr))
          textParts.push(`[Erro ao processar PDF: ${arquivo.nome}]`)
        }
      } else {
        const ext = arquivo.nome.split(".").pop()?.toLowerCase() ?? "jpeg"
        const mimeMap: Record<string, string> = {
          jpg: "image/jpeg", jpeg: "image/jpeg",
          png: "image/png", webp: "image/webp",
        }
        const mime = mimeMap[ext] ?? "image/jpeg"
        const url = base64.startsWith("data:") ? base64 : `data:${mime};base64,${base64}`
        messageContent.push({ type: "image_url", image_url: { url } })
      }
    }

    if (textParts.length > 0) {
      messageContent.unshift({ type: "text", text: textParts.join("\n\n") })
    }

    if (messageContent.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo válido processado" }, { status: 400 })
    }

    messageContent.push({
      type: "text",
      text: "Analise o laudo e/ou fotos acima e retorne o JSON de análise.",
    })

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      max_tokens: 2000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: messageContent },
      ],
    })

    const raw = response.choices[0].message.content ?? ""
    let analise: Record<string, unknown>
    try {
      const match = raw.match(/\{[\s\S]*\}/)
      analise = JSON.parse(match ? match[0] : raw)
    } catch {
      console.error("[Vistoria] JSON inválido:", raw)
      return NextResponse.json({ error: "IA retornou resposta inválida", raw }, { status: 500 })
    }

    const protocolo = generateProtocolo()
    const dados = analise.dados_extraidos as Record<string, unknown> | undefined

    const supabase = createServerClient()
    const { data: saved, error: saveError } = await supabase
      .from("vistorias")
      .insert({
        empresa_id: empresaId,
        protocolo,
        associado_nome: dados?.associado ?? null,
        associado_cpf: dados?.cpf ?? null,
        placa: dados?.placa ?? null,
        veiculo_modelo: dados?.modelo ?? null,
        veiculo_ano: dados?.ano ?? null,
        veredicto: analise.veredicto,
        analise,
      })
      .select()
      .single()

    if (saveError) {
      console.error("[Vistoria] Erro ao salvar:", saveError)
    }

    return NextResponse.json({
      vistoria: {
        id: saved?.id ?? null,
        protocolo,
        veredicto: analise.veredicto,
        analise,
        criado_em: saved?.criado_em ?? new Date().toISOString(),
      },
    })
  } catch (e) {
    console.error("[Vistoria] Erro:", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
