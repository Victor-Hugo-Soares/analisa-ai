import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Sem token' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createServerClient()

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return NextResponse.json({ error: 'Token inválido', detail: error?.message }, { status: 401 })
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, nome, email, role, empresa_id')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ auth_user: user.email, db_usuario: usuario })
}
