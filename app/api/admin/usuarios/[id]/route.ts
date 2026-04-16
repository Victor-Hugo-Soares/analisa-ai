import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getMasterUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data } = await supabase.from('usuarios').select('role').eq('id', user.id).single()
  if (data?.role !== 'master') return null
  return { userId: user.id }
}

// PATCH /api/admin/usuarios/[id]  — edita usuário (master only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const master = await getMasterUser(req)
  if (!master) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const supabase = createServerClient()

  // Não deixa editar conta master
  const { data: target } = await supabase.from('usuarios').select('role').eq('id', id).single()
  if (target?.role === 'master') return NextResponse.json({ error: 'Não é possível editar usuário master' }, { status: 403 })

  const allowed = ['nome', 'role']
  const updates: Record<string, unknown> = {}
  for (const k of allowed) {
    if (body[k] !== undefined) updates[k] = body[k]
  }
  if (updates.role === 'master') delete updates.role

  const { data, error } = await supabase
    .from('usuarios')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Reset de senha se informada
  if (body.senha) {
    await supabase.auth.admin.updateUserById(id, { password: body.senha })
  }

  return NextResponse.json({ usuario: data })
}

// DELETE /api/admin/usuarios/[id]  — exclui usuário (master only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const master = await getMasterUser(req)
  if (!master) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const supabase = createServerClient()

  const { data: target } = await supabase.from('usuarios').select('role').eq('id', id).single()
  if (target?.role === 'master') return NextResponse.json({ error: 'Não é possível excluir usuário master' }, { status: 403 })

  await supabase.from('usuarios').delete().eq('id', id)
  await supabase.auth.admin.deleteUser(id)

  return NextResponse.json({ success: true })
}
