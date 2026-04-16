import { NextRequest, NextResponse } from 'next/server'
import { getSinistroDB, updateSinistroStatusDB } from '@/lib/db'
import { createServerClient } from '@/lib/supabase'
import type { StatusSinistro } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function getEmpresaId(req: NextRequest): Promise<string | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data } = await supabase.from('usuarios').select('empresa_id').eq('id', user.id).single()
  return data?.empresa_id ?? null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const empresaId = await getEmpresaId(req)
  if (!empresaId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const sinistro = await getSinistroDB(id)

  if (!sinistro) {
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  // Verifica que o sinistro pertence à empresa do usuário autenticado
  const supabase = createServerClient()
  const { data } = await supabase
    .from('sinistros')
    .select('empresa_id')
    .eq('id', id)
    .single()

  if (!data || data.empresa_id !== empresaId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  return NextResponse.json({ sinistro })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const empresaId = await getEmpresaId(req)
  if (!empresaId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params

  // Verifica que o sinistro pertence à empresa do usuário autenticado
  const supabase = createServerClient()
  const { data } = await supabase
    .from('sinistros')
    .select('empresa_id')
    .eq('id', id)
    .single()

  if (!data || data.empresa_id !== empresaId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { status } = await req.json() as { status: StatusSinistro }
  await updateSinistroStatusDB(id, status, empresaId)
  return NextResponse.json({ success: true })
}
