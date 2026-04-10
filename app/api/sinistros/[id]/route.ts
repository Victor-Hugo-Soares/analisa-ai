import { NextRequest, NextResponse } from 'next/server'
import { getSinistroDB, updateSinistroStatusDB } from '@/lib/db'
import type { StatusSinistro } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sinistro = await getSinistroDB(id)
  if (!sinistro) {
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }
  return NextResponse.json({ sinistro })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { status } = await req.json() as { status: StatusSinistro }
  await updateSinistroStatusDB(id, status)
  return NextResponse.json({ success: true })
}
