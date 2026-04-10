'use server'

import { createServerClient } from './supabase'
import type { Sinistro, StatusSinistro, SinistroDB, ArquivoDB } from './types'

// Converte o formato do banco (snake_case) para o formato do app (camelCase)
function dbToSinistro(row: SinistroDB, arquivos: ArquivoDB[] = []): Sinistro {
  return {
    id: row.id,
    tipoEvento: row.tipo_evento,
    dados: {
      nomeSegurado: row.nome_segurado,
      cpf: row.cpf,
      placa: row.placa,
      dataHora: row.data_hora_sinistro,
      local: row.local,
      relato: row.relato,
    },
    arquivos: arquivos.map(a => ({
      nome: a.nome,
      tipo: a.tipo,
      tamanho: a.tamanho,
    })),
    status: row.status,
    criadoEm: row.criado_em,
    analise: row.analise ?? undefined,
  }
}

export async function getSinistrosDB(empresaId: string): Promise<Sinistro[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('sinistros')
    .select('*, arquivos(*)')
    .eq('empresa_id', empresaId)
    .order('criado_em', { ascending: false })

  if (error || !data) return []

  return data.map((row: SinistroDB & { arquivos: ArquivoDB[] }) =>
    dbToSinistro(row, row.arquivos)
  )
}

export async function getSinistroDB(id: string): Promise<Sinistro | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('sinistros')
    .select('*, arquivos(*)')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return dbToSinistro(data, data.arquivos ?? [])
}

export async function saveSinistroDB(
  sinistro: Sinistro,
  empresaId: string,
  usuarioId?: string
): Promise<void> {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('sinistros')
    .upsert({
      id: sinistro.id,
      empresa_id: empresaId,
      usuario_id: usuarioId ?? null,
      tipo_evento: sinistro.tipoEvento,
      status: sinistro.status,
      nome_segurado: sinistro.dados.nomeSegurado,
      cpf: sinistro.dados.cpf,
      placa: sinistro.dados.placa,
      data_hora_sinistro: sinistro.dados.dataHora,
      local: sinistro.dados.local,
      relato: sinistro.dados.relato,
      analise: sinistro.analise ?? null,
    })

  if (error) throw new Error(error.message)

  // Salvar arquivos — base64 não vai para o banco, apenas metadados
  if (sinistro.arquivos.length > 0) {
    await supabase.from('arquivos').delete().eq('sinistro_id', sinistro.id)
    await supabase.from('arquivos').insert(
      sinistro.arquivos.map(a => ({
        sinistro_id: sinistro.id,
        nome: a.nome,
        tipo: a.tipo,
        tamanho: a.tamanho,
        storage_path: null,
      }))
    )
  }
}

export async function updateSinistroStatusDB(
  id: string,
  status: StatusSinistro
): Promise<void> {
  const supabase = createServerClient()
  await supabase.from('sinistros').update({ status }).eq('id', id)
}

export async function generateSinistroId(empresaId: string): Promise<string> {
  const supabase = createServerClient()
  const { count } = await supabase
    .from('sinistros')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', empresaId)

  const num = (count ?? 0) + 1
  return `SIN-${String(num).padStart(3, '0')}`
}
