import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getUsuario(token: string) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return null
  const { data } = await supabase
    .from('usuarios')
    .select('empresa_id, role')
    .eq('id', user.id)
    .single()
  return data
}

// GET — lista notificações da empresa (só admin/master)
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const usuario = await getUsuario(token)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (usuario.role === 'usuario') return NextResponse.json({ notificacoes: [] })

  const supabase = createServerClient()
  const { data } = await supabase
    .from('notificacoes')
    .select('*')
    .eq('empresa_id', usuario.empresa_id)
    .order('criado_em', { ascending: false })
    .limit(20)

  return NextResponse.json({ notificacoes: data ?? [] })
}

// PATCH — marca todas como lidas
export async function PATCH(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const usuario = await getUsuario(token)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createServerClient()
  await supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('empresa_id', usuario.empresa_id)
    .eq('lida', false)

  return NextResponse.json({ success: true })
}
