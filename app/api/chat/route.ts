import { NextRequest } from "next/server"
import { openai } from "@/lib/openai"
import type { Sinistro } from "@/lib/types"

export const maxDuration = 60

function buildSystemPrompt(sinistro: Sinistro): string {
  const tipoLabel: Record<string, string> = {
    colisao: "Colisão",
    roubo: "Roubo",
    furto: "Furto",
    natureza: "Evento da Natureza",
    vidros: "Vidros",
  }

  return `Você é o assistente do IAnalista — um sistema de análise de sinistros veiculares com IA para associações de proteção veicular e seguradoras brasileiras.

O analista acabou de concluir a análise do sinistro abaixo. Você tem acesso completo a todos os dados e ao resultado da análise. Responda as dúvidas do usuário (analista ou gestor da associação) de forma direta, técnica e objetiva.

━━━━━ DADOS DO SINISTRO ━━━━━
ID: ${sinistro.id}
Tipo: ${tipoLabel[sinistro.tipoEvento] ?? sinistro.tipoEvento}
Segurado: ${sinistro.dados.nomeSegurado}
CPF: ${sinistro.dados.cpf}
Placa: ${sinistro.dados.placa}
Data/Hora: ${sinistro.dados.dataHora}
Local: ${sinistro.dados.local}
Relato do segurado: "${sinistro.dados.relato}"

━━━━━ RESULTADO DA ANÁLISE ━━━━━
${JSON.stringify(sinistro.analise, null, 2)}

━━━━━ INSTRUÇÕES ━━━━━
- Responda sempre com base nos dados acima — não invente informações
- Seja direto e técnico — o usuário é um analista ou gestor da associação
- Se perguntado sobre algo que não está nos dados, diga claramente o que falta
- Quando relevante, cite trechos específicos da análise para embasar sua resposta
- Respostas curtas e objetivas — evite repetir o que já está na análise, acrescente interpretação
- Se a pergunta envolver uma decisão de negócio (aprovar, recusar, acionar advogado), dê sua recomendação técnica mas deixe a decisão final com o usuário`
}

export async function POST(req: NextRequest) {
  const { sinistro, messages } = await req.json() as {
    sinistro: Sinistro
    messages: { role: "user" | "assistant"; content: string }[]
  }

  if (!sinistro?.analise) {
    return new Response("Análise não disponível.", { status: 400 })
  }

  const stream = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    stream: true,
    temperature: 0.3,
    max_tokens: 1024,
    messages: [
      { role: "system", content: buildSystemPrompt(sinistro) },
      ...messages,
    ],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ""
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
