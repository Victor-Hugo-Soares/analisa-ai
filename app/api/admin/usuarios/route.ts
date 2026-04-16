import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getMasterUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data } = await supabase.from('usuarios').select('role, empresa_id').eq('id', user.id).single()
  if (data?.role !== 'master') return null
  return { userId: user.id, role: data.role, empresaId: data.empresa_id }
}

// GET /api/admin/usuarios?empresa_id=xxx  — lista usuários (master only)
export async function GET(req: NextRequest) {
  const master = await getMasterUser(req)
  if (!master) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const empresaId = searchParams.get('empresa_id')

  let query = supabase
    .from('usuarios')
    .select('*, empresas(nome)')
    .neq('role', 'master')
    .order('criado_em', { ascending: false })

  if (empresaId) query = query.eq('empresa_id', empresaId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ usuarios: data })
}

// POST /api/admin/usuarios  — cria usuário em qualquer empresa (master only)
export async function POST(req: NextRequest) {
  const master = await getMasterUser(req)
  if (!master) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { empresa_id, nome, email, senha, role } = await req.json()
  if (!empresa_id || !nome || !email || !senha) {
    return NextResponse.json({ error: 'empresa_id, nome, email e senha são obrigatórios' }, { status: 400 })
  }

  const roleToCreate = (role && role !== 'master') ? role : 'usuario'

  const supabase = createServerClient()

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const { data, error } = await supabase.from('usuarios').insert({
    id: authData.user.id,
    empresa_id,
    nome,
    email,
    role: roleToCreate,
  }).select().single()

  if (error) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ usuario: data }, { status: 201 })
}
