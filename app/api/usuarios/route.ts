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

// GET /api/usuarios  — lista usuários da própria empresa (gestor/master)
export async function GET(req: NextRequest) {
  const gestor = await getGestorUser(req)
  if (!gestor) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('empresa_id', gestor.empresaId)
    .neq('role', 'master')
    .order('criado_em', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ usuarios: data })
}

// POST /api/usuarios  — cria usuário na própria empresa (gestor/master)
export async function POST(req: NextRequest) {
  const gestor = await getGestorUser(req)
  if (!gestor) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { nome, email, senha, role } = await req.json()
  if (!nome || !email || !senha) {
    return NextResponse.json({ error: 'nome, email e senha são obrigatórios' }, { status: 400 })
  }

  // Gestor só pode criar "usuario"; master pode criar "gestor" também
  const roleToCreate = gestor.role === 'master' ? (role ?? 'usuario') : 'usuario'
  if (roleToCreate === 'master') return NextResponse.json({ error: 'Não permitido' }, { status: 403 })

  const supabase = createServerClient()

  // Verificar limite de usuários da empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('limite_usuarios')
    .eq('id', gestor.empresaId)
    .single()

  const { count } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', gestor.empresaId)

  if (empresa && count !== null && count >= empresa.limite_usuarios) {
    return NextResponse.json(
      { error: `Limite de ${empresa.limite_usuarios} usuários atingido para esta empresa` },
      { status: 400 }
    )
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const { data, error } = await supabase.from('usuarios').insert({
    id: authData.user.id,
    empresa_id: gestor.empresaId,
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
