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

// POST /api/admin/backfill-storage-paths
// Recupera os storage_path dos arquivos existentes que foram salvos com null.
// Lista o bucket Supabase por sinistro e faz match pelo nome do arquivo.
export async function POST(req: NextRequest) {
  const user = await verificarMaster(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const supabase = createServerClient()

  // Busca todos os arquivos sem storage_path, junto com empresa_id do sinistro
  const { data: arquivos, error: arquivosError } = await supabase
    .from('arquivos')
    .select('id, nome, sinistro_id, sinistros!inner(empresa_id)')
    .is('storage_path', null)

  if (arquivosError || !arquivos) {
    return NextResponse.json({ error: arquivosError?.message ?? 'Erro ao buscar arquivos' }, { status: 500 })
  }

  if (arquivos.length === 0) {
    return NextResponse.json({ message: 'Nenhum arquivo para recuperar.', atualizados: 0 })
  }

  // Agrupa por sinistro para minimizar chamadas ao Storage
  const porSinistro = new Map<string, { sinistroId: string; empresaId: string; arquivos: { id: string; nome: string }[] }>()

  for (const arq of arquivos) {
    const sinistro = arq.sinistros as unknown as { empresa_id: string }
    const key = arq.sinistro_id
    if (!porSinistro.has(key)) {
      porSinistro.set(key, { sinistroId: key, empresaId: sinistro.empresa_id, arquivos: [] })
    }
    porSinistro.get(key)!.arquivos.push({ id: arq.id, nome: arq.nome })
  }

  let atualizados = 0
  let naoEncontrados = 0
  const detalhes: string[] = []

  for (const { sinistroId, empresaId, arquivos: arqsDoSinistro } of porSinistro.values()) {
    const prefix = `${empresaId}/${sinistroId}/`

    // Lista arquivos no bucket nessa pasta
    const { data: listaStorage, error: listaError } = await supabase.storage
      .from('sinistros-arquivos')
      .list(`${empresaId}/${sinistroId}`, { limit: 200 })

    if (listaError || !listaStorage) {
      detalhes.push(`sinistro ${sinistroId}: erro ao listar storage — ${listaError?.message}`)
      continue
    }

    for (const arq of arqsDoSinistro) {
      // O path no storage é: {empresaId}/{sinistroId}/{timestamp}-{nome}
      // Encontra o arquivo cujo nome termina com -{arq.nome}
      const match = listaStorage.find(f => f.name.endsWith(`-${arq.nome}`))

      if (!match) {
        detalhes.push(`arquivo "${arq.nome}" (${arq.id}): não encontrado no bucket`)
        naoEncontrados++
        continue
      }

      const storagePath = `${prefix}${match.name}`

      const { error: updateError } = await supabase
        .from('arquivos')
        .update({ storage_path: storagePath })
        .eq('id', arq.id)

      if (updateError) {
        detalhes.push(`arquivo "${arq.nome}" (${arq.id}): erro ao atualizar — ${updateError.message}`)
      } else {
        atualizados++
        detalhes.push(`arquivo "${arq.nome}": recuperado → ${storagePath}`)
      }
    }
  }

  return NextResponse.json({
    message: `Backfill concluído. ${atualizados} arquivo(s) recuperado(s), ${naoEncontrados} não encontrado(s).`,
    atualizados,
    naoEncontrados,
    detalhes,
  })
}
