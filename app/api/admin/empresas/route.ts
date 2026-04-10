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

export async function GET(req: NextRequest) {
  const user = await verificarMaster(req)
  if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const supabase = createServerClient()

  const { data: empresas, error } = await supabase
    .from('empresas')
    .select('*')
    .order('criado_em', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Contar usuários e sinistros por empresa
  const ids = empresas.map((e: { id: string }) => e.id)

  const [{ data: usuarios }, { data: sinistros }] = await Promise.all([
    supabase.from('usuarios').select('empresa_id').in('empresa_id', ids),
    supabase.from('sinistros').select('empresa_id, status').in('empresa_id', ids),
  ])

  const statsEmpresas = empresas.map((empresa: { id: string }) => ({
    ...empresa,
    total_usuarios: usuarios?.filter((u: { empresa_id: string }) => u.empresa_id === empresa.id).length ?? 0,
    total_sinistros: sinistros?.filter((s: { empresa_id: string }) => s.empresa_id === empresa.id).length ?? 0,
    sinistros_suspeitos: sinistros?.filter((s: { empresa_id: string; status: string }) => s.empresa_id === empresa.id && s.status === 'suspeito').length ?? 0,
  }))

  return NextResponse.json({ empresas: statsEmpresas })
}
