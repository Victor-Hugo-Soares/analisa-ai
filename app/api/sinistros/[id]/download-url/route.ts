import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const storagePath = searchParams.get('path')

  if (!storagePath) {
    return NextResponse.json({ error: 'Path não informado' }, { status: 400 })
  }

  // Verifica que o storagePath pertence ao sinistro informado (segurança básica)
  // Formato do path: {empresaId}/{sinistroId}/{timestamp}-{fileName}
  const segments = storagePath.split('/')
  if (segments.length < 3 || segments[1] !== id) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase.storage
    .from('sinistros-arquivos')
    .createSignedUrl(storagePath, 60 * 5) // expira em 5 minutos

  if (error || !data) {
    return NextResponse.json({ error: 'Não foi possível gerar o link' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
