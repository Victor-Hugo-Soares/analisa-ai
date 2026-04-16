import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getGestorUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data } = await supabase.from('usuarios').select('role, empresa_id').eq('id', user.id).single()
  if (!data || (data.role !== 'gestor' && data.role !== 'master')) return null
  return { userId: user.id, role: data.role as string, empresaId: data.empresa_id as string }
}

// PATCH /api/usuarios/[id]  — edita usuário da própria empresa
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gestor = await getGestorUser(req)
  if (!gestor) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const supabase = createServerClient()

  // Verifica que o usuário alvo pertence à mesma empresa
  const { data: target } = await supabase
    .from('usuarios')
    .select('empresa_id, role')
    .eq('id', id)
    .single()

  if (!target || target.empresa_id !== gestor.empresaId) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }
  if (target.role === 'master') {
    return NextResponse.json({ error: 'Não é possível editar usuário master' }, { status: 403 })
  }
  // Gestor não pode editar outro gestor (apenas master pode)
  if (gestor.role === 'gestor' && target.role === 'gestor' && id !== gestor.userId) {
    return NextResponse.json({ error: 'Sem permissão para editar este usuário' }, { status: 403 })
  }

  const updates: Record<string, unknown> = {}
  if (body.nome) updates.nome = body.nome
  // Gestor só pode manter role "usuario"; master pode definir "gestor" também
  if (body.role) {
    if (gestor.role === 'master') {
      if (body.role !== 'master') updates.role = body.role
    } else {
      if (body.role === 'usuario') updates.role = body.role
    }
  }

  const { data, error } = await supabase
    .from('usuarios')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (body.senha) {
    await supabase.auth.admin.updateUserById(id, { password: body.senha })
  }

  return NextResponse.json({ usuario: data })
}

// DELETE /api/usuarios/[id]  — exclui usuário da própria empresa
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gestor = await getGestorUser(req)
  if (!gestor) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  // Não pode excluir a si mesmo
  if (id === gestor.userId) {
    return NextResponse.json({ error: 'Não é possível excluir seu próprio usuário' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: target } = await supabase
    .from('usuarios')
    .select('empresa_id, role')
    .eq('id', id)
    .single()

  if (!target || target.empresa_id !== gestor.empresaId) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }
  if (target.role === 'master') {
    return NextResponse.json({ error: 'Não é possível excluir usuário master' }, { status: 403 })
  }
  // Gestor só pode excluir "usuario", não outro "gestor"
  if (gestor.role === 'gestor' && target.role === 'gestor') {
    return NextResponse.json({ error: 'Sem permissão para excluir este usuário' }, { status: 403 })
  }

  await supabase.from('usuarios').delete().eq('id', id)
  await supabase.auth.admin.deleteUser(id)

  return NextResponse.json({ success: true })
}
