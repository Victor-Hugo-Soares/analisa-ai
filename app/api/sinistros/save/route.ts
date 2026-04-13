import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { saveSinistroDB } from '@/lib/db'
import type { Sinistro } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const { sinistro, empresaId }: { sinistro: Sinistro; empresaId: string } =
      await req.json()

    let usuarioId: string | undefined
    if (token) {
      const supabase = createServerClient()
      const {
        data: { user },
      } = await supabase.auth.getUser(token)
      usuarioId = user?.id
    }

    await saveSinistroDB(sinistro, empresaId, usuarioId)

    // Cria notificação para o gestor da empresa
    const supabase = createServerClient()
    const nome = sinistro.dados?.nomeSegurado ?? 'Associado'
    const tipo = sinistro.tipoEvento ?? 'evento'
    await supabase.from('notificacoes').insert({
      empresa_id: empresaId,
      titulo: 'Novo evento registrado',
      mensagem: `${nome} — ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} (${sinistro.id})`,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
