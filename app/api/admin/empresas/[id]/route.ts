import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

async function verificarMaster(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()
  if (usuario?.role !== 'master') return null
  return user
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verificarMaster(req)
  if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const camposPermitidos = ['limite_usuarios', 'nivel_acesso', 'ativo', 'plano']
  const update: Record<string, unknown> = {}
  for (const campo of camposPermitidos) {
    if (campo in body) update[campo] = body[campo]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('empresas')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ empresa: data })
}
