import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { nome, cnpj, email, senha, limite_usuarios, nivel_acesso, plano } = await req.json()
  const supabase = createServerClient()

  // 1. Criar usuário no Auth do Supabase
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // 2. Criar registro da empresa com limite e nível
  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .insert({
      nome,
      cnpj,
      email,
      limite_usuarios: limite_usuarios ?? 5,
      nivel_acesso: nivel_acesso ?? 'basico',
      plano: plano ?? 'Básico',
      ativo: true,
    })
    .select()
    .single()
  if (empresaError) {
    return NextResponse.json({ error: empresaError.message }, { status: 400 })
  }

  // 3. Criar usuário admin vinculado à empresa
  await supabase.from('usuarios').insert({
    id: authData.user.id,
    empresa_id: empresa.id,
    nome,
    email,
    role: 'admin',
  })

  return NextResponse.json({ success: true, empresa_id: empresa.id })
}
