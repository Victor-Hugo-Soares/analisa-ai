import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json()
  const supabase = createServerClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  })
  if (error) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
  }

  // Buscar dados do usuário e empresa vinculada
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*, empresas(*)')
    .eq('id', data.user.id)
    .single()

  if (!usuario) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role ?? 'usuario',
      empresa_id: usuario.empresa_id,
      empresa_nome: usuario.empresas?.nome ?? '',
      empresa_cnpj: usuario.empresas?.cnpj ?? '',
    },
  })
}
